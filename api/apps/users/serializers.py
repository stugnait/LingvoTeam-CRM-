import random
import secrets
import string

from django.core.validators import RegexValidator

from .models.editor_language_pairs import EditorLanguagePairs
from .models.user import User
from .models import Role
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode

from .models import Permission, RolePermission
from .models.user_permission import UserPermission  # 👈 нова модель


# ---------------------------------------------------------------------------
# Permission & Role
# ---------------------------------------------------------------------------

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ('id', 'name', 'slug')


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ('id', 'name', 'slug')


class RoleWithPermissionsSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()

    def get_permissions(self, obj):
        perms = Permission.objects.filter(rolepermission__role=obj)
        return PermissionSerializer(perms, many=True).data

    class Meta:
        model = Role
        fields = ('id', 'name', 'slug', 'permissions')


class RoleCreateUpdateSerializer(serializers.ModelSerializer):
    permission_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Role
        fields = ('id', 'name', 'slug', 'permission_ids')

    def create(self, validated_data):
        permission_ids = validated_data.pop('permission_ids', [])
        role = Role.objects.create(**validated_data)
        for perm_id in permission_ids:
            RolePermission.objects.create(role=role, permission_id=perm_id)
        return role

    def update(self, instance, validated_data):
        permission_ids = validated_data.pop('permission_ids', None)
        instance.name = validated_data.get('name', instance.name)
        instance.slug = validated_data.get('slug', instance.slug)
        instance.save()

        if permission_ids is not None:
            RolePermission.objects.filter(role=instance).delete()
            for perm_id in permission_ids:
                RolePermission.objects.create(role=instance, permission_id=perm_id)

        return instance


class RolePermissionSerializer(serializers.ModelSerializer):
    permission = PermissionSerializer(read_only=True)
    permission_id = serializers.PrimaryKeyRelatedField(
        queryset=Permission.objects.all(),
        source='permission',
        write_only=True
    )

    class Meta:
        model = RolePermission
        fields = ('id', 'role', 'permission', 'permission_id')


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['full_name'] = user.full_name
        token['role'] = user.role.name if user.role else 'None'
        return token


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_all_permission_slugs(user: User) -> list[str]:
    """
    Повертає об'єднання прав ролі + індивідуальних прав юзера.
    """
    role_slugs: set[str] = set()
    if user.role_id:
        role_slugs = set(
            RolePermission.objects.filter(role_id=user.role_id)
            .values_list('permission__slug', flat=True)
        )

    extra_slugs: set[str] = set(
        UserPermission.objects.filter(user=user)
        .values_list('permission__slug', flat=True)
    )

    return list(role_slugs | extra_slugs)


def _get_extra_permission_ids(user: User) -> list[int]:
    return list(
        UserPermission.objects.filter(user=user)
        .values_list('permission_id', flat=True)
    )


# ---------------------------------------------------------------------------
# UserSerializer  (використовується для /me та токена)
# ---------------------------------------------------------------------------

class UserSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        source='role',
        required=False,
        allow_null=True,
        write_only=True
    )
    avatar = serializers.SerializerMethodField()

    # Всі slug-и (роль + індивідуальні) — для фронту щоб перевіряти доступи
    permissions = serializers.SerializerMethodField()

    # Тільки індивідуальні id — для wizard-у редагування
    extra_permission_ids = serializers.SerializerMethodField()

    def get_avatar(self, obj):
        return obj.avatar or None

    def get_permissions(self, obj):
        return _get_all_permission_slugs(obj)

    def get_extra_permission_ids(self, obj):
        return _get_extra_permission_ids(obj)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'phone',
            'role', 'role_id',
            'is_active', 'avatar',
            'permissions',        # slug-и для перевірки доступу
            'extra_permission_ids',  # id для wizard-у
        ]


# ---------------------------------------------------------------------------
# UserListSerializer  (для таблиці списку юзерів)
# ---------------------------------------------------------------------------

class UserListSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    language_pairs = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    extra_permission_ids = serializers.SerializerMethodField()

    def get_avatar(self, obj):
        return obj.avatar or None

    def get_language_pairs(self, obj):
        if not obj.role or obj.role.id != 2:
            return []
        pairs = EditorLanguagePairs.objects.filter(editor_id=obj.id).select_related('language_pair')
        return [
            {
                "id": pair.id,
                "language_pair_id": pair.language_pair.id,
                "name": str(pair.language_pair),
                "source_language": pair.language_pair.source_language.name,
                "target_language": pair.language_pair.target_language.name,
            }
            for pair in pairs
        ]

    def get_extra_permission_ids(self, obj):
        return _get_extra_permission_ids(obj)

    class Meta:
        model = User
        fields = (
            'id', 'email', 'phone', 'full_name',
            'role', 'is_active',
            'language_pairs', 'avatar',
            'extra_permission_ids',
        )


# ---------------------------------------------------------------------------
# UserUpdateSerializer  (для адмін-редагування юзера, включно з аватаром)
# ---------------------------------------------------------------------------

class UserUpdateSerializer(serializers.ModelSerializer):
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        source='role',
        required=False,
        allow_null=True,
        write_only=True
    )
    role = RoleSerializer(read_only=True)


    # Індивідуальні права (write-only при збереженні, read через SerializerMethod)
    extra_permission_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )
    # Вказуємо, що чекаємо файл, але не зберігаємо його стандартно
    avatar = serializers.ImageField(required=False, allow_null=True, write_only=True)

    # Read-only поля
    permissions = serializers.SerializerMethodField()
    extra_permission_ids_read = serializers.SerializerMethodField()

    def get_permissions(self, obj):
        return _get_all_permission_slugs(obj)

    def get_extra_permission_ids_read(self, obj):
        return _get_extra_permission_ids(obj)

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['avatar'] = instance.avatar or None
        # Перейменовуємо read-поле на зручне ім'я для фронту
        rep['extra_permission_ids'] = rep.pop('extra_permission_ids_read', [])
        return rep

    def update(self, instance, validated_data):
        avatar_file = validated_data.pop('avatar', None)
        extra_permission_ids = validated_data.pop('extra_permission_ids', None)
        # 2. Оновлюємо всі інші текстові поля
        instance = super().update(instance, validated_data)


        # Оновлення аватарки через Dropbox
        if avatar_file:
            from ..dropbox_services.dropbox_utils import upload_user_avatar
            avatar_url = upload_user_avatar(instance, avatar_file)
            if avatar_url:
                instance.avatar = avatar_url
                instance.save(update_fields=['avatar'])

        # Оновлення індивідуальних прав (якщо передані)
        if extra_permission_ids is not None:
            UserPermission.objects.filter(user=instance).delete()
            for perm_id in extra_permission_ids:
                try:
                    UserPermission.objects.create(user=instance, permission_id=perm_id)
                except Exception:
                    pass  # ігноруємо дублікати або невалідні id

        return instance

    class Meta:
        model = User
        fields = (
            'id', 'email', 'full_name', 'phone',
            'role_id', 'role', 'avatar',
            'extra_permission_ids',       # write
            'extra_permission_ids_read',  # read (буде перейменовано в to_representation)
            'permissions',
        )
        read_only_fields = ('id',)

class UserSelfUpdateSerializer(serializers.ModelSerializer):
    # Те саме тут
    avatar = serializers.ImageField(required=False, allow_null=True, write_only=True)

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['avatar'] = instance.avatar if instance.avatar else None
        return rep

    def update(self, instance, validated_data):
        avatar_file = validated_data.pop('avatar', None)

        instance = super().update(instance, validated_data)

        if avatar_file:
            from ..dropbox_services.dropbox_utils import upload_user_avatar
            avatar_url = upload_user_avatar(instance, avatar_file)
            if avatar_url:
                instance.avatar = avatar_url
                instance.save(update_fields=['avatar'])

        return instance

    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'phone', 'avatar')
        read_only_fields = ('id',)


# ---------------------------------------------------------------------------
# RegistrationSerializer
# ---------------------------------------------------------------------------

class RegistrationSerializer(serializers.ModelSerializer):
    password_validator = RegexValidator(
        regex=r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$',
        message="Пароль має містити хоча б одну велику літеру, одну малу літеру та цифру."
    )

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        required=True,
        validators=[password_validator]
    )

    role = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        required=True
    )

    avatar = serializers.ImageField(required=False, allow_null=True, write_only=True)

    # Індивідуальні права одразу при реєстрації (опціонально)
    extra_permission_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        default=list,
    )

    class Meta:
        model = User
        fields = ('email', 'full_name', 'phone', 'role', 'password', 'avatar', 'extra_permission_ids')

    def create(self, validated_data):
        avatar = validated_data.pop('avatar', None)
        password = validated_data.pop('password')
        extra_permission_ids = validated_data.pop('extra_permission_ids', [])

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        if avatar:
            from ..dropbox_services.dropbox_utils import upload_user_avatar
            avatar_url = upload_user_avatar(user, avatar)
            if avatar_url:
                user.avatar = avatar_url
                user.save(update_fields=['avatar'])

        for perm_id in extra_permission_ids:
            try:
                UserPermission.objects.create(user=user, permission_id=perm_id)
            except Exception:
                pass

        return user


# ---------------------------------------------------------------------------
# Решта серіалізаторів
# ---------------------------------------------------------------------------

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, min_length=8, required=True)
    new_password_confirm = serializers.CharField(write_only=True, min_length=8, required=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError({"new_password_confirm": "Паролі не збігаються."})
        return attrs


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, email):
        if not User.objects.filter(email=email, is_active=True).exists():
            raise serializers.ValidationError("Користувача з таким email не існує.")
        return email


class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
    new_password_confirm = serializers.CharField(min_length=8)

    def validate(self, data):
        if data["new_password"] != data["new_password_confirm"]:
            raise serializers.ValidationError("Паролі не співпадають.")
        try:
            uid = force_str(urlsafe_base64_decode(data["uid"]))
            user = User.objects.get(pk=uid)
        except Exception:
            raise serializers.ValidationError("Невалідний uid.")
        if not default_token_generator.check_token(user, data["token"]):
            raise serializers.ValidationError("Невалідний або прострочений токен.")
        data["user"] = user
        return data


class EditorLanguagePairsSerializer(serializers.ModelSerializer):
    editor_id = serializers.IntegerField()
    language_pair = serializers.IntegerField(source='language_pair_id')

    class Meta:
        model = EditorLanguagePairs
        fields = ['id', 'language_pair', 'editor_id']

    def validate_editor_id(self, value):
        try:
            user = User.objects.get(id=value)
            if user.role_id != 2:
                raise serializers.ValidationError("Користувач не є редактором (role_id має бути 2).")
        except User.DoesNotExist:
            raise serializers.ValidationError("Користувача з таким ID не існує.")
        return value
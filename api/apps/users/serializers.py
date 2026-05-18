import random
import secrets
import string

import dropbox
from django.core.validators import RegexValidator

from .models.editor_language_pairs import EditorLanguagePairs
from .models.user import User
from .models import Role
from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode

from .models import Permission, RolePermission

from ..dropbox_services.dropbox_utils import get_dbx


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
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


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['full_name'] = user.full_name
        token['role'] = user.role.name if user.role else 'None'
        return token


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ('id', 'name', 'slug')


class UserSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        source='role',
        required=False,
        allow_null=True,
        write_only=True
    )
    role = RoleSerializer(read_only=True)
    avatar = serializers.SerializerMethodField()

    def get_avatar(self, obj):
        if obj.avatar:
            return obj.avatar  # просто повертаємо URL-рядок з Dropbox
        return None

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'phone', 'role', 'role_id', 'is_active', 'avatar', 'permissions']

    def get_permissions(self, obj):
        if not getattr(obj, 'role', None):
            return []

        # Робимо прямий запит до проміжної таблиці
        perms = RolePermission.objects.filter(role=obj.role).values_list('permission__slug', flat=True)
        return list(perms)


class UserListSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    language_pairs = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    def get_avatar(self, obj):
        if obj.avatar:
            return obj.avatar  # просто повертаємо URL-рядок з Dropbox
        return None

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

    class Meta:
        model = User
        fields = ('id', 'email', 'phone', 'full_name', 'role', 'is_active', 'language_pairs', 'avatar')


class UserUpdateSerializer(serializers.ModelSerializer):
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        source='role',
        required=False,
        allow_null=True,
        write_only=True
    )
    role = RoleSerializer(read_only=True)
    avatar = serializers.ImageField(
        required=False,
        allow_null=True,
        write_only=True,
        source='avatar_upload'  # 👈 фіктивне ім'я, щоб не конфліктувало з полем моделі
    )

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['avatar'] = instance.avatar or None
        return rep

    def update(self, instance, validated_data):
        avatar_file = validated_data.pop('avatar_upload', None)  # 👈 той самий фіктивний ключ

        instance = super().update(instance, validated_data)

        if avatar_file:
            from ..dropbox_services.dropbox_utils import upload_user_avatar
            print("UPLOADING AVATAR:", avatar_file.name)
            avatar_url = upload_user_avatar(instance, avatar_file)
            print("AVATAR URL:", avatar_url)
            if avatar_url:
                instance.avatar = avatar_url
                instance.save(update_fields=['avatar'])

        return instance

    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'phone', 'role_id', 'role', 'avatar')
        read_only_fields = ('id',)


class UserSelfUpdateSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(required=False, allow_null=True, write_only=True)

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['avatar'] = instance.avatar or None
        return rep

    def update(self, instance, validated_data):
        avatar_file = validated_data.pop('avatar', None)

        instance = super().update(instance, validated_data)

        if avatar_file:
            from ..dropbox_services.dropbox_utils import upload_user_avatar
            print("UPLOADING AVATAR:", avatar_file.name)
            avatar_url = upload_user_avatar(instance, avatar_file)
            print("AVATAR URL:", avatar_url)
            if avatar_url:
                instance.avatar = avatar_url
                instance.save(update_fields=['avatar'])

        return instance

    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'phone', 'avatar')
        read_only_fields = ('id',)


# --- решта серіалізаторів без змін ---

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

    # 👇 Явно оголошуємо як поле для файлу
    avatar = serializers.ImageField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = User
        fields = ('email', 'full_name', 'phone', 'role', 'password', 'avatar')

    def create(self, validated_data):
        avatar = validated_data.pop('avatar', None)
        password = validated_data.pop('password')

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        if avatar:
            from ..dropbox_services.dropbox_utils import upload_user_avatar
            print("UPLOADING AVATAR:", avatar.name)
            avatar_url = upload_user_avatar(user, avatar)
            print("AVATAR URL:", avatar_url)
            if avatar_url:
                user.avatar = avatar_url
                user.save(update_fields=['avatar'])

        return user


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
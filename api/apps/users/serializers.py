import random
import secrets
import string

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
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        source='role',
        required=False,
        allow_null=True,
        write_only=True
    )

    role = RoleSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'full_name',
            'phone',
            'role', 'role_id',
            'is_active'
        ]


from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from apps.users.models import EditorLanguagePairs


class UserListSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    language_pairs = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'phone', 'full_name', 'role', 'is_active', 'language_pairs')

    @extend_schema_field(serializers.ListField(child=serializers.DictField()))
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


class UserUpdateSerializer(serializers.ModelSerializer):
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        source='role',
        required=False,
        allow_null=True,
        write_only=True
    )

    role = RoleSerializer(read_only=True)

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'full_name',
            'phone',
            'role_id',
            'role',
        )

        read_only_fields = ('id',)

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, min_length=8, required=True)
    new_password_confirm = serializers.CharField(write_only=True, min_length=8, required=True)
    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError({"new_password_confirm": "Паролі не збігаються."})
        return attrs

class UserSelfUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'full_name',
            'phone'
        )

        read_only_fields = ('id',)

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
            uid = force_str(urlsafe_base64_decode(data["uid"])) # секуріті
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

    class Meta:
        model = User
        fields = (
            'email',
            'full_name',
            'phone',
            'role',
            'password',
        )
        extra_kwargs = {
            'password': {'write_only': True},
            'full_name': {'required': True},
            'email': {'required': True},
            'role': {'required': True},
        }

    def create(self, validated_data):
        password = validated_data.pop('password')

        user = User(**validated_data)

        user.set_password(password)
        user.save()

        return user


from rest_framework import serializers
from .models import EditorLanguagePairs
from apps.users.models import User # перевір шлях до моделі User

class EditorLanguagePairsSerializer(serializers.ModelSerializer):
    # Явно кажемо: це поле можна писати!
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
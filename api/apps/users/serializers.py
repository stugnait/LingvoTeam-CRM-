import random
import secrets
import string

from django.core.validators import RegexValidator
from .models.user import User
from .models import Role
from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


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
            'role', 'role_id'
        ]


class UserListSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'full_name',
            'role',
        )


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

class RegistrationSerializer(serializers.ModelSerializer):
    # Поля телефону залишаємо без змін
    phone_country_code = serializers.CharField(
        max_length=5,
        write_only=True,
        validators=[RegexValidator(r'^\+[0-9]{1,3}$', message="Format: +380")]
    )
    phone_national_number = serializers.CharField(
        max_length=20,
        write_only=True,
        validators=[RegexValidator(r'^[0-9]{6,14}$', message="Digits only")]
    )

    # Пароль тепер тільки для читання, щоб повернути його після створення
    generated_password = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = (
            'full_name',
            'email',
            'phone',
            'role',
            'generated_password', # Додаємо, щоб фронтенд міг його показати
            'phone_country_code',
            'phone_national_number'
        )
        extra_kwargs = {
            'role': {'required': True},
            'phone': {'read_only': True}
        }

    def create(self, validated_data):
        # 1. Формуємо номер телефону
        country_code = validated_data.pop('phone_country_code')
        national_number = validated_data.pop('phone_national_number')
        validated_data['phone'] = country_code + national_number

        lowercase = string.ascii_lowercase
        uppercase = string.ascii_uppercase
        digits = string.digits
        all_characters = lowercase + uppercase + digits

        password_list = [
            secrets.choice(lowercase),
            secrets.choice(uppercase),
            secrets.choice(digits)  # Додав цифру для надійності
        ]

        password_list += [secrets.choice(all_characters) for _ in range(9)]

        random.shuffle(password_list)

        temporary_password = "".join(password_list)
        user = User(**validated_data)
        user.password = make_password(temporary_password)
        user.save()

        user.generated_password =temporary_password
        return user

    def validate(self, data):
        # Валідація збігу паролів більше не потрібна, бо користувач їх не вводить
        return data
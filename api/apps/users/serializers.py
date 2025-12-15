from django.core.validators import RegexValidator
from .models.user import User
from rest_framework import serializers
from django.contrib.auth.hashers import make_password

class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, required=True)
    password_confirm = serializers.CharField(write_only=True, min_length=8, required=True)

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

    class Meta:
        model = User
        fields = (
            'full_name',
            'email',
            'phone',
            'role',
            'password',
            'password_confirm',
            'phone_country_code',
            'phone_national_number'
        )
        extra_kwargs = {
            'password': {'write_only': True},
            'role': {'required': True}
        }

    def create(self, validated_data):
        password = validated_data.pop('password')
        password_confirm = validated_data.pop('password_confirm')

        country_code = validated_data.pop('phone_country_code')
        national_number = validated_data.pop('phone_national_number')
        validated_data['phone'] = country_code + national_number

        hashed_password = make_password(password)
        user = User(**validated_data)
        user.password = hashed_password
        user.save()

        return user

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Паролі не збігаються."})

        return data
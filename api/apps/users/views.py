import random
import secrets
import string

from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.template.backends import django
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from LingvoTeam import settings
from .authentification import set_auth_cookies
from .serializers import RegistrationSerializer, UserUpdateSerializer, \
    CustomTokenObtainPairSerializer, UserSerializer
from drf_spectacular.utils import extend_schema
from rest_framework_simplejwt.views import (
    TokenRefreshView as OriginalTokenRefreshView, TokenObtainPairView,
)
import django.utils.crypto
from django.core.mail import send_mail

from rest_framework.response import Response
from rest_framework import status

access_lifetime = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
refresh_lifetime = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']
User = get_user_model()


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserUpdateSerializer
    # permission_classes = (IsAdminUser,)

    lookup_field = 'id'

    def get_queryset(self):
        return User.objects.all().select_related('role')

class AdminBlackoutUserView(APIView):
    #permission_classes = [IsAdminUser]

    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)

        user.is_active = False
        user.save()

        return Response({"detail": f"User {user_id} has been deactivated (blackout)."}, status=200)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = RegistrationSerializer

    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active', 'role', 'role__slug']

    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        user = self.get_object()
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
        user.set_password(temporary_password)
        user.save()

        subject = 'Ваш тимчасовий пароль'
        message = f"""
            Вітаємо, {user.full_name}!

            Адміністратор скинув ваш пароль. 
            Ваш новий тимчасовий пароль: {temporary_password}

            Будь ласка, змініть його після входу в систему.
            """

        try:
            send_mail(
                subject,
                message,
                settings.EMAIL_HOST_USER,
                [user.email],
                fail_silently=False,
            )
            return Response(
                {"detail": f"Новий пароль надіслано на пошту {user.email}"},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"detail": f"Пароль змінено, але помилка при відправці пошти: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        response = Response({"detail": "Logout successful."}, status=status.HTTP_200_OK)

        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')


        return response

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.user

        tokens = serializer.validated_data
        access = tokens.get('access')
        refresh = tokens.get('refresh')

        user_data = UserUpdateSerializer(user).data

        response = Response({
            "message": "success",
            "user": user_data,
        })

        set_auth_cookies(response, access, refresh)

        return response


class CustomTokenRefreshView(OriginalTokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return Response({"detail": "Refresh token not found."},
                            status=status.HTTP_401_UNAUTHORIZED)

        request.data['refresh'] = refresh_token

        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            # ❗ ЗМІНА ПОРЯДКУ ТА БЕЗПЕКИ: спочатку отримуємо, потім встановлюємо, потім очищаємо ❗
            access_token = response.data.get('access')  # Отримуємо токен

            # Встановлення Access Token
            if access_token:
                response.set_cookie(
                    key='access_token',
                    value=access_token,
                    max_age=int(access_lifetime.total_seconds()),
                    httponly=True,
                    secure=False
                )

            # Очищуємо тіло відповіді
            response.data.pop('access', None)
            response.data.pop('refresh', None)  # SimpleJWT може повертати новий refresh-токен при ротації

        return response


@extend_schema(tags=['Authentication'])
class RegistrationView(generics.CreateAPIView):
    serializer_class = RegistrationSerializer
    #permission_classes = (IsAdminUser,)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        resp = Response({
            **serializer.data,
            'message': 'Реєстрація успішна.'
        }, status=status.HTTP_201_CREATED)
        return resp

from django.contrib.auth import get_user_model
from rest_framework import generics, status, viewsets
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.views import APIView

from LingvoTeam import settings
from .authentification import set_auth_cookies
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from .serializers import ChangePasswordSerializer, ForgotPasswordSerializer, RegistrationSerializer, ResetPasswordSerializer, UserListSerializer, UserSelfUpdateSerializer, UserUpdateSerializer, \
    CustomTokenObtainPairSerializer, UserSerializer
from drf_spectacular.utils import extend_schema
from rest_framework_simplejwt.views import (
    TokenObtainPairView as OriginalTokenObtainPairView,
    TokenRefreshView as OriginalTokenRefreshView, TokenObtainPairView,
)
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from rest_framework.response import Response
from rest_framework import status

from .utils import StandardResultsPagination

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
    serializer_class = UserSerializer
    #permission_classes = ...

    @action(detail=False, methods=['patch'], url_path='user/update', serializer_class=UserSelfUpdateSerializer, permission_classes=[IsAuthenticated])
    def update_user(self, request):
        user = request.user
        serializer = self.get_serializer(
            user,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {
                "message": "Дані успішно оновлено.",
                "user": serializer.data
            },
            status=status.HTTP_200_OK
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="me",
        permission_classes=[IsAuthenticated],
        serializer_class=UserSerializer,
    )
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=["post"], url_path='user/change-password', permission_classes=[IsAuthenticated])
    def change_password(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data["current_password"]):
            return Response(
                {"detail": "Неправильний поточний пароль."},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.set_password(serializer.validated_data["new_password"])
        user.save()

        refresh_token = request.COOKIES.get("refresh-token")
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except Exception:
                pass # поки просто ігнор

        resp = Response(
            {"message": "Пароль успішно змінено. Зайдіть знову в акаунт.", "logout": True},
            status=status.HTTP_200_OK
        )
        resp.delete_cookie("access-token")
        resp.delete_cookie("refresh-token")
        return resp

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = User.objects.get(email=serializer.validated_data["email"])

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

        send_mail(
            subject="Відновлення паролю.",
            message=f"Перейдіть за посиланням для зміни пароля:\n{reset_link}",
            from_email=settings.MAIL_USERNAME,
            recipient_list=[user.email],
        )
        return Response(
            {
                "detail": "Лист відправлено на пошту.",
                "reset_link": reset_link,
            },
            status=status.HTTP_200_OK
        )

class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        user.set_password(serializer.validated_data["new_password"])
        user.save()

        response = Response(
            {"detail": "Пароль успішно змінено. Будь ласка, увійдіть знову."},
            status=status.HTTP_200_OK
        )

        response.delete_cookie("access-token")
        response.delete_cookie("refresh-token")

        return response



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
    # permission_classes = (IsAdminUser,)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        resp = Response({
            **serializer.data,
            'message': 'Реєстрація успішна.'
        }, status=status.HTTP_201_CREATED)
        return resp

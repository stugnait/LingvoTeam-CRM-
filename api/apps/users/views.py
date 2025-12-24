import random
import secrets
import string

from django.contrib.auth import get_user_model
from rest_framework import generics, viewsets, status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from LingvoTeam import settings
from .authentification import set_auth_cookies
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from .serializers import ChangePasswordSerializer, ForgotPasswordSerializer, ResetPasswordSerializer, \
    UserSelfUpdateSerializer, UserListSerializer
from .serializers import RegistrationSerializer, UserUpdateSerializer, \
    CustomTokenObtainPairSerializer, UserSerializer
from drf_spectacular.utils import extend_schema
from rest_framework_simplejwt.views import (
    TokenRefreshView as OriginalTokenRefreshView, TokenObtainPairView,
)
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.core.mail import send_mail


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


class AdminToggleUserStatusView(APIView):
    # permission_classes = [IsAdminUser]

    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)

        # 👇 Інвертуємо статус (було True стане False, було False стане True)
        user.is_active = not user.is_active
        user.save()

        status_msg = "activated" if user.is_active else "deactivated"

        return Response({
            "detail": f"User {user_id} has been {status_msg}.",
            "is_active": user.is_active
        }, status=200)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()



    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active', 'role', 'role__slug']

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return UserListSerializer

        elif self.action == 'update_user':
            return UserSelfUpdateSerializer

        elif self.action == 'me':
            return UserSerializer

        return RegistrationSerializer

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

        response.delete_cookie('access-token')
        response.delete_cookie('refresh-token')


        return response


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.user
        tokens = serializer.validated_data

        # ✅ Правильні ключі
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
        refresh_token = request.COOKIES.get('refresh-token')

        if not refresh_token:
            return Response(
                {"detail": "Refresh token not found."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        request.data['refresh'] = refresh_token

        response = super().post(request, *args, **kwargs)

        if response.status_code == status.HTTP_200_OK:
            # ✅ Правильний ключ
            access_token = response.data.get('access')

            if access_token:
                response.set_cookie(
                    key='access-token',
                    value=access_token,
                    max_age=int(access_lifetime.total_seconds()),
                    httponly=True,
                    secure=not settings.DEBUG,
                    samesite='Lax'
                )

            # Очищуємо тіло відповіді
            response.data.pop('access', None)
            response.data.pop('refresh', None)

        return response


@extend_schema(tags=['Authentication'])
class RegistrationView(generics.CreateAPIView):
    serializer_class = RegistrationSerializer
    # permission_classes = (IsAdminUser,)

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        final_password = data.get('password')

        if not final_password:
            lowercase = string.ascii_lowercase
            uppercase = string.ascii_uppercase
            digits = string.digits
            all_characters = lowercase + uppercase + digits

            password_list = [
                secrets.choice(lowercase),
                secrets.choice(uppercase),
                secrets.choice(digits)
            ]
            password_list += [secrets.choice(all_characters) for _ in range(9)]
            random.shuffle(password_list)

            generated_password = "".join(password_list)
            data['password'] = generated_password
            final_password = generated_password

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        email_subject = 'Реєстрація успішна'
        email_message = f"""
        Вітаємо, {user.full_name}!

        Ваш обліковий запис створено успішно.
        Ваші дані для входу:

        Email: {user.email}
        Пароль: {final_password}

        Будь ласка, змініть пароль після першого входу.
        """

        try:
            send_mail(
                email_subject,
                email_message,
                settings.EMAIL_HOST_USER,
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Помилка відправки пошти: {e}")

        return Response({
            'user_id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role.id,  # Повертаємо ID ролі
            'password': final_password,  # Залишаємо і тут для зручності
            'message': 'Користувача зареєстровано, пароль надіслано на пошту.'
        }, status=status.HTTP_201_CREATED)



import random
import secrets
import string

from django.contrib.auth import get_user_model
from drf_spectacular.types import OpenApiTypes
from rest_framework import generics, viewsets, status
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from LingvoTeam import settings
from .authentification import set_auth_cookies
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from .models.user_permission import UserPermission
from .serializers import ChangePasswordSerializer, ForgotPasswordSerializer, ResetPasswordSerializer, \
    UserSelfUpdateSerializer, UserListSerializer, EditorLanguagePairsSerializer
from .serializers import RegistrationSerializer, UserUpdateSerializer, \
    CustomTokenObtainPairSerializer, UserSerializer
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework_simplejwt.views import (
    TokenRefreshView as OriginalTokenRefreshView, TokenObtainPairView,
)
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.core.mail import send_mail
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Permission, RolePermission, Role
from .serializers import (
    PermissionSerializer, RoleWithPermissionsSerializer,
    RoleCreateUpdateSerializer, RolePermissionSerializer
)

from rest_framework import serializers
from .models import EditorLanguagePairs

from rest_framework import viewsets

@extend_schema_view(
    list=extend_schema(
        summary="Список мовних пар редакторів",
        description="Отримати список усіх зв'язків між редакторами та їхніми мовними парами.",
        tags=["Editor Language Pairs"]
    ),
    retrieve=extend_schema(
        summary="Деталі мовної пари",
        description="Отримати детальну інформацію про конкретну мовну пару за її ID.",
        tags=["Editor Language Pairs"]
    ),
    create=extend_schema(
        summary="Призначити мовну пару редактору",
        description="Створює новий зв'язок між редактором (role_id=2) та мовною парою.",
        tags=["Editor Language Pairs"]
    ),
    update=extend_schema(
        summary="Повністю оновити мовну пару",
        description="Оновлює всі поля існуючого запису.",
        tags=["Editor Language Pairs"]
    ),
    partial_update=extend_schema(
        summary="Частково оновити мовну пару",
        description="Оновлює лише передані поля існуючого запису.",
        tags=["Editor Language Pairs"]
    ),
    destroy=extend_schema(
        summary="Видалити мовну пару",
        description="Видаляє зв'язок між редактором та мовною парою.",
        tags=["Editor Language Pairs"]
    ),
)

class EditorLanguagePairViewSet(viewsets.ModelViewSet):
    queryset = EditorLanguagePairs.objects.all()
    serializer_class = EditorLanguagePairsSerializer

access_lifetime = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
refresh_lifetime = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']
User = get_user_model()

@extend_schema_view(
    get=extend_schema(summary="Деталі користувача (Admin)", tags=["Users Management"]),
    put=extend_schema(summary="Оновити користувача (Admin)", tags=["Users Management"]),
    patch=extend_schema(summary="Часткове оновити користувача (Admin)", tags=["Users Management"]),
    delete=extend_schema(summary="Видалити користувача", tags=["Users Management"]),
)
class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserUpdateSerializer

    parser_classes = [MultiPartParser, FormParser]

    # permission_classes = (IsAdminUser,)

    lookup_field = 'id'

    def get_queryset(self):
        return User.objects.all().select_related('role')


class AdminToggleUserStatusView(APIView):
    # permission_classes = [IsAdminUser]

    @extend_schema(
        summary="Активувати/Деактивувати користувача",
        description="Перемикає статус is_active. Якщо користувач був активним — блокує, якщо заблокованим — активує.",
        responses={200: OpenApiTypes.OBJECT},
        tags=["Users Management"]
    )
    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)

        user.is_active = not user.is_active
        user.save()

        status_msg = "activated" if user.is_active else "deactivated"

        return Response({
            "detail": f"User {user_id} has been {status_msg}.",
            "is_active": user.is_active
        }, status=200)


@extend_schema_view(
    list=extend_schema(
        summary="Список користувачів",
        description="Отримати список всіх користувачів з можливістю фільтрації за роллю та статусом.",
        tags=["Users Management"]
    ),
    retrieve=extend_schema(summary="Деталі користувача", tags=["Users Management"]),
    create=extend_schema(summary="Створити користувача (Admin)", tags=["Users Management"]),
    update=extend_schema(summary="Оновити користувача", tags=["Users Management"]),
    partial_update=extend_schema(summary="Частково оновити користувача", tags=["Users Management"]),
    destroy=extend_schema(summary="Видалити користувача", tags=["Users Management"]),
)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    parser_classes = [MultiPartParser, FormParser, JSONParser]

    search_fields = ['first_name', 'last_name', 'full_name']
    ordering_fields = ['id', 'email', 'first_name', 'last_name']
    filterset_fields = ['is_active', 'role', 'role__slug']

    @action(detail=False, methods=['GET'], url_path='editors-by-language')
    def get_editors_by_language(self, request):
        language_pair_id = request.query_params.get('language_pair_id')

        if not language_pair_id:
            return Response(
                {"error": "Будь ласка, передайте параметр language_pair_id."},
                status=400
            )

        editor_ids = EditorLanguagePairs.objects.filter(
            language_pair_id=language_pair_id
        ).values_list('editor_id', flat=True)

        editors = User.objects.filter(
            id__in=editor_ids,
            role__permissions__slug='order.approve_translation'
        ).distinct().order_by('id')

        page = self.paginate_queryset(editors)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(editors, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='set-extra-permissions')
    def set_extra_permissions(self, request, pk=None):
        user = self.get_object()
        permission_ids = request.data.get('permission_ids', [])

        UserPermission.objects.filter(user=user).delete()

        created = []
        for perm_id in permission_ids:
            try:
                UserPermission.objects.create(user=user, permission_id=perm_id)
                created.append(perm_id)
            except Exception:
                pass

        return Response({
            "detail": f"Оновлено права для {user.full_name}",
            "permission_ids": created
        }, status=status.HTTP_200_OK)

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return UserListSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        elif self.action == 'update_user':
            return UserSelfUpdateSerializer
        elif self.action == 'me':
            return UserSerializer
        return RegistrationSerializer

    @extend_schema(
        summary="Скинути пароль (Admin)",
        description="Адміністратор генерує новий тимчасовий пароль для користувача та надсилає його на пошту.",
        request=None,
        responses={200: OpenApiTypes.OBJECT},
        tags=["Users Management"]
    )
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
            secrets.choice(digits)
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

    @action(detail=False, methods=["GET"], url_path="for-salary")
    def for_salary(self, request):
        role = request.query_params.get("role")

        queryset = User.objects.select_related("role").filter(is_active=True)

        if role:
            queryset = queryset.filter(role_id=role)

        serializer = UserListSerializer(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Оновити свій профіль",
        description="Дозволяє залогіненому користувачу змінити свої особисті дані.",
        request=UserSelfUpdateSerializer,
        tags=["Profile"]
    )
    @action(detail=False, methods=['patch'], url_path='user/update', serializer_class=UserSelfUpdateSerializer,
            permission_classes=[IsAuthenticated])
    def update_user(self, request):
        user = request.user

        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        if data.get('email') and isinstance(data.get('email'), str):
            data['email'] = data.get('email').lower()

        serializer = self.get_serializer(
            user,
            data=data,
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

    @extend_schema(
        summary="Отримати свій профіль",
        description="Повертає дані поточного авторизованого користувача.",
        responses={200: UserSerializer},
        tags=["Profile"]
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

    @extend_schema(
        summary="Змінити пароль",
        description="Зміна пароля поточного користувача. Після успішної зміни старі токени (Cookies) видаляються.",
        request=ChangePasswordSerializer,
        responses={200: OpenApiTypes.OBJECT},
        tags=["Profile"]
    )
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
                pass

        resp = Response(
            {"message": "Пароль успішно змінено. Зайдіть знову в акаунт.", "logout": True},
            status=status.HTTP_200_OK
        )
        resp.delete_cookie("access-token")
        resp.delete_cookie("refresh-token")
        return resp

@extend_schema(
        summary="Забули пароль?",
        description="Надсилає посилання для відновлення пароля на email користувача.",
        request=ForgotPasswordSerializer,
        responses={200: OpenApiTypes.OBJECT},
        tags=["Password Reset"]
    )
class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        if data.get('email') and isinstance(data.get('email'), str):
            data['email'] = data.get('email').lower()

        serializer = ForgotPasswordSerializer(data=data)
        serializer.is_valid(raise_exception=True)

        user = User.objects.get(email=serializer.validated_data["email"])

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

        send_mail(
            subject="Відновлення паролю.",
            message=f"Перейдіть за посиланням для зміни пароля:\n{reset_link}",
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[user.email],
        )
        return Response(
            {
                "detail": "Лист відправлено на пошту.",
                "reset_link": reset_link,
            },
            status=status.HTTP_200_OK
        )

@extend_schema(
        summary="Встановити новий пароль",
        description="Приймає токен з пошти та новий пароль.",
        request=ResetPasswordSerializer,
        responses={200: OpenApiTypes.OBJECT},
        tags=["Password Reset"]
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


@extend_schema(
        summary="Вихід з системи",
        description="Видаляє HttpOnly cookies з токенами (access-token, refresh-token).",
        responses={200: OpenApiTypes.OBJECT},
        tags=["Authentication"]
    )
class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        response = Response({"detail": "Logout successful."}, status=status.HTTP_200_OK)

        response.delete_cookie('access-token')
        response.delete_cookie('refresh-token')

        return response

@extend_schema(
        summary="Логін (JWT у Cookies)",
        responses={200: UserUpdateSerializer},
        tags=["Authentication"]
    )
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        if data.get('email') and isinstance(data.get('email'), str):
            data['email'] = data.get('email').lower()

        serializer = self.get_serializer(data=data)
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

    @extend_schema(summary="Оновити токен (Refresh)", tags=["Authentication"])
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
            access_token  = response.data.get('access')
            new_refresh   = response.data.get('refresh')  # ← ROTATE дає новий

            if access_token:
                response.set_cookie(
                    key='access-token',
                    value=access_token,
                    max_age=int(access_lifetime.total_seconds()),
                    httponly=True,
                    secure=not settings.DEBUG,
                    samesite='Lax'
                )

            # ← ДОДАЙ: зберігай новий refresh в cookie
            if new_refresh:
                response.set_cookie(
                    key='refresh-token',
                    value=new_refresh,
                    max_age=int(refresh_lifetime.total_seconds()),
                    httponly=True,
                    secure=not settings.DEBUG,
                    samesite='Lax'
                )

            response.data.pop('access', None)
            response.data.pop('refresh', None)

        return response


@extend_schema(tags=['Authentication'])
class RegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegistrationSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def create(self, request, *args, **kwargs):
        data = request.data.copy()

        if data.get('email') and isinstance(data.get('email'), str):
            data['email'] = data.get('email').lower()

        input_password = data.get('password')

        if not input_password or input_password.strip() == "":
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

            final_password = "".join(password_list)
            data['password'] = final_password
        else:
            final_password = input_password

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

        Будь ласка, збережіть ці дані.
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
            'full_name': user.full_name,
            'phone': user.phone,
            'role': user.role.id if hasattr(user, 'role') and user.role else None,
            'password': final_password,
            'message': 'Користувача успішно створено.'
        }, status=status.HTTP_201_CREATED)



@extend_schema_view(
    list=extend_schema(summary="Список всіх permissions", tags=["Roles & Permissions"]),
    retrieve=extend_schema(summary="Деталі permission", tags=["Roles & Permissions"]),
)
class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    pagination_class = None


@extend_schema_view(
    list=extend_schema(summary="Список ролей з permissions", tags=["Roles & Permissions"]),
    retrieve=extend_schema(summary="Деталі ролі", tags=["Roles & Permissions"]),
    create=extend_schema(summary="Створити роль", tags=["Roles & Permissions"]),
    update=extend_schema(summary="Оновити роль", tags=["Roles & Permissions"]),
    partial_update=extend_schema(summary="Частково оновити роль", tags=["Roles & Permissions"]),
    destroy=extend_schema(summary="Видалити роль", tags=["Roles & Permissions"]),
)
class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return RoleWithPermissionsSerializer
        return RoleCreateUpdateSerializer

    @extend_schema(
        summary="Призначити permissions до ролі (bulk)",
        description="Повністю замінює список permissions для ролі.",
        request=RoleCreateUpdateSerializer,
        tags=["Roles & Permissions"]
    )
    @action(detail=True, methods=['post'], url_path='set-permissions')
    def set_permissions(self, request, pk=None):
        role = self.get_object()
        permission_ids = request.data.get('permission_ids', [])

        RolePermission.objects.filter(role=role).delete()
        created = []
        for perm_id in permission_ids:
            try:
                RolePermission.objects.create(role=role, permission_id=perm_id)
                created.append(perm_id)
            except Exception:
                pass

        return Response({
            "detail": f"Роль '{role.name}' оновлено.",
            "permission_ids": created
        }, status=status.HTTP_200_OK)
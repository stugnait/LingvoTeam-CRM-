from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenBlacklistView

from .views import ForgotPasswordView, RegistrationView, ResetPasswordView, UserDetailView, CustomTokenObtainPairView, \
    CustomTokenRefreshView, \
    UserViewSet, AdminToggleUserStatusView

router = DefaultRouter()
router.register('users', UserViewSet, "users")

urlpatterns = [
    path('auth/register/', RegistrationView.as_view(), name='user-register'),
    path('list/', UserViewSet.as_view({'get': 'list', 'post': 'create'}), name='user-list'),
    path('<int:id>/', UserDetailView.as_view(), name='user-detail'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', TokenBlacklistView.as_view(), name='token_blacklist'),
    path('admin/users/<int:user_id>/toggle-status/', AdminToggleUserStatusView.as_view()),
    path("auth/forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),
    path("auth/reset-password/", ResetPasswordView.as_view(), name="reset-password"),

    path('', include(router.urls))
]

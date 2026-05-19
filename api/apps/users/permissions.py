from django.db import models

from rest_framework.permissions import BasePermission
from rest_framework.pagination import PageNumberPagination
from apps.users.models import User, RolePermission
from apps.users.models.user_permission import UserPermission


class HasPermission(BasePermission):
    message = "У вас немає прав для виконання цієї дії."

    def has_permission(self, request, view):
        user = request.user

        if not user or user.is_anonymous:
            return False

        if hasattr(view, 'get_required_permissions'):
            required = view.get_required_permissions(request)
        else:
            required = getattr(view, "required_permissions", [])

        if not required:
            return True

        if not hasattr(request, '_cached_permission_slugs'):
            request._cached_permission_slugs = _build_permission_slugs(user)

        return all(perm in request._cached_permission_slugs for perm in required)


class IsOwnerOrHasCustomPermission(BasePermission):
    message = "Ви не маєте прав для редагування цього об'єкта."

    def has_object_permission(self, request, view, obj):
        user = request.user

        if isinstance(obj, User) and obj.id == user.id:
            return True
        if getattr(obj, "manager_id_id", None) == user.id:
            return True
        if getattr(obj, "created_by_id", None) == user.id:
            return True

        admin_perms = getattr(view, 'admin_permissions', [])
        if not admin_perms:
            return False

        if not hasattr(request, '_cached_permission_slugs'):
            request._cached_permission_slugs = _build_permission_slugs(user)

        return any(perm in request._cached_permission_slugs for perm in admin_perms)


def _build_permission_slugs(user) -> set:
    """
    Об'єднує права ролі + індивідуальні права юзера в один set slug-ів.
    Кешується на request щоб не робити зайвих запитів.
    """
    slugs: set = set()

    # 1. Права з ролі
    if hasattr(user, 'role') and user.role:
        role_slugs = RolePermission.objects.filter(
            role=user.role
        ).values_list('permission__slug', flat=True)
        slugs.update(role_slugs)

    # 2. Індивідуальні права юзера
    extra_slugs = UserPermission.objects.filter(
        user=user
    ).values_list('permission__slug', flat=True)
    slugs.update(extra_slugs)

    return slugs


class CustomPageNumberPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50
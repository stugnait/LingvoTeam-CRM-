from rest_framework.permissions import BasePermission
from rest_framework.pagination import PageNumberPagination
from apps.users.models import User, RolePermission


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
            if hasattr(user, 'role') and user.role:
                slugs = RolePermission.objects.filter(
                    role=user.role
                ).values_list('permission__slug', flat=True)

                request._cached_permission_slugs = set(slugs)
            else:
                request._cached_permission_slugs = set()

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
            if hasattr(user, 'role') and user.role:
                request._cached_permission_slugs = set(
                    perm.slug for perm in user.role.permissions.all()
                )
            else:
                request._cached_permission_slugs = set()

        return any(perm in request._cached_permission_slugs for perm in admin_perms)


class CustomPageNumberPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50
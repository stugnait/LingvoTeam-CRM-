from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models.client import Client
from .models.client_category import ClientCategory
from .serializers import ClientSerializer, ClientCategorySerializer
from ..users.permissions import HasPermission

@extend_schema_view(
    list=extend_schema(summary="Список категорій клієнтів", description="Отримати перелік усіх категорій з їхніми знижками."),
    create=extend_schema(summary="Створити категорію", description="Додати нову категорію клієнтів (напр. VIP, Standard)."),
    retrieve=extend_schema(summary="Деталі категорії", description="Отримати інформацію про конкретну категорію за ID."),
    update=extend_schema(summary="Оновити категорію", description="Повне оновлення даних категорії."),
    partial_update=extend_schema(summary="Змінити категорію", description="Часткове оновлення полів категорії."),
    destroy=extend_schema(summary="Видалити категорію", description="Видалення категорії клієнтів з бази даних.")
)

class ClientCategoryViewSet(viewsets.ModelViewSet):
    queryset = ClientCategory.objects.all()
    serializer_class = ClientCategorySerializer
    permission_classes = [HasPermission]

    def get_required_permissions(self, request):
        mapping = {
            'create': ['client.create'],
            'list': ['client.view'],
            'retrieve': ['client.view'],
            'update': ['client.create'],  # Зазвичай право на створення включає редагування
            'partial_update': ['client.create'],
        }
        return mapping.get(self.action, [])


@extend_schema_view(
    list=extend_schema(summary="Список клієнтів", description="Отримати список усіх клієнтів з інформацією про їхні категорії."),
    retrieve=extend_schema(summary="Дані клієнта", description="Детальна інформація про конкретного клієнта."),
    create=extend_schema(summary="Додати клієнта", description="Реєстрація нового клієнта в системі."),
    update=extend_schema(summary="Редагувати клієнта", description="Повне оновлення профілю клієнта."),
    destroy=extend_schema(summary="Видалити клієнта", description="Видалення клієнта з системи.")
)

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.select_related('category').all()
    serializer_class = ClientSerializer
    permission_classes = [HasPermission]

    def get_required_permissions(self, request):
        if self.action in ['list', 'retrieve']:
            return ['client.view']
        return ['client.category.manage']
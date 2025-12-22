from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models.client import Client
from .models.client_category import ClientCategory
from .serializers import ClientSerializer, ClientCategorySerializer
from ..users.permissions import HasPermission


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



class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.select_related('category').all()
    serializer_class = ClientSerializer
    permission_classes = [HasPermission]

    def get_required_permissions(self, request):
        if self.action in ['list', 'retrieve']:
            return ['client.view']
        return ['client.category.manage']
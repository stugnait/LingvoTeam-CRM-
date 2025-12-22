from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models.client import Client
from .models.client_category import ClientCategory
from .serializers import ClientSerializer, ClientCategorySerializer

class ClientCategoryViewSet(viewsets.ModelViewSet):
    queryset = ClientCategory.objects.all()
    serializer_class = ClientCategorySerializer
   # permission_classes = [IsAuthenticated]

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.select_related('category').all()
    serializer_class = ClientSerializer
   # permission_classes = [IsAuthenticated]
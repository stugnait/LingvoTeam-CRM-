from rest_framework import serializers
from .models.client import Client
from .models.client_category import ClientCategory

class ClientCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientCategory
        fields = ['id', 'name', 'discount_percent']

class ClientSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, default="---")

    class Meta:
        model = Client
        fields = [
            'id',
            'full_name',
            'email',
            'phone_number',
            'category',
            'category_name',
            'created_at'
        ]
        read_only_fields = ['created_at']

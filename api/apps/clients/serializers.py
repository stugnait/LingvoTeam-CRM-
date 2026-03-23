from rest_framework import serializers
from .models.client import Client
from .models.client_category import ClientCategory

class ClientCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientCategory
        fields = ['id', 'name', 'discount_percent']

class ClientSerializer(serializers.ModelSerializer):
    category_details = ClientCategorySerializer(source='category', read_only=True)

    class Meta:
        model = Client
        fields = [
            'id',
            'full_name',
            'email',
            'phone_number',
            'category',
            'category_details',
            'created_at'
        ]
        read_only_fields = ['created_at']
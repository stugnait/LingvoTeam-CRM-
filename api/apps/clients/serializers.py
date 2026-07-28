from rest_framework import serializers
from .models.client import Client
from .models.client_category import ClientCategory

class ClientCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientCategory
        fields = ['id', 'name', 'discount_percent']

class ClientSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, default="---")
    discount_percent = serializers.FloatField(source='category.discount_percent', read_only=True, default=0)
    emails = serializers.ListField(
        child=serializers.EmailField(),
        required=False,
        allow_empty=True,
        default=list
    )

    class Meta:
        model = Client
        fields = [
            'id',
            'full_name',
            'emails',
            'phone_number',
            'category',
            'category_name',
            'created_at',
            'discount_percent'
        ]
        read_only_fields = ['created_at']
        # Робимо поля необов'язковими на рівні API
        extra_kwargs = {
            'emails': {'required': False, 'allow_blank': True, 'allow_null': True},
            'phone_number': {'required': False, 'allow_blank': True, 'allow_null': True},
            'category': {'required': False, 'allow_null': True},
        }
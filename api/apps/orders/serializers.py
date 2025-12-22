from rest_framework import serializers
from django.db import transaction, models

from apps.orders.models import OrderTraffic, Order


class Priority(models.TextChoices):
    LOW = 'low', 'Низький'
    MEDIUM = 'medium', 'Середній'
    HIGH = 'high', 'Високий'


class OrderTrafficSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderTraffic
        fields = '__all__'


class OrderCreateSerializer(serializers.ModelSerializer):
    files = serializers.ListField(child=serializers.FileField(), write_only=True, required=False)

    class Meta:
        model = Order
        fields = [
            'id', 'client_id', 'language_pair_id', 'priority', 'deadline',
            'flex_deadline', 'page_count', 'symbols_count', 'status_id', 'files'
        ]
        read_only_fields = ['page_count', 'symbols_count']
        extra_kwargs = {
            'status_id': {'required': False},
            'client_status': {'required': False},
            'translator_status': {'required': False},
        }

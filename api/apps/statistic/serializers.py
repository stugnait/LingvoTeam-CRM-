from rest_framework import serializers
from apps.orders.models import Order
from apps.users.models import User
from apps.clients.models import Client
from apps.translators.models import Translator


class ManagerInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'phone', 'role']


class ClientInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ['id', 'full_name', 'email', 'phone_number', 'category']


class TranslatorInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Translator
        fields = ['id', 'full_name', 'email', 'phone', 'work_type', 'currency_id']


class StatsSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    full_name = serializers.CharField()

    total_orders = serializers.IntegerField()
    total_revenue = serializers.FloatField()

    # Робимо їх необов'язковими (required=False), бо для клієнтів повертається одне, а для менеджерів - інше
    unpaid_orders_count = serializers.IntegerField(required=False)
    overdue_orders_count = serializers.IntegerField(required=False)


class OwnerOrderListSerializer(serializers.ModelSerializer):
    # Вказуємо source, щоб DRF знав, з яких полів моделі брати дані
    manager_accept = ManagerInfoSerializer(source='manager_accept_id', read_only=True)
    manager_delivery = ManagerInfoSerializer(source='manager_delivery_id', read_only=True)

    client = ClientInfoSerializer(read_only=True)
    translator = TranslatorInfoSerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'created_at',
            'deadline',
            'page_count',
            'client_status',
            'status_id',
            'client_comment',
            # Замість 'manager' тепер віддаємо двох менеджерів:
            'manager_accept',
            'manager_delivery',
            'client',
            'translator'
        ]
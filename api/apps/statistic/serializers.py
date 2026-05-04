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
    """
    Універсальний серіалізатор для статистики.
    Всі поля необов'язкові — кожен ендпоінт повертає тільки те, що потрібно.
    """
    id        = serializers.IntegerField()
    full_name = serializers.CharField()

    # Загальні
    total_orders  = serializers.IntegerField(required=False, default=0)
    total_revenue = serializers.FloatField(required=False, default=0)

    # Середній чек
    avg_order_value = serializers.FloatField(required=False, default=0)

    # Для менеджерів / клієнтів
    unpaid_orders_count  = serializers.IntegerField(required=False, default=0)
    overdue_orders_count = serializers.IntegerField(required=False, default=0)

    # Для перекладачів
    avg_rating      = serializers.FloatField(required=False, default=0)
    revision_count  = serializers.IntegerField(required=False, default=0)

    # Для редакторів
    total_checked = serializers.IntegerField(required=False, default=0)


class OwnerOrderListSerializer(serializers.ModelSerializer):
    manager_accept   = ManagerInfoSerializer(source='manager_accept_id',   read_only=True)
    manager_delivery = ManagerInfoSerializer(source='manager_delivery_id',  read_only=True)
    client           = ClientInfoSerializer(read_only=True)
    translator       = TranslatorInfoSerializer(read_only=True)

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
            'manager_accept',
            'manager_delivery',
            'client',
            'translator',
        ]


# ─────────────────────────────────────────────
# Серіалізатори для P&L відповіді
# ─────────────────────────────────────────────

class PnLBreakdownItemSerializer(serializers.Serializer):
    name             = serializers.CharField()
    val_revenue      = serializers.DecimalField(max_digits=12, decimal_places=2)
    val_cost         = serializers.DecimalField(max_digits=12, decimal_places=2)
    val_profit       = serializers.DecimalField(max_digits=12, decimal_places=2)
    val_orders       = serializers.IntegerField()
    avg_order_value  = serializers.DecimalField(max_digits=12, decimal_places=2)


class PnLSummarySerializer(serializers.Serializer):
    revenue               = serializers.DecimalField(max_digits=12, decimal_places=2)
    cogs                  = serializers.DecimalField(max_digits=12, decimal_places=2)
    gross_profit          = serializers.DecimalField(max_digits=12, decimal_places=2)
    gross_margin_percent  = serializers.DecimalField(max_digits=6,  decimal_places=2)
    opex                  = serializers.DecimalField(max_digits=12, decimal_places=2)
    net_profit            = serializers.DecimalField(max_digits=12, decimal_places=2)
    avg_order_value       = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_orders          = serializers.IntegerField()


class LanguagePairStatsSerializer(serializers.Serializer):
    pair_name       = serializers.CharField()
    total_orders    = serializers.IntegerField()
    total_revenue   = serializers.DecimalField(max_digits=12, decimal_places=2)
    avg_order_value = serializers.DecimalField(max_digits=12, decimal_places=2)


class EditorStatsSerializer(serializers.Serializer):
    id            = serializers.IntegerField()
    full_name     = serializers.CharField()
    total_checked = serializers.IntegerField()
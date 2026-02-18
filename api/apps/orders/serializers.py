from rest_framework import serializers
from django.db import transaction, models

from apps.orders.models import OrderTraffic, Order, File, OrderStatusHistory


class Priority(models.TextChoices):
    LOW = 'low', 'Низький'
    MEDIUM = 'medium', 'Середній'
    HIGH = 'high', 'Високий'
    CRITICAL = 'critical', 'Критичний'


class OrderTrafficSerializer(serializers.ModelSerializer):
    language_pair_name = serializers.StringRelatedField(source='language_pair', read_only=True)
    currency_name = serializers.CharField(source='currency_id.name', read_only=True, default="---")

    category_name = serializers.CharField(source='category.name', read_only=True, default="Загальна")

    class Meta:
        model = OrderTraffic
        fields = [
            'id',
            'language_pair',
            'language_pair_name',
            'currency_id',
            'currency_name',
            'category',
            'category_name',
            'price_per_page',
        ]


class OrderCreateSerializer(serializers.ModelSerializer):
    source_language = serializers.IntegerField(write_only=True, required=True)
    target_language = serializers.IntegerField(write_only=True, required=True)

    files = serializers.ListField(child=serializers.FileField(), write_only=True, required=False)

    class Meta:
        model = Order
        fields = [
            'id',
            'source_language',
            'target_language',
            'client_id',
            'language_pair_id',
            'priority',
            'deadline',
            'flex_deadline',
            'page_count',
            'symbols_count',
            'status_id',
            'files',
            "translator_id",
            "total_amount",
            'client_status',
            'translator_status',
            'traffic_id',
            'translator_traffic_id',
            'editor_id',
            'client_comment',
            'translator_comment'
        ]
        read_only_fields = ['page_count', 'symbols_count']

        extra_kwargs = {
            'language_pair_id': {'read_only': True},
            'status_id': {'read_only': True},
            'client_status': {'read_only': True},
            'translator_status': {'read_only': True},
        }


class RejectTranslationSerializer(serializers.Serializer):
    review_comment = serializers.CharField(required=True)


class ApproveTranslationSerializer(serializers.Serializer):
    score = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True)


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    status_name = serializers.CharField(source='status.name', read_only=True, allow_null=True)
    client_status_name = serializers.CharField(source='client_status.name', read_only=True, allow_null=True)
    translator_status_name = serializers.CharField(source='translator_status.name', read_only=True, allow_null=True)

    class Meta:
        model = OrderStatusHistory
        fields = [
            'id',
            'created_at',
            'status',
            'status_name',
            'client_status',
            'client_status_name',
            'translator_status',
            'translator_status_name'
        ]


class OrderListSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client_id.full_name', default="-", read_only=True)
    manager_name = serializers.CharField(source='manager_id.full_name', default="-", read_only=True)
    editor_name = serializers.CharField(source='editor_id.full_name', default="-", read_only=True)
    translator_name = serializers.CharField(source='translator_id.full_name', default="-", read_only=True)

    status_name = serializers.CharField(source='status_id.name', default="-", read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

    history = OrderStatusHistorySerializer(source='history_logs', many=True, read_only=True)

    source_language = serializers.CharField(source='language_pair_id.source_language.name', default="-", read_only=True)
    target_language = serializers.CharField(source='language_pair_id.target_language.name', default="-", read_only=True)

    language_pair_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id',
            'client_id', 'client_name',
            'manager_id', 'manager_name',
            'editor_id', 'editor_name',
            'translator_id', 'translator_name',
            'status_id', 'status_name',
            'history',
            'traffic_id', 'translator_traffic_id',

            'language_pair_id', 'language_pair_name',
            'source_language',
            'target_language',

            'priority', 'priority_display',
            'page_count', 'symbols_count',
            'deadline', 'flex_deadline',
            'created_at',
            'client_comment', 'translator_comment'
        ]

    def get_language_pair_name(self, order):
        lp = order.language_pair_id
        if not lp:
            return "-"
        s = lp.source_language.name if lp.source_language else "?"
        t = lp.target_language.name if lp.target_language else "?"
        return f"{s} -> {t}"


class FileCreateSerializer(serializers.ModelSerializer):
    file_type = serializers.CharField(max_length=16)

    class Meta:
        model = File
        fields = ['id', 'order', 'file_type', 'dropbox_url']
        read_only_fields = ['id']

class UploadFileSerializer(serializers.Serializer):
    files = serializers.ListField(child=serializers.FileField(), write_only=True)
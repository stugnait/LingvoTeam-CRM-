from rest_framework import serializers
from django.db import transaction, models

from apps.orders.models import OrderTraffic, Order, File


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
            'flex_deadline', 'page_count', 'symbols_count', 'status_id', 'files', "translator_id"
        ]
        read_only_fields = ['page_count', 'symbols_count']
        extra_kwargs = {
            'status_id': {'required': False},
            'client_status': {'required': False},
            'translator_status': {'required': False},
        }

class RejectTranslationSerializer(serializers.Serializer):
    review_comment = serializers.CharField(required=True)

class ApproveTranslationSerializer(serializers.Serializer):
    score = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True)


from rest_framework import serializers
from apps.orders.models import Order, OrderTraffic


class OrderListSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client_id.full_name', default="-", read_only=True)
    manager_name = serializers.CharField(source='manager_id.full_name', default="-", read_only=True)
    editor_name = serializers.CharField(source='editor_id.full_name', default="-", read_only=True)
    translator_name = serializers.CharField(source='translator_id.full_name', default="-", read_only=True)

    status_name = serializers.CharField(source='status_id.name', default="-", read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

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

            'traffic_id', 'translator_traffic_id',

            'language_pair_id', 'language_pair_name',

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

class TranslatorUploadFileSerializer(serializers.Serializer):
    files = serializers.ListField(child=serializers.FileField(), write_only=True)
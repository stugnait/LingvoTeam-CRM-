from rest_framework import serializers
from django.db import transaction, models

from apps.core.models.language_pair import LanguagePair
from apps.orders.models import OrderTraffic, Order, File, OrderStatusHistory, Status


class Priority(models.TextChoices):
    LOW = 'low', 'Низький'
    MEDIUM = 'medium', 'Середній'
    HIGH = 'high', 'Високий'
    CRITICAL = 'critical', 'Критичний'


class OrderTrafficSerializer(serializers.ModelSerializer):
    currency_name = serializers.CharField(source='currency_id.name', read_only=True, default="---")
    currency_sign = serializers.CharField(source='currency_id.code_name', read_only=True, default="")
    category_name = serializers.CharField(source='category.name', read_only=True, default="Загальна")

    # read-only — повертає назви мов
    source_language_name = serializers.CharField(source='language_pair.source_language.name', default="-", read_only=True)
    target_language_name = serializers.CharField(source='language_pair.target_language.name', default="-", read_only=True)
    language_pair_name = serializers.SerializerMethodField()

    # write-only — приймає ID мов
    source_language = serializers.IntegerField(write_only=True, required=False)
    target_language = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = OrderTraffic
        fields = [
            'id', 'name',
            'language_pair',
            'source_language',
            'target_language',
            'currency_id', 'category',
            'price_per_page', 'price_per_action',
            'language_pair_name',
            'source_language_name',
            'target_language_name',
            'currency_name', 'currency_sign', 'category_name',
        ]
        extra_kwargs = {
            'language_pair': {'required': False}
        }

    def get_language_pair_name(self, obj):
        if obj.language_pair:
            return str(obj.language_pair)
        return "-"

    def _resolve_language_pair(self, validated_data):
        source_id = validated_data.pop('source_language')
        target_id = validated_data.pop('target_language')
        pair, _ = LanguagePair.objects.get_or_create(
            source_language_id=source_id,
            target_language_id=target_id,
        )
        return pair

    def create(self, validated_data):
        if validated_data.get("price_per_page") is not None:
            validated_data["price_per_action"] = None
        else:
            validated_data["price_per_page"] = None

        if 'language_pair' in validated_data:
            return super().create(validated_data)

        if 'source_language' in validated_data and 'target_language' in validated_data:
            validated_data['language_pair'] = self._resolve_language_pair(validated_data)
            return super().create(validated_data)

        raise serializers.ValidationError(
            {"language_pair": "Потрібен або language_pair_id або source/target language."}
        )

    def update(self, instance, validated_data):
        if 'source_language' in validated_data or 'target_language' in validated_data:
            validated_data.setdefault(
                'source_language',
                instance.language_pair.source_language_id if instance.language_pair else None
            )
            validated_data.setdefault(
                'target_language',
                instance.language_pair.target_language_id if instance.language_pair else None
            )
            instance.language_pair = self._resolve_language_pair(validated_data)

        if validated_data.get("price_per_page") is not None:
            validated_data["price_per_action"] = None
        elif validated_data.get("price_per_action") is not None:
            validated_data["price_per_page"] = None

        return super().update(instance, validated_data)


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
            'manager_accept_id',
            'manager_delivery_id',
            'deadline',
            'flex_deadline',
            'page_count',
            'symbols_count',
            'files',
            'symbols_with_spaces_count',
            'images_count',
            'translator_id',
            'total_amount',
            'traffic_id',
            'translator_traffic_id',
            'editor_id',
            'client_comment',
            'editor_status',
            'translator_comment',
            'status_id',
            'client_status',
            'translator_status',
        ]
        read_only_fields = [
            'page_count',
            'symbols_count',
            'symbols_with_spaces_count',
            'images_count'
        ]
        extra_kwargs = {
            'language_pair_id': {'read_only': True},
            'translator_status': {'required': False},
            'editor_status': {'required': False},
            'client_status': {'required': False},
            'status_id': {'required': False},
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
            'status', 'status_name',
            'client_status', 'client_status_name',
            'translator_status', 'translator_status_name',
        ]


class OrderListSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client_id.full_name', default="-", read_only=True)
    manager_accept_name = serializers.CharField(source='manager_accept_id.full_name', default="-", read_only=True)
    manager_delivery_name = serializers.CharField(source='manager_delivery_id.full_name', default="-", read_only=True)
    editor_name = serializers.CharField(source='editor_id.full_name', default="-", read_only=True)
    translator_name = serializers.CharField(source='translator_id.full_name', default="-", read_only=True)

    status_name = serializers.CharField(source='status_id.name', default="-", read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

    history = OrderStatusHistorySerializer(source='history_logs', many=True, read_only=True)

    source_language = serializers.CharField(source='language_pair_id.source_language.name', default="-", read_only=True)
    target_language = serializers.CharField(source='language_pair_id.target_language.name', default="-", read_only=True)

    language_pair_name = serializers.SerializerMethodField()
    manager_avatar = serializers.ImageField(source='manager_id.avatar', read_only=True)

    # editor_status = serializers.CharField(source='editor_status', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'client_id', 'client_name',
            'manager_accept_id', 'manager_accept_name',
            'manager_delivery_id', 'manager_delivery_name',
            'editor_id', 'editor_name',
            'translator_id', 'translator_name',
            'status_id', 'status_name',
            'history',
            'traffic_id', 'translator_traffic_id',
            'language_pair_id', 'language_pair_name',
            'source_language', 'target_language',
            'priority', 'priority_display',
            'page_count', 'symbols_count', 'symbols_with_spaces_count',
            'images_count',
            'deadline', 'flex_deadline',
            'created_at',
            'client_comment', 'translator_comment',
            'manager_avatar',
            "editor_status",
            "client_status"
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
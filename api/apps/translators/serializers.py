from rest_framework import serializers
from .models.translator import Translator
from .models.translator_language_pairs import TranslatorLanguagePairs
from .models.translator_traffic import TranslatorTraffic
from rest_framework import serializers
from .models import Translator, TranslatorTraffic

from rest_framework import serializers
from .models import Translator


class TranslatorLanguagePairsSerializer(serializers.ModelSerializer):
    translator_name = serializers.CharField(source='translator.full_name', read_only=True)
    language_pair_name = serializers.StringRelatedField(source='language_pair', read_only=True)

    class Meta:
        model = TranslatorLanguagePairs
        fields = [
            'id',
            'translator',
            'translator_name',
            'language_pair',
            'language_pair_name'
        ]




class TranslatorTrafficSerializer(serializers.ModelSerializer):
    # translator_name = serializers.CharField(source='translator.full_name', read_only=True, default="-")

    currency_name = serializers.CharField(source='currency_id.name', read_only=True, default="---")
    currency_sign = serializers.CharField(source='currency_id.code_name', read_only=True, default="")
    category_name = serializers.CharField(source='category.name', read_only=True, default="Загальна")

    source_language = serializers.CharField(source='language_pair.source_language.name', default="-", read_only=True)
    target_language = serializers.CharField(source='language_pair.target_language.name', default="-", read_only=True)

    language_pair_name = serializers.SerializerMethodField()

    class Meta:
        model = TranslatorTraffic
        fields = [
            'id',
            'name',

            'language_pair',
            'currency_id',
            'category',
            'rate_per_page',
            'rate_per_action',

            # 'translator_name',
            'language_pair_name',
            'source_language',
            'target_language',
            'currency_name',
            'currency_sign',
            'category_name',
        ]

    def get_language_pair_name(self, obj):
        if obj.language_pair:
            return str(obj.language_pair)
        return "-"


class TranslatorSerializer(serializers.ModelSerializer):
    orders_count = serializers.IntegerField(read_only=True)

    traffic = TranslatorTrafficSerializer(many=True, read_only=True)

    tariff_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Translator
        fields = [
            'id', 'full_name', 'email', 'phone', 'rating',
            'orders_count', 'created_at',
            'traffic', 'tariff_ids',
        ]
        read_only_fields = ['created_at', 'rating', 'orders_count']

    def create(self, validated_data):
        tariff_ids = validated_data.pop('tariff_ids', [])
        translator = Translator.objects.create(**validated_data)
        if tariff_ids:
            translator.traffic.set(tariff_ids)
        return translator

    def update(self, instance, validated_data):
        tariff_ids = validated_data.pop('tariff_ids', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tariff_ids is not None:
            instance.traffic.set(tariff_ids)
        return instance

class TranslatorUploadFileSerializer(serializers.Serializer):
    files = serializers.ListField(child=serializers.FileField(), write_only=True)
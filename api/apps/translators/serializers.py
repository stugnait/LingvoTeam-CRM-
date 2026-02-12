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
    language_pair_id = serializers.IntegerField(source='language_pair.id', read_only=True)
    language_pair_name = serializers.CharField(source='language_pair.__str__', read_only=True)

    currency_id = serializers.IntegerField(source='currency_id.id', read_only=True)
    currency_name = serializers.CharField(source='currency_id.name', read_only=True, default="---")
    currency_sign = serializers.CharField(source='currency_id.code_name', read_only=True, default="")

    category_id = serializers.IntegerField(source='category.id', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True,
                                          default="Загальна")

    class Meta:
        model = TranslatorTraffic
        fields = [
            'id',
            'language_pair_id',
            'language_pair_name',

            'currency_id',
            'currency_name',
            'currency_sign',

            'category_id',
            'category_name',

            'rate_per_page',
            'rate_per_action',
        ]


class TranslatorSerializer(serializers.ModelSerializer):
    currency_name = serializers.CharField(source='currency_id.name', read_only=True, default="---")
    orders_count = serializers.IntegerField(read_only=True)

    traffic = TranslatorTrafficSerializer(source='translatortraffic', many=True, read_only=True)

    class Meta:
        model = Translator
        fields = [
            'id',
            'full_name',
            'email',
            'phone',
            'work_type',
            'rating',

            'currency_id',
            'currency_name',

            'orders_count',
            'created_at',

            'traffic'
        ]
        read_only_fields = ['created_at', 'rating', 'orders_count']

class TranslatorUploadFileSerializer(serializers.Serializer):
    files = serializers.ListField(child=serializers.FileField(), write_only=True)
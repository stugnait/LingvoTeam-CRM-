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

class TranslatorSerializer(serializers.ModelSerializer):
    currency_name = serializers.CharField(source='currency_id.name', read_only=True, default="---")
    orders_count = serializers.IntegerField(read_only=True)
    class Meta:
        model = Translator
        fields = [
            'id',
            'full_name',
            'email',
            'phone',
            'work_type',
            'currency_id',
            'currency_name',
            'orders_count',
            'created_at'
        ]
        read_only_fields = ['created_at']

class TranslatorTrafficSerializer(serializers.ModelSerializer):
    language_pair_name = serializers.CharField(source='language_pair.__str__', read_only=True)
    currency_name = serializers.CharField(source='currency_id.name', read_only=True, default="---")
    category_name = serializers.CharField(source='category.name', read_only=True, default="---")

    class Meta:
        model = TranslatorTraffic
        fields = [
            'id',
            'translator_id',
            'language_pair',
            'language_pair_name',
            'currency_id',
            'currency_name',
            'category',
            'category_name',
            'rate_per_page',
            'rate_per_action'
        ]

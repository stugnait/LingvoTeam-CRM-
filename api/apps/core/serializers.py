from rest_framework import serializers
from .models.language import Language
from .models.language_pair import LanguagePair
from .models import Currency, OrderCategory
from .models.transaction import Transaction
from .models.transaction_category import TransactionCategory


class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = ['id', 'code', 'name', 'code_name']

class OrderCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderCategory
        fields = ['id', 'name', 'slug']

class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = ['id', 'name', 'slug']


class LanguagePairSelectSerializer(serializers.ModelSerializer):
    source_language = serializers.PrimaryKeyRelatedField(queryset=Language.objects.all())
    target_language = serializers.PrimaryKeyRelatedField(queryset=Language.objects.all())

    pair_name = serializers.SerializerMethodField()

    class Meta:
        model = LanguagePair
        fields = ['id', 'source_language', 'target_language', 'pair_name']

    def __str__(self):
        return f"{self.source_language} -> {self.target_language}"

    def get_pair_name(self, obj):
        s_name = obj.source_language.name if obj.source_language else "???"
        t_name = obj.target_language.name if obj.target_language else "???"
        return f"{s_name} -> {t_name}"


class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = Transaction
        fields = [
            'id', 'amount', 'currency', 'type',
            'category', 'category_name', 'comment', 'created_at'
        ]

class TransactionCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionCategory
        fields = ['id', 'name', 'slug']
        read_only_fields = ['slug']

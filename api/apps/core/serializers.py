from rest_framework import serializers
from .models.language import Language
from .models.language_pair import LanguagePair
from .models import Currency


class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = ['id', 'code', 'name', 'code_name']


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

    def get_pair_name(self, obj):
        s_name = obj.source_language.name if obj.source_language else "???"
        t_name = obj.target_language.name if obj.target_language else "???"
        return f"{s_name} -> {t_name}"
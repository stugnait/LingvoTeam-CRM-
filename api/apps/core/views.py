from rest_framework import viewsets
from rest_framework.permissions import AllowAny

# Імпортуємо моделі
from .models import Currency
from .models.language import Language
from .models.language_pair import LanguagePair
from .serializers import (
    CurrencySerializer,
    LanguageSerializer,
    LanguagePairSelectSerializer
)
from ..users.permissions import HasPermission


class CurrencyViewSet(viewsets.ModelViewSet):
    queryset = Currency.objects.all()
    serializer_class = CurrencySerializer
    permission_classes = [HasPermission]
    required_permissions = ['currency.manage']


class LanguageViewSet(viewsets.ModelViewSet):
    queryset = Language.objects.all()
    serializer_class = LanguageSerializer
    permission_classes = [HasPermission]
    required_permissions = ['language.manage']


class LanguagePairViewSet(viewsets.ModelViewSet):
    queryset = LanguagePair.objects.select_related('source_language', 'target_language').all()
    serializer_class = LanguagePairSelectSerializer
    permission_classes = [HasPermission]
    required_permissions = ['language.manage']
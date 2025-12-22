from rest_framework import viewsets
from rest_framework.permissions import AllowAny

# Імпортуємо моделі
from .models import Currency
from .models.language import Language
from .models.language_pair import LanguagePair

# Імпортуємо всі три серіалізатори
from .serializers import (
    CurrencySerializer,
    LanguageSerializer,
    LanguagePairSelectSerializer
)

class CurrencyViewSet(viewsets.ModelViewSet):
    queryset = Currency.objects.all()
    serializer_class = CurrencySerializer
    permission_classes = [AllowAny]


class LanguageViewSet(viewsets.ModelViewSet):
    queryset = Language.objects.all()
    serializer_class = LanguageSerializer
    permission_classes = [AllowAny]


class LanguagePairViewSet(viewsets.ModelViewSet):
    queryset = LanguagePair.objects.select_related('source_language', 'target_language').all()
    serializer_class = LanguagePairSelectSerializer
    permission_classes = [AllowAny]
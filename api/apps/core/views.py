from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters
from drf_spectacular.utils import extend_schema, extend_schema_view

# Імпортуємо моделі та серіалізатори
from .models import Currency, OrderCategory
from .models.language import Language
from .models.language_pair import LanguagePair
from .models.transaction import Transaction
from .models.transaction_category import TransactionCategory
from .serializers import (
    CurrencySerializer,
    LanguageSerializer,
    LanguagePairSelectSerializer,
    OrderCategorySerializer,
    TransactionSerializer,
    TransactionCategorySerializer
)
from ..users.permissions import HasPermission

@extend_schema_view(
    list=extend_schema(summary="Список валют", description="Перелік доступних валют системи."),
    create=extend_schema(summary="Додати валюту", description="Створення нової валюти (напр. USD, EUR).")
)
class CurrencyViewSet(viewsets.ModelViewSet):
    queryset = Currency.objects.all()
    serializer_class = CurrencySerializer
    permission_classes = [HasPermission]
    required_permissions = ['currency.manage']

@extend_schema_view(
    list=extend_schema(summary="Список мов", description="Отримати список всіх підтримуваних мов.")
)
class LanguageViewSet(viewsets.ModelViewSet):
    queryset = Language.objects.all()
    serializer_class = LanguageSerializer
    permission_classes = [HasPermission]
    required_permissions = ['language.manage']

@extend_schema_view(
    list=extend_schema(summary="Список мовних пар", description="Отримати всі комбінації мов (напр. En -> Ukr).")
)
class LanguagePairViewSet(viewsets.ModelViewSet):
    queryset = LanguagePair.objects.select_related('source_language', 'target_language').all()
    serializer_class = LanguagePairSelectSerializer
    permission_classes = [HasPermission]
    required_permissions = ['language.manage']

@extend_schema_view(
    list=extend_schema(summary="Категорії замовлень", description="Пошук та перегляд категорій складності замовлень.")
)
class OrderCategoryViewSet(viewsets.ModelViewSet):
    queryset = OrderCategory.objects.all().order_by('name')
    serializer_class = OrderCategorySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

@extend_schema_view(
    list=extend_schema(
        summary="Журнал транзакцій",
        description="Перегляд фінансових операцій (доходи/витрати) з фільтрацією за типом, валютою та категорією."
    ),
    create=extend_schema(summary="Створити транзакцію", description="Фіксація нової фінансової операції.")
)
class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.select_related('currency', 'category').all()
    serializer_class = TransactionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'currency', 'category', 'category__slug', 'created_at']
    search_fields = ['comment']
    ordering_fields = ['created_at', 'amount']
    ordering = ['-created_at']

@extend_schema_view(
    list=extend_schema(summary="Категорії транзакцій", description="Список категорій для P&L (напр. зарплата, оплата клієнта)."),
    retrieve=extend_schema(summary="Деталі категорії транзакції", description="Отримати категорію за її slug.")
)
class TransactionCategoryViewSet(viewsets.ModelViewSet):
    queryset = TransactionCategory.objects.all()
    serializer_class = TransactionCategorySerializer
    lookup_field = 'slug'
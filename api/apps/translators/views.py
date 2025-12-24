from rest_framework import viewsets, filters
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as django_filters
from django.db.models import Count  # 1. Імпортуємо Count для підрахунку

from .models import Translator, TranslatorTraffic
from .serializers import TranslatorSerializer, TranslatorTrafficSerializer
from ..users.permissions import HasPermission


class TranslatorFilter(django_filters.FilterSet):
    source_language = django_filters.NumberFilter(
        field_name='translatortraffic__language_pair__source_language_id'
    )
    target_language = django_filters.NumberFilter(
        field_name='translatortraffic__language_pair__target_language_id'
    )

    class Meta:
        model = Translator
        fields = ['work_type']


class TranslatorViewSet(viewsets.ModelViewSet):
    serializer_class = TranslatorSerializer
    permission_classes = [HasPermission]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TranslatorFilter
    search_fields = ['full_name', 'email']

    # 2. Додаємо 'orders_count' у дозволені поля для сортування
    ordering_fields = ['created_at', 'full_name', 'orders_count']

    def get_queryset(self):
        # Використовуємо 'order', бо так підказує помилка (Choices serve: ... order ...)
        return Translator.objects.annotate(
            orders_count=Count('order')
        ).order_by('-created_at').distinct()

    def get_required_permissions(self, request):
        if self.action == 'create':
            return ['translator.create']
        # Тут ви використовуєте order.view, що дозволяє менеджеру бачити перекладачів,
        # якщо він має право переглядати замовлення.
        return ['order.view']


class TranslatorTrafficViewSet(viewsets.ModelViewSet):
    queryset = TranslatorTraffic.objects.select_related(
        'language_pair',
        'currency_id',
        'translator'
    ).all()

    serializer_class = TranslatorTrafficSerializer

    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['translator', 'language_pair']
    permission_classes = [HasPermission]
    required_permissions = ['translator.traffic.manage']

from rest_framework import viewsets, filters
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as django_filters

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
    queryset = Translator.objects.all().order_by('-created_at').distinct()
    serializer_class = TranslatorSerializer
    permission_classes = [HasPermission]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TranslatorFilter
    search_fields = ['full_name', 'email']

    def get_required_permissions(self, request):
        if self.action == 'create':
            return ['translator.create']  #
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

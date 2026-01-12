from datetime import timedelta
from django.db.models import Sum, Avg, Count, F, Q, ExpressionWrapper, fields
from django.db.models.functions import Coalesce, TruncMonth
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, NumberFilter
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.clients.models import Client
from apps.orders.models import Order, TranslationQuality
from apps.statistic.serializers import OwnerOrderListSerializer, StatsSerializer
from apps.translators.models import Translator
from apps.users.models import User

class OwnerDetailFilter(FilterSet):
    manager = NumberFilter(field_name='manager_id')
    client = NumberFilter(field_name='client_id')
    translator = NumberFilter(field_name='translator_id')
    status = NumberFilter(field_name='status_id')

    class Meta:
        model = Order
        fields = ['manager', 'client', 'translator', 'status']

class OwnerOrderDetailsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OwnerOrderListSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = OwnerDetailFilter
    search_fields = ['title', 'client_comment']
    ordering_fields = ['deadline', 'created_at', 'page_count']

class OwnerDashboardViewSet(viewsets.GenericViewSet):
    def get_queryset(self):
        return Order.objects.none()

    @action(detail=False, methods=['get'], url_path='kpi-analytics')
    def kpi_analytics(self, request):
        # Топ-10 менеджерів
        # revenue_by_manager = Order.objects.values(name=F('manager_id__full_name')) \
        #                          .annotate(value=Coalesce(Sum(''), 0.0)) \
        #                          .filter(value__gt=0) \
        #                          .order_by('-value')[:10]

        # Ефективність менеджерів
        efficiency_by_manager = Order.objects.filter(manager_id__isnull=False) \
                                    .values(name=F('manager_id__full_name')) \
                                    .annotate(
            total=Count('id'),
            on_time=Count('id', filter=Q(completed_at__lte=F('deadline')))
        ) \
                                    .annotate(percent=ExpressionWrapper(
            F('on_time') * 100.0 / F('total'),
            output_field=fields.FloatField()
        )).order_by('-total')[:10]

        # KPI Перекладачів
        translators_performance = Order.objects.filter(translator_id__isnull=False) \
            .values(name=F('translator_id__full_name')) \
            .annotate(
            avg_quality=Coalesce(Avg('quality_score__score'), 0.0),
            delays=Count('id', filter=Q(completed_at__gt=F('deadline'))),
            total_orders=Count('id')
        ).order_by('-avg_quality')

        # Обсяги по місяцях
        monthly_growth = Order.objects.annotate(month=TruncMonth('created_at')) \
            .values('month') \
            .annotate(
            symbols=Sum('symbols_count'),
            count=Count('id')
        ).order_by('month')

        # Обсяги по мовних парах
        raw_lang_stats = Order.objects.values('language_pair_id') \
            .annotate(value=Count('id')) \
            .order_by('-value')

        from apps.core.models import LanguagePair

        pair_ids = [item['language_pair_id'] for item in raw_lang_stats]
        pairs_map = {p.id: str(p) for p in LanguagePair.objects.filter(id__in=pair_ids)}

        language_stats = [
            {
                "name": pairs_map.get(item['language_pair_id'], f"Pair #{item['language_pair_id']}"),
                "value": item['value']
            }
            for item in raw_lang_stats
        ]

        return Response({
            #"revenue_by_manager": revenue_by_manager,
            "efficiency_by_manager": efficiency_by_manager,
            "translators_performance": translators_performance,
            "monthly_growth": monthly_growth,
            "languages_distribution": language_stats
        })
    @action(detail=False, methods=['get'], url_path='unpaid-orders')
    def unpaid_orders(self, request):
        PAID_STATUS_ID = 5
        queryset = Order.objects.filter(~Q(client_status=PAID_STATUS_ID)).order_by('deadline')
        serializer = OwnerOrderListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='managers-stats')
    def manager_stats(self, request):
        PAID_STATUS_ID = 5
        stats = User.objects.filter(role__slug='manager').annotate(
            total_orders=Count('managed_orders'),
            total_revenue=Coalesce(Sum('managed_orders__total_price'), 0.0),
            unpaid_orders_count=Count(
                'managed_orders',
                filter=~Q(managed_orders__client_status=PAID_STATUS_ID)
            )
        ).order_by('-total_orders')
        serializer = StatsSerializer(stats, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='overdue-payments')
    def overdue_payments(self, request):
        PAID_STATUS_ID = 5
        queryset = Order.objects.filter(
            deadline__lt=timezone.now(),
        ).exclude(client_status=PAID_STATUS_ID).order_by('deadline')
        return Response(OwnerOrderListSerializer(queryset, many=True).data)

    @action(detail=False, methods=['get'], url_path='high-risk')
    def high_risk_orders(self, request):
        critical_time = timezone.now() + timedelta(days=2)
        DONE_STATUS_ID = 4
        queryset = Order.objects.filter(
            deadline__lte=critical_time,
            deadline__gt=timezone.now(),
        ).exclude(status_id=DONE_STATUS_ID).order_by('deadline')
        return Response(OwnerOrderListSerializer(queryset, many=True).data)

    @action(detail=False, methods=['get'], url_path='clients-stats')
    def client_stats(self, request):
        PAID_STATUS_ID = 5
        stats = Client.objects.annotate(
            total_orders=Count('order'),
            total_revenue=Coalesce(Sum('order__total_price'), 0.0),
            unpaid_orders_count=Count('order', filter=~Q(order__client_status=PAID_STATUS_ID))
        ).order_by('-total_revenue')
        return Response(StatsSerializer(stats, many=True).data)

    @action(detail=False, methods=['get'], url_path='translators-stats')
    def translator_stats(self, request):
        stats = Translator.objects.annotate(
            total_orders=Count('order'),
            total_revenue=Coalesce(Sum('order__page_count'), 0.0), # Можна змінити на ціну, якщо треба
            unpaid_orders_count=Count('order')
        ).order_by('-total_revenue')
        return Response(StatsSerializer(stats, many=True).data)
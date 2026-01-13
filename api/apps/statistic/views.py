from datetime import timedelta
from decimal import Decimal

from django.db.models import Sum, Avg, Count, F, Q, ExpressionWrapper, fields, DecimalField, FloatField
from django.db.models.functions import Coalesce, TruncMonth
from django.utils import timezone
from django.utils.dateparse import parse_date
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, NumberFilter
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.clients.models import Client
from apps.core.models import LanguagePair
from apps.orders.models import Order, TranslationQuality
from apps.orders.utils import FinanceCalculator
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

    # TODO зробити доступ пермішини і топ-10 менеджерів зробити
    def _get_date_range(self, request):
        start_str = request.query_params.get('start_date')
        end_str = request.query_params.get('end_date')

        start = parse_date(start_str) if start_str else timezone.now().date() - timedelta(days=30)
        end = parse_date(end_str) if end_str else timezone.now().date()
        return start, end

    @action(detail=False, methods=['get'], url_path='finance-summary')
    def finance_summary(self, request):
        start, end = self._get_date_range(request)

        orders = Order.objects.filter(created_at__date__range=[start, end]) \
            .select_related('traffic_id', 'translator_traffic_id')

        total_revenue = Decimal(0)
        total_cost = Decimal(0)

        for order in orders:
            fin = FinanceCalculator.calculate_order_financials(order)
            total_revenue += fin['revenue']
            total_cost += fin['cost']

        profit = total_revenue - total_cost
        margin = (profit / total_revenue * 100) if total_revenue > 0 else 0

        return Response({
            "period": {"start": start, "end": end},
            "total_orders": orders.count(),
            "revenue": round(total_revenue, 2),
            "cost": round(total_cost, 2),
            "net_profit": round(profit, 2),
            "margin_percent": round(margin, 2)
        })

    @action(detail=False, methods=['get'], url_path='kpi-analytics')
    def kpi_analytics(self, request):
        start, end = self._get_date_range(request)
        orders_qs = Order.objects.filter(created_at__date__range=[start, end])

        # 1. ТОП МЕНЕДЖЕРІВ
        # revenue_by_manager = User.objects.filter(managed_orders__in=orders_qs) \
        #                          .annotate(
        #     virtual_revenue=Sum(
        #         ExpressionWrapper(
        #             F('managed_orders__page_count') * F('managed_orders__traffic_id__price_per_page'),
        #             output_field=DecimalField()
        #         )
        #     )
        # ).values('full_name', 'virtual_revenue').order_by('-virtual_revenue')[:10]
        #
        # managers_revenue_data = [
        #     {"name": item['full_name'], "value": item['virtual_revenue'] or 0}
        #     for item in revenue_by_manager
        # ]

        # 2. ЕФЕКТИВНІСТЬ
        efficiency_by_manager = orders_qs.filter(manager_id__isnull=False) \
                                    .values(name=F('manager_id__full_name')) \
                                    .annotate(
            total=Count('id'),
            on_time=Count('id', filter=Q(completed_at__lte=F('deadline')))
        ).annotate(
            percent=ExpressionWrapper(
                F('on_time') * 100.0 / F('total'),
                output_field=FloatField()
            )
        ).order_by('-total')[:10]

        # 3. KPI ПЕРЕКЛАДАЧІВ
        translators_performance = orders_qs.filter(translator_id__isnull=False) \
                                      .values(name=F('translator_id__full_name')) \
                                      .annotate(
            avg_quality=Coalesce(Avg('quality_score__score'), 0.0),
            delays=Count('id', filter=Q(completed_at__gt=F('deadline'))),
            total_orders=Count('id')
        ).order_by('-avg_quality')[:10]

        # 4. ОБСЯГИ
        monthly_growth = orders_qs.annotate(month=TruncMonth('created_at')) \
            .values('month') \
            .annotate(
            symbols=Sum('symbols_count'),
            count=Count('id')
        ).order_by('month')

        # 5. МОВНІ ПАРИ
        raw_lang_stats = orders_qs.values('language_pair_id') \
                             .annotate(value=Count('id')) \
                             .order_by('-value')[:10]

        pair_ids = [item['language_pair_id'] for item in raw_lang_stats]
        pairs_map = {p.id: str(p) for p in LanguagePair.objects.filter(id__in=pair_ids)}

        language_stats = [
            {
                "name": pairs_map.get(item['language_pair_id'], f"Pair #{item['language_pair_id']}"),
                "value": item['value']
            }
            for item in raw_lang_stats
        ]

        # 6. КОНВЕРСІЯ
        DONE_STATUS_ID = 4
        total_for_conv = orders_qs.count()
        completed_for_conv = orders_qs.filter(status_id=DONE_STATUS_ID).count()
        conversion_rate = (completed_for_conv / total_for_conv * 100) if total_for_conv else 0


        orders_by_type = orders_qs.values('priority').annotate(count=Count('id'))

        return Response({
           # "revenue_by_manager": managers_revenue_data,
            "efficiency_by_manager": efficiency_by_manager,
            "translators_performance": translators_performance,
            "monthly_growth": monthly_growth,
            "languages_distribution": language_stats,
            "conversion_rate": round(conversion_rate, 2),
            "orders_by_type": orders_by_type
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
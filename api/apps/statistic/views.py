from datetime import timezone, timedelta

from django.db.models import Q, Count, Sum, Value
from django.db.models.functions import Coalesce, Concat
from drf_spectacular.utils import extend_schema_view
from rest_framework.decorators import action


from decimal import Decimal
from django.db.models import Sum, F, ExpressionWrapper, DecimalField
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from apps.core.models import Transaction

from apps.clients.models import Client
from apps.statistic.serializers import OwnerOrderListSerializer, StatsSerializer
from apps.translators.models import Translator
from apps.users.models import User


from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, NumberFilter
from apps.orders.models import Order, status
from django.utils import timezone

from apps.users.permissions import HasPermission


class OwnerDetailFilter(FilterSet):
    manager = NumberFilter(field_name='manager_id')
    client = NumberFilter(field_name='client_id')
    translator = NumberFilter(field_name='translator_id')
    status = NumberFilter(field_name='status_id')

    class Meta:
        model = Order
        fields = ['manager', 'client', 'translator', 'status']

@extend_schema_view(
    list=extend_schema(
        summary="Детальний список замовлень (Owner)",
        description="Повний перелік замовлень з можливістю глибокої фільтрації за менеджером, клієнтом та статусом.",
        tags=["Owner Analytics"]
    ),
    retrieve=extend_schema(
        summary="Перегляд конкретного замовлення (Owner)",
        tags=["Owner Analytics"]
    )
)
class OwnerOrderDetailsViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [HasPermission]
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OwnerOrderListSerializer


    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = OwnerDetailFilter

    search_fields = ['title', 'client_comment']
    ordering_fields = ['deadline', 'created_at', 'page_count']

    def get_required_permissions(self, request):
        return ['statistic.order.view']

@extend_schema_view(
    unpaid_orders=extend_schema(
        summary="Неоплачені замовлення",
        description="Список замовлень, де клієнт ще не здійснив оплату (статус не дорівнює 5).",
        responses={200: OwnerOrderListSerializer(many=True)},
        tags=["Owner Dashboard"]
    ),
    manager_stats=extend_schema(
        summary="Статистика по менеджерах",
        description="Агреговані дані: кількість замовлень, загальний обсяг (revenue) та кількість боргів по кожному менеджеру.",
        responses={200: StatsSerializer(many=True)},
        tags=["Owner Dashboard"]
    ),
    overdue_payments=extend_schema(
        summary="Протерміновані виплати",
        description="Замовлення, де дедлайн вже минув, а оплата від клієнта ще не надійшла.",
        responses={200: OwnerOrderListSerializer(many=True)},
        tags=["Owner Dashboard"]
    ),
    high_risk_orders=extend_schema(
        summary="Замовлення з наближенням дедлайну",
        description="Замовлення, дедлайн яких настане протягом наступних 2 днів, але вони ще не виконані.",
        responses={200: OwnerOrderListSerializer(many=True)},
        tags=["Owner Dashboard"]
    ),
    client_stats=extend_schema(
        summary="Статистика по клієнтах",
        description="Рейтинг клієнтів за прибутковістю (загальна кількість сторінок) та активністю.",
        responses={200: StatsSerializer(many=True)},
        tags=["Owner Dashboard"]
    ),
    translator_stats=extend_schema(
        summary="Статистика по перекладачах",
        description="Аналіз ефективності перекладачів за обсягом виконаних робіт.",
        responses={200: StatsSerializer(many=True)},
        tags=["Owner Dashboard"]
    ),
)
class OwnerDashboardViewSet(viewsets.GenericViewSet):
    permission_classes = [HasPermission]

    def get_required_permissions(self, request):
        mapping = {
            'unpaid_orders': ['statistic.unpaid.view'],
            'manager_stats': ['statistic.manager.view'],
            'overdue_payments': ['statistic.payment.view'],
            'high_risk_orders': ['statistic.risk.view'],
            'client_stats': ['statistic.client.view'],
            'translator_stats': ['statistic.translator.view'],
        }
        return mapping.get(self.action, [])

    def get_queryset(self):
        return Order.objects.none()

    @action(detail=False, methods=['get'], url_path='unpaid-orders')
    def unpaid_orders(self, request):
        PAID_STATUS_ID = 5

        queryset = Order.objects.filter(
            ~Q(client_status=PAID_STATUS_ID)
        ).order_by('deadline')

        serializer = OwnerOrderListSerializer(queryset, many=True)

        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='managers-stats')
    def manager_stats(self, request):
        PAID_STATUS_ID = 5

        stats = User.objects.filter(role__slug='manager').annotate(
            total_orders=Count('managed_orders'),

            total_revenue=Coalesce(Sum('managed_orders__page_count'), 0.0),

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
        ).exclude(
            client_status=PAID_STATUS_ID
        ).order_by('deadline')

        serializer = OwnerOrderListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='high-risk')
    def high_risk_orders(self, request):
        critical_time = timezone.now() + timedelta(days=2)
        DONE_STATUS_ID = 4

        queryset = Order.objects.filter(
            deadline__lte=critical_time,
            deadline__gt=timezone.now(),
        ).exclude(status_id=DONE_STATUS_ID).order_by('deadline')

        serializer = OwnerOrderListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='clients-stats')
    def client_stats(self, request):
        PAID_STATUS_ID = 5

        stats = Client.objects.annotate(
            total_orders=Count('order'),

            total_revenue=Coalesce(Sum('order__page_count'), 0.0),

            unpaid_orders_count=Count(
                'order',
                filter=~Q(order__client_status=PAID_STATUS_ID)
            )
        ).order_by('-total_revenue')

        serializer = StatsSerializer(stats, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='translators-stats')
    def translator_stats(self, request):
        stats = Translator.objects.annotate(
            total_orders=Count('order'),  # Тут теж, ймовірно, просто 'order'
            total_revenue=Coalesce(Sum('order__page_count'), 0.0),
            unpaid_orders_count=Count('order')
        ).order_by('-total_revenue')

        serializer = StatsSerializer(stats, many=True)
        return Response(serializer.data)


class PnLViewSet(viewsets.ViewSet):
    @extend_schema(
        summary="PnL Звіт (Фінальний)",
        parameters=[
            OpenApiParameter("start_date", OpenApiTypes.DATE, required=True,
                             description="Початок періоду (YYYY-MM-DD)"),
            OpenApiParameter("end_date", OpenApiTypes.DATE, required=True, description="Кінець періоду (YYYY-MM-DD)"),
            OpenApiParameter("group_by", str, description="Варіанти: client, manager, translator, language_pair"),
        ],
        tags=["Finance Analytics"]
    )
    def list(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        group_by = request.query_params.get('group_by')

        if not start_date or not end_date:
            return Response({"detail": "start_date and end_date are required"}, status=status.HTTP_400_BAD_REQUEST)

        orders = Order.objects.filter(
            completed_at__date__range=[start_date, end_date],
            status_id__id__in=[4, 5]
        )

        revenue = orders.aggregate(total=Sum('total_amount'))['total'] or Decimal(0)

        orders_with_cost = orders.annotate(
            translator_cost_calc=Coalesce(
                ExpressionWrapper(
                    F('page_count') * F('translator_traffic_id__rate_per_page'),
                    output_field=DecimalField(max_digits=12, decimal_places=2)
                ), Decimal(0)
            )
        )

        cogs = orders_with_cost.aggregate(sum=Sum('translator_cost_calc'))['sum'] or Decimal(0)

        gross_profit = revenue - cogs

        if revenue > 0:
            gross_margin = (gross_profit / revenue) * 100
        else:
            gross_margin = Decimal(0)

        opex_agg = Transaction.objects.filter(
            created_at__date__range=[start_date, end_date],
            type='expense'
        ).aggregate(sum=Sum('amount'))['sum']

        total_opex = Decimal(str(opex_agg)) if opex_agg is not None else Decimal('0.00')

        net_profit = gross_profit - total_opex

        breakdown_data = []

        if group_by:
            qs_breakdown = orders_with_cost
            group_field_name = None

            if group_by == 'language_pair':
                qs_breakdown = qs_breakdown.annotate(
                    group_name=Concat(
                        F('language_pair_id__source_language__name'),
                        Value(' -> '),
                        F('language_pair_id__target_language__name')
                    )
                )
                group_field_name = 'group_name'
            else:
                mapping = {
                    'client': 'client_id__full_name',
                    'manager': 'manager_id__full_name',
                    'translator': 'translator_id__full_name',
                }
                db_field = mapping.get(group_by)
                if db_field:
                    qs_breakdown = qs_breakdown.annotate(group_name=F(db_field))
                    group_field_name = 'group_name'

            if group_field_name:
                breakdown_data = qs_breakdown.values('group_name').annotate(
                    val_revenue=Sum('total_amount'),
                    val_cost=Sum('translator_cost_calc'),
                    val_profit=Sum('total_amount') - Sum('translator_cost_calc')
                ).order_by('-val_revenue')

        return Response({
            "period": {"start": start_date, "end": end_date},
            "summary": {
                "revenue": revenue,
                "cogs": cogs,
                "gross_profit": gross_profit,
                "gross_margin_percent": round(gross_margin, 2),
                "opex": total_opex,
                "net_profit": net_profit
            },
            "breakdown": breakdown_data
        })

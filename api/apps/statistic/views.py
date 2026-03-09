from datetime import timezone, timedelta
from decimal import Decimal

from django.db.models import Q, Count, Sum, Value, F, ExpressionWrapper, DecimalField
from django.db.models.functions import Coalesce, Concat, TruncDay
from django.utils import timezone

from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, NumberFilter

from drf_spectacular.utils import extend_schema_view, extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from apps.core.models import Transaction
from apps.clients.models import Client
from apps.statistic.serializers import OwnerOrderListSerializer, StatsSerializer
from apps.translators.models import Translator
from apps.users.models import User
from apps.orders.models import Order
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
            'conversion_stats': ['statistic.order.view'],
            'sales_chart': ['statistic.order.view'],
        }
        return mapping.get(self.action, [])

    def get_queryset(self):
        return Order.objects.none()

    @extend_schema(
        summary="Неоплачені замовлення",
        description="Список замовлень, де клієнт ще не здійснив оплату.",
        responses={200: OwnerOrderListSerializer(many=True)},
        tags=["Owner Dashboard"]
    )
    @action(detail=False, methods=['get'], url_path='unpaid-orders')
    def unpaid_orders(self, request):
        PAID_STATUS_ID = 5  # Уточніть, чи відповідає це ID у вашій системі оплат
        queryset = Order.objects.filter(~Q(client_status=PAID_STATUS_ID)).order_by('deadline')
        serializer = OwnerOrderListSerializer(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Протерміновані виплати",
        description="Замовлення, де дедлайн вже минув, а оплата від клієнта ще не надійшла.",
        responses={200: OwnerOrderListSerializer(many=True)},
        tags=["Owner Dashboard"]
    )
    @action(detail=False, methods=['get'], url_path='overdue-payments')
    def overdue_payments(self, request):
        PAID_STATUS_ID = 5
        queryset = Order.objects.filter(
            deadline__lt=timezone.now(),
        ).exclude(client_status=PAID_STATUS_ID).order_by('deadline')
        serializer = OwnerOrderListSerializer(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Замовлення з наближенням дедлайну",
        description="Замовлення, дедлайн яких настане протягом наступних 2 днів, але вони ще не виконані.",
        responses={200: OwnerOrderListSerializer(many=True)},
        tags=["Owner Dashboard"]
    )
    @action(detail=False, methods=['get'], url_path='high-risk')
    def high_risk_orders(self, request):
        critical_time = timezone.now() + timedelta(days=2)
        DONE_STATUS_ID = 2  # ID 2 = Done (згідно бази)

        queryset = Order.objects.filter(
            deadline__lte=critical_time,
            deadline__gt=timezone.now(),
        ).exclude(status_id=DONE_STATUS_ID).order_by('deadline')

        serializer = OwnerOrderListSerializer(queryset, many=True)
        return Response(serializer.data)


    @extend_schema(
        summary="Коефіцієнт конверсії (Воронка продажів)",
        description="Скільки клієнтів взяли послуги (в роботі або виконані), скільки відмовились (Rejected), і % конверсії.",
        parameters=[
            OpenApiParameter("start_date", OpenApiTypes.DATE, description="YYYY-MM-DD"),
            OpenApiParameter("end_date", OpenApiTypes.DATE, description="YYYY-MM-DD"),
        ],
        tags=["Owner Dashboard"]
    )
    @action(detail=False, methods=['get'], url_path='conversion')
    def conversion_stats(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        qs = Order.objects.all()
        if start_date and end_date:
            qs = qs.filter(created_at__date__range=[start_date, end_date])

        REFUSED_STATUSES = [3]
        SUCCESS_STATUSES = [1, 2, 7, 8, 9]

        stats = qs.aggregate(
            total_requests=Count('id'),
            accepted=Count('id', filter=Q(status_id__in=SUCCESS_STATUSES)),
            refused=Count('id', filter=Q(status_id__in=REFUSED_STATUSES))
        )

        total = stats['total_requests'] or 0
        accepted = stats['accepted'] or 0
        refused = stats['refused'] or 0

        conversion_percent = (accepted / total * 100) if total > 0 else 0

        return Response({
            "total_requests": total,
            "accepted_services": accepted,
            "refused_services": refused,
            "conversion_percent": round(conversion_percent, 2)
        })

    @extend_schema(
        summary="Дані для графіка продажів",
        description="Групує дохід по днях для побудови графіка на дашборді.",
        parameters=[
            OpenApiParameter("start_date", OpenApiTypes.DATE, description="YYYY-MM-DD"),
            OpenApiParameter("end_date", OpenApiTypes.DATE, description="YYYY-MM-DD"),
        ],
        tags=["Owner Dashboard"]
    )
    @action(detail=False, methods=['get'], url_path='sales-chart')
    def sales_chart(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        qs = Order.objects.filter(status_id__in=[2, 9])

        if start_date and end_date:
            qs = qs.filter(created_at__date__range=[start_date, end_date])

        chart_data = qs.annotate(
            date=TruncDay('created_at')
        ).values('date').annotate(
            daily_revenue=Coalesce(Sum('total_amount'), Decimal('0.00'))
        ).order_by('date')

        return Response(chart_data)

    @extend_schema(
        summary="Статистика по менеджерах",
        parameters=[
            OpenApiParameter("start_date", OpenApiTypes.DATE),
            OpenApiParameter("end_date", OpenApiTypes.DATE),
        ],
        responses={200: StatsSerializer(many=True)},
        tags=["Owner Dashboard"]
    )
    @action(detail=False, methods=['get'], url_path='managers-stats')
    def manager_stats(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        PAID_STATUS_ID = 5

        order_filters = Q()
        if start_date and end_date:
            order_filters &= Q(managed_orders__created_at__date__range=[start_date, end_date])

        stats = User.objects.filter(role__slug='manager').annotate(
            total_orders=Count('managed_orders', filter=order_filters),
            total_revenue=Coalesce(Sum('managed_orders__page_count', filter=order_filters), Decimal('0.0')),
            unpaid_orders_count=Count(
                'managed_orders',
                filter=order_filters & ~Q(managed_orders__client_status=PAID_STATUS_ID)
            )
        ).order_by('-total_orders')

        serializer = StatsSerializer(stats, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Статистика по клієнтах",
        parameters=[
            OpenApiParameter("start_date", OpenApiTypes.DATE),
            OpenApiParameter("end_date", OpenApiTypes.DATE),
        ],
        responses={200: StatsSerializer(many=True)},
        tags=["Owner Dashboard"]
    )
    @action(detail=False, methods=['get'], url_path='clients-stats')
    def client_stats(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        PAID_STATUS_ID = 5

        order_filters = Q()
        if start_date and end_date:
            order_filters &= Q(order__created_at__date__range=[start_date, end_date])

        stats = Client.objects.annotate(
            total_orders=Count('order', filter=order_filters),
            total_revenue=Coalesce(Sum('order__page_count', filter=order_filters), Decimal('0.0')),
            unpaid_orders_count=Count(
                'order',
                filter=order_filters & ~Q(order__client_status=PAID_STATUS_ID)
            )
        ).order_by('-total_revenue')

        serializer = StatsSerializer(stats, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Статистика по перекладачах",
        parameters=[
            OpenApiParameter("start_date", OpenApiTypes.DATE),
            OpenApiParameter("end_date", OpenApiTypes.DATE),
        ],
        responses={200: StatsSerializer(many=True)},
        tags=["Owner Dashboard"]
    )
    @action(detail=False, methods=['get'], url_path='translators-stats')
    def translator_stats(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        order_filters = Q()
        if start_date and end_date:
            order_filters &= Q(order__created_at__date__range=[start_date, end_date])

        stats = Translator.objects.annotate(
            total_orders=Count('order', filter=order_filters),
            total_revenue=Coalesce(Sum('order__page_count', filter=order_filters), Decimal('0.0')),
            unpaid_orders_count=Count('order', filter=order_filters)
        ).order_by('-total_revenue')

        serializer = StatsSerializer(stats, many=True)
        return Response(serializer.data)


class PnLViewSet(viewsets.ViewSet):
    @extend_schema(
        summary="PnL Звіт (Фінальний)",
        parameters=[
            OpenApiParameter("start_date", OpenApiTypes.DATE, required=True),
            OpenApiParameter("end_date", OpenApiTypes.DATE, required=True),
            OpenApiParameter("group_by", str, description="client, manager, language_pair"),
        ],
        tags=["Finance Analytics"]
    )
    def list(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        group_by = request.query_params.get('group_by')

        orders = Order.objects.filter(
            completed_at__date__range=[start_date, end_date],
            status_id__in=[2, 9]
        )

        revenue = orders.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')

        orders_with_cost = orders.annotate(
            translator_cost_calc=ExpressionWrapper(
                F('page_count') * F('translator_traffic_id__rate_per_page'),
                output_field=DecimalField(max_digits=12, decimal_places=2)
            )
        )

        cogs_translators = orders_with_cost.aggregate(sum=Sum('translator_cost_calc'))['sum'] or Decimal('0.00')

        gross_profit = revenue - cogs_translators
        gross_margin = (gross_profit / revenue * Decimal('100.0')) if revenue > 0 else Decimal('0.0')

        opex_agg = Transaction.objects.filter(
            created_at__date__range=[start_date, end_date],
            type='expense'
        ).aggregate(sum=Sum('amount'))['sum']

        total_opex = Decimal(str(opex_agg)) if opex_agg is not None else Decimal('0.00')

        net_profit = gross_profit - total_opex

        breakdown_data = []
        if group_by:
            if group_by == 'language_pair':
                orders_with_cost = orders_with_cost.annotate(
                    full_pair_name=Concat(
                        F('language_pair_id__source_language__name'),
                        Value(' -> '),
                        F('language_pair_id__target_language__name')
                    )
                )

                breakdown_data = orders_with_cost.values(name=F('full_pair_name')).annotate(
                    val_revenue=Sum('total_amount'),
                    val_cost=Sum('translator_cost_calc'),
                    val_profit=Sum('total_amount') - Sum('translator_cost_calc')
                ).order_by('-val_revenue')

            else:
                mapping = {
                    'client': 'client_id__full_name',
                    'manager': 'manager_id__full_name',
                    'translator': 'translator_id__full_name',
                }

                db_field = mapping.get(group_by)
                if db_field:
                    breakdown_data = orders_with_cost.values(name=F(db_field)).annotate(
                        val_revenue=Sum('total_amount'),
                        val_cost=Sum('translator_cost_calc'),
                        val_profit=Sum('total_amount') - Sum('translator_cost_calc')
                    ).order_by('-val_revenue')

        return Response({
            "period": {"start": start_date, "end": end_date},
            "summary": {
                "revenue": revenue,
                "cogs": cogs_translators,
                "gross_profit": gross_profit,
                "gross_margin_percent": round(gross_margin, 2),
                "opex": total_opex,
                "net_profit": net_profit
            },
            "breakdown": breakdown_data
        })
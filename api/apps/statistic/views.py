from datetime import timedelta
from decimal import Decimal

from django.db.models import Q, Count, Sum, Value, F, ExpressionWrapper, DecimalField, IntegerField, FloatField
from django.db.models.functions import Coalesce, Concat, TruncDate, Cast
from django.utils import timezone

from django.db.models import Case, When

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


# ─────────────────────────────────────────────
# Константи статусів
# ─────────────────────────────────────────────
PAID_STATUS_ID = 5
DONE_STATUS_ID = 2
REJECTED_STATUS_ID = 3
REVISION_STATUS_ID = 11
SUCCESS_STATUSES = [1, 2, 7, 8, 9]
REFUSED_STATUSES = [3]


# ─────────────────────────────────────────────
# Фільтр для детального списку замовлень
# ─────────────────────────────────────────────
class OwnerDetailFilter(FilterSet):
    manager = NumberFilter(method='filter_manager')
    client = NumberFilter(field_name='client_id')
    translator = NumberFilter(field_name='translator_id')
    status = NumberFilter(field_name='status_id')
    editor = NumberFilter(field_name='editor_id')




    class Meta:
        model = Order
        fields = ['client', 'translator', 'status']

    def filter_manager(self, queryset, name, value):
        return queryset.filter(
            Q(manager_accept_id=value) | Q(manager_delivery_id=value)
        )


# ─────────────────────────────────────────────
# Детальний список замовлень
# ─────────────────────────────────────────────
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

    pagination_class = None

    search_fields = ['client_comment', "id"]
    ordering_fields = ['deadline', 'created_at', 'page_count']

    def get_required_permissions(self, request):
        return ['statistic.order.view']


# ─────────────────────────────────────────────
# Дашборд власника
# ─────────────────────────────────────────────
class OwnerDashboardViewSet(viewsets.GenericViewSet):
    permission_classes = [HasPermission]

    def get_required_permissions(self, request):
        mapping = {
            'unpaid_orders':     ['statistic.unpaid.view'],
            'manager_stats':     ['statistic.manager.view'],
            'overdue_payments':  ['statistic.payment.view'],
            'high_risk_orders':  ['statistic.risk.view'],
            'client_stats':      ['statistic.client.view'],
            'translator_stats':  ['statistic.translator.view'],
            'editor_stats':      ['statistic.editor.view'],
            'conversion_stats':  ['statistic.order.view'],
            'sales_chart':       ['statistic.order.view'],
            'language_pair_stats': ['statistic.order.view'],
        }
        return mapping.get(self.action, [])

    def get_queryset(self):
        return Order.objects.none()

    # ── Неоплачені замовлення ──────────────────
    @extend_schema(
        summary="Неоплачені замовлення",
        description="Список замовлень, де клієнт ще не здійснив оплату.",
        responses={200: OwnerOrderListSerializer(many=True)},
        tags=["Owner Dashboard"]
    )
    @action(detail=False, methods=['get'], url_path='unpaid-orders')
    def unpaid_orders(self, request):
        queryset = Order.objects.filter(
            ~Q(client_status=PAID_STATUS_ID)
        ).order_by('deadline')
        serializer = OwnerOrderListSerializer(queryset, many=True)
        return Response(serializer.data)

    # ── Протерміновані виплати ─────────────────
    @extend_schema(
        summary="Протерміновані виплати",
        description="Замовлення, де дедлайн вже минув, а оплата від клієнта ще не надійшла.",
        responses={200: OwnerOrderListSerializer(many=True)},
        tags=["Owner Dashboard"]
    )
    @action(detail=False, methods=['get'], url_path='overdue-payments')
    def overdue_payments(self, request):
        queryset = Order.objects.filter(
            deadline__lt=timezone.now(),
        ).exclude(client_status=PAID_STATUS_ID).order_by('deadline')
        serializer = OwnerOrderListSerializer(queryset, many=True)
        return Response(serializer.data)

    # ── Замовлення з наближенням дедлайну ──────
    @extend_schema(
        summary="Замовлення з наближенням дедлайну",
        description="Замовлення, дедлайн яких настане протягом наступних 2 днів, але вони ще не виконані.",
        responses={200: OwnerOrderListSerializer(many=True)},
        tags=["Owner Dashboard"]
    )
    @action(detail=False, methods=['get'], url_path='high-risk')
    def high_risk_orders(self, request):
        critical_time = timezone.now() + timedelta(days=2)
        queryset = Order.objects.filter(
            deadline__lte=critical_time,
            deadline__gt=timezone.now(),
        ).exclude(status_id=DONE_STATUS_ID).order_by('deadline')
        serializer = OwnerOrderListSerializer(queryset, many=True)
        return Response(serializer.data)

    # ── Конверсія / воронка продажів ──────────
    @extend_schema(
        summary="Коефіцієнт конверсії (Воронка продажів)",
        description="Скільки клієнтів взяли послуги, скільки відмовились і % конверсії.",
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

        stats = qs.aggregate(
            total_requests=Count('id'),
            accepted=Count('id', filter=Q(status_id__in=SUCCESS_STATUSES)),
            refused=Count('id', filter=Q(status_id__in=REFUSED_STATUSES))
        )

        total    = stats['total_requests'] or 0
        accepted = stats['accepted'] or 0
        refused  = stats['refused'] or 0
        conversion_percent = (accepted / total * 100) if total > 0 else 0

        return Response({
            "total_requests":    total,
            "accepted_services": accepted,
            "refused_services":  refused,
            "conversion_percent": round(conversion_percent, 2)
        })

    # ── Графік продажів ────────────────────────
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
        end_date   = request.query_params.get('end_date')

        qs = Order.objects.filter(status_id__in=[2, 9])
        if start_date and end_date:
            qs = qs.filter(created_at__date__range=[start_date, end_date])

        chart_data = qs.annotate(
            date=TruncDay('created_at')
        ).values('date').annotate(
            daily_revenue=Coalesce(Sum('total_amount'), Decimal('0.00'))
        ).order_by('date')

        return Response(chart_data)

    # ── Статистика менеджерів ──────────────────
    @extend_schema(
        summary="Статистика по менеджерах",
        description="Дохід, маржа, кількість унікальних клієнтів, замовлень та протермінованих задач по кожному менеджеру.",
        parameters=[
            OpenApiParameter("start_date", OpenApiTypes.DATE),
            OpenApiParameter("end_date", OpenApiTypes.DATE),
            OpenApiParameter("search", OpenApiTypes.STR, description="Пошук по імені менеджера"),
        ],
        responses={200: StatsSerializer(many=True)},
        tags=["Owner Dashboard"]
    )
    @action(detail=False, methods=['get'], url_path='managers-stats')
    def manager_stats(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        search_query = request.query_params.get('search')

        date_acc = Q()
        date_del = Q()
        if start_date and end_date:
            date_acc &= Q(accepted_orders__created_at__date__range=[start_date, end_date])
            date_del &= Q(delivered_orders__created_at__date__range=[start_date, end_date])

        now = timezone.now()
        overdue_acc = date_acc & Q(accepted_orders__deadline__lt=now) & ~Q(accepted_orders__status_id=DONE_STATUS_ID)
        overdue_del = date_del & Q(delivered_orders__deadline__lt=now) & ~Q(delivered_orders__status_id=DONE_STATUS_ID)

        not_same_manager = ~Q(delivered_orders__manager_accept_id=F('id'))
        date_del &= not_same_manager
        overdue_del &= not_same_manager

        # Базовий фільтр користувачів з роллю менеджера
        managers_qs = User.objects.filter(role__slug='manager')
        if search_query:
            managers_qs = managers_qs.filter(full_name__icontains=search_query)

        stats = managers_qs.annotate(
            acc_orders=Count('accepted_orders', filter=date_acc, distinct=True),
            acc_rev=Coalesce(Sum('accepted_orders__total_amount', filter=date_acc), Decimal('0.00')),
            acc_overdue=Count('accepted_orders', filter=overdue_acc, distinct=True),
            # Рахуємо витрати на перекладачів для замовлень, які прийняв менеджер
            acc_cogs=Coalesce(
                Sum(
                    ExpressionWrapper(
                        Cast('accepted_orders__page_count', DecimalField(max_digits=12, decimal_places=2)) *
                        Cast('accepted_orders__translator_traffic_id__rate_per_page',
                             DecimalField(max_digits=12, decimal_places=2)),
                        output_field=DecimalField(max_digits=12, decimal_places=2)
                    ),
                    filter=date_acc
                ),
                Decimal('0.00')
            ),
            # Рахуємо унікальних клієнтів для прийнятих замовлень
            acc_unique_clients=Count('accepted_orders__client_id', filter=date_acc, distinct=True),

            del_orders=Count('delivered_orders', filter=date_del, distinct=True),
            del_rev=Coalesce(Sum('delivered_orders__total_amount', filter=date_del), Decimal('0.00')),
            del_overdue=Count('delivered_orders', filter=overdue_del, distinct=True),
            # Рахуємо витрати на перекладачів для замовлень, які здав менеджер
            del_cogs=Coalesce(
                Sum(
                    ExpressionWrapper(
                        Cast('delivered_orders__page_count', DecimalField(max_digits=12, decimal_places=2)) *
                        Cast('delivered_orders__translator_traffic_id__rate_per_page',
                             DecimalField(max_digits=12, decimal_places=2)),
                        output_field=DecimalField(max_digits=12, decimal_places=2)
                    ),
                    filter=date_del
                ),
                Decimal('0.00')
            ),
            # Рахуємо унікальних клієнтів для зданих замовлень
            del_unique_clients=Count('delivered_orders__client_id', filter=date_del, distinct=True),
        ).annotate(
            total_orders=ExpressionWrapper(
                F('acc_orders') + F('del_orders'),
                output_field=IntegerField()
            ),
            total_revenue=ExpressionWrapper(
                F('acc_rev') + F('del_rev'),
                output_field=DecimalField(max_digits=12, decimal_places=2)
            ),
            total_cogs=ExpressionWrapper(
                F('acc_cogs') + F('del_cogs'),
                output_field=DecimalField(max_digits=12, decimal_places=2)
            ),
            overdue_orders_count=ExpressionWrapper(
                F('acc_overdue') + F('del_overdue'),
                output_field=IntegerField()
            ),
            total_clients=ExpressionWrapper(
                F('acc_unique_clients') + F('del_unique_clients'),
                output_field=IntegerField()
            ),
        ).annotate(
            avg_order_value=Case(
                When(total_orders=0, then=Value(Decimal('0.00'))),
                default=ExpressionWrapper(
                    F('total_revenue') / F('total_orders'),
                    output_field=DecimalField(max_digits=12, decimal_places=2)
                ),
                output_field=DecimalField(max_digits=12, decimal_places=2)
            ),
            gross_profit=ExpressionWrapper(
                F('total_revenue') - F('total_cogs'),
                output_field=DecimalField(max_digits=12, decimal_places=2)
            )
        ).annotate(
            avg_margin_percent=Case(
                When(total_revenue=0, then=Value(Decimal('0.00'))),
                default=ExpressionWrapper(
                    (F('gross_profit') / F('total_revenue')) * Value(Decimal('100.0')),
                    output_field=DecimalField(max_digits=5, decimal_places=2)
                ),
                output_field=DecimalField(max_digits=5, decimal_places=2)
            )
        ).order_by('-total_revenue')

        result = []
        for user in stats:
            result.append({
                'id': user.id,
                'full_name': user.full_name,
                'total_orders': user.total_orders,
                'total_clients': user.total_clients,
                'total_revenue': user.total_revenue,
                'avg_order_value': user.avg_order_value,
                'avg_margin_percent': round(user.avg_margin_percent, 2),
                'overdue_orders_count': user.overdue_orders_count,
            })

        return Response(result)

    @extend_schema(
        summary="Детальна статистика менеджера",
        description="Повертає інформацію про менеджера, динаміку замовлень по днях та динаміку доходу.",
        parameters=[
            OpenApiParameter("start_date", OpenApiTypes.DATE, description="YYYY-MM-DD"),
            OpenApiParameter("end_date", OpenApiTypes.DATE, description="YYYY-MM-DD"),
        ],
        tags=["Owner Dashboard"]
    )
    @action(detail=False, methods=['get'], url_path='managers-stats/(?P<manager_id>[0-9]+)/details')
    def manager_detail(self, request, manager_id=None):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        try:
            manager = User.objects.get(pk=manager_id, role__slug='manager')
        except User.DoesNotExist:
            return Response({"detail": "Менеджера не знайдено."}, status=404)

        # Шукаємо замовлення, де менеджер приймав АБО здавав проект
        qs = Order.objects.filter(Q(manager_accept_id=manager_id) | Q(manager_delivery_id=manager_id))

        if start_date and end_date:
            qs = qs.filter(created_at__date__range=[start_date, end_date])

        now = timezone.now()

        # ── ЗАГАЛЬНА СТАТИСТИКА ──────────
        summary_stats = qs.aggregate(
            total_orders=Count('id', distinct=True),
            total_clients=Count('client_id', distinct=True),  # <-- ВИПРАВЛЕНО ТУТ
            total_revenue=Coalesce(Sum('total_amount'), Decimal('0.00')),
            total_cogs=Coalesce(
                Sum(
                    ExpressionWrapper(
                        Cast('page_count', DecimalField(max_digits=12, decimal_places=2)) *
                        Cast('translator_traffic_id__rate_per_page', DecimalField(max_digits=12, decimal_places=2)),
                        output_field=DecimalField(max_digits=12, decimal_places=2)
                    )
                ),
                Decimal('0.00')
            ),
            overdue_count=Count('id', filter=Q(deadline__lt=now) & ~Q(status_id=DONE_STATUS_ID), distinct=True)
        )

        total_orders_val = summary_stats['total_orders'] or 0
        total_revenue_val = summary_stats['total_revenue'] or Decimal('0.00')
        total_cogs_val = summary_stats['total_cogs'] or Decimal('0.00')

        gross_profit = total_revenue_val - total_cogs_val
        avg_margin_val = (gross_profit / total_revenue_val * 100) if total_revenue_val > 0 else Decimal('0.00')
        avg_check_val = (total_revenue_val / total_orders_val) if total_orders_val > 0 else Decimal('0.00')

        # ── Графіки (TruncDate для правильного відображення по днях) ─────────
        orders_chart = (
            qs.annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id', distinct=True))
            .order_by('date')
        )

        revenue_chart = (
            qs.filter(status_id__in=SUCCESS_STATUSES)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(amount=Coalesce(Sum('total_amount'), Decimal('0.00')))
            .order_by('date')
        )

        return Response({
            "manager_info": {
                "id": manager.id,
                "full_name": manager.full_name,
                "email": manager.email,
            },
            "summary": {
                "total_orders": total_orders_val,
                "total_clients": summary_stats['total_clients'] or 0,
                "total_revenue": total_revenue_val,
                "avg_order_value": round(avg_check_val, 2),
                "avg_margin_percent": round(avg_margin_val, 2),
                "overdue_orders_count": summary_stats['overdue_count'] or 0
            },
            "orders_chart": list(orders_chart),
            "revenue_chart": list(revenue_chart),
        })


    # ── Статистика клієнтів ────────────────────
    @extend_schema(
        summary="Статистика по клієнтах",
        parameters=[
            OpenApiParameter("start_date", OpenApiTypes.DATE),
            OpenApiParameter("end_date", OpenApiTypes.DATE),
            OpenApiParameter("search", OpenApiTypes.STR, description="Пошук по імені клієнта"),
        ],
        responses={200: StatsSerializer(many=True)},
        tags=["Owner Dashboard"]
    )
    @action(detail=False, methods=['get'], url_path='clients-stats')
    def client_stats(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        search_query = request.query_params.get('search')

        order_filters = Q()
        if start_date and end_date:
            order_filters &= Q(order__created_at__date__range=[start_date, end_date])

        clients_qs = Client.objects.all()

        if search_query:
            clients_qs = clients_qs.filter(full_name__icontains=search_query)

        stats = clients_qs.annotate(
            total_orders=Count('order', filter=order_filters),
            total_revenue=Coalesce(
                Sum('order__total_amount', filter=order_filters),
                Decimal('0.00')
            ),
            unpaid_orders_count=Count(
                'order',
                filter=order_filters & ~Q(order__client_status=PAID_STATUS_ID)
            )
        ).annotate(
            avg_order_value=Case(
                When(total_orders=0, then=Value(Decimal('0.00'))),
                default=ExpressionWrapper(
                    F('total_revenue') / F('total_orders'),
                    output_field=DecimalField(max_digits=12, decimal_places=2)
                ),
                output_field=DecimalField(max_digits=12, decimal_places=2)
            )
        ).order_by('-total_revenue')

        result = []
        for client in stats:
            result.append({
                'id': client.id,
                'full_name': client.full_name,
                'total_orders': client.total_orders,
                'total_revenue': client.total_revenue,
                'avg_order_value': client.avg_order_value,
                'unpaid_orders_count': client.unpaid_orders_count,
            })

        return Response(result)

    @extend_schema(
        summary="Детальна статистика клієнта",
        description=(
                "Повертає інформацію про клієнта, динаміку замовлень по днях, "
                "динаміку доходу по днях та розбивку по мовних парах."
        ),
        parameters=[
            OpenApiParameter("start_date", OpenApiTypes.DATE, description="YYYY-MM-DD"),
            OpenApiParameter("end_date", OpenApiTypes.DATE, description="YYYY-MM-DD"),
        ],
        tags=["Owner Dashboard"]
    )
    @action(detail=False, methods=['get'], url_path='clients-stats/(?P<client_id>[0-9]+)/details')
    def client_detail(self, request, client_id=None):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        try:
            client = Client.objects.get(pk=client_id)
        except Client.DoesNotExist:
            return Response({"detail": "Клієнта не знайдено."}, status=404)

        qs = Order.objects.filter(client_id=client_id)
        if start_date and end_date:
            qs = qs.filter(created_at__date__range=[start_date, end_date])

        # ── ЗАГАЛЬНА СТАТИСТИКА (Точно як у таблиці) ──────────
        summary_stats = qs.aggregate(
            total_orders=Count('id'),
            total_revenue=Coalesce(Sum('total_amount'), Decimal('0.00')),
            unpaid_count=Count('id', filter=~Q(client_status=PAID_STATUS_ID))
        )

        total_orders_val = summary_stats['total_orders'] or 0
        total_revenue_val = summary_stats['total_revenue'] or Decimal('0.00')
        avg_check_val = (total_revenue_val / total_orders_val) if total_orders_val > 0 else Decimal('0.00')

        # ── Графіки ─────────
        orders_chart = (
            qs.annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )

        revenue_chart = (
            qs.filter(status_id__in=SUCCESS_STATUSES)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(amount=Coalesce(Sum('total_amount'), Decimal('0.00')))
            .order_by('date')
        )

        language_pairs = (
            qs.filter(status_id__in=SUCCESS_STATUSES)
            .annotate(
                pair_name=Concat(
                    F('language_pair_id__source_language__name'),
                    Value(' → '),
                    F('language_pair_id__target_language__name'),
                )
            )
            .values('pair_name')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        return Response({
            "client_info": {
                "id": client.id,
                "full_name": client.full_name,
                "email": client.email,
            },
            # Додали ось цей блок:
            "summary": {
                "total_orders": total_orders_val,
                "total_revenue": total_revenue_val,
                "avg_order_value": round(avg_check_val, 2),
                "unpaid_orders_count": summary_stats['unpaid_count'] or 0
            },
            "orders_chart": list(orders_chart),
            "revenue_chart": list(revenue_chart),
            "language_pairs": list(language_pairs),
        })

    # ── Статистика перекладачів ────────────────
    @extend_schema(
        summary="Статистика по перекладачах",
        description="Кількість замовлень, середня оцінка якості та кількість повернень на доопрацювання (статус Revision, id=11).",
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
        end_date   = request.query_params.get('end_date')

        order_filters = Q()
        if start_date and end_date:
            order_filters &= Q(order__created_at__date__range=[start_date, end_date])

        revision_filter = order_filters & Q(order__status_id=REVISION_STATUS_ID)

        stats = Translator.objects.annotate(
            total_orders=Count('order', filter=order_filters),
            total_revenue=Coalesce(
                Sum('order__total_amount', filter=order_filters),
                Decimal('0.00')
            ),
            avg_rating=Coalesce(
                # Рейтинг — поле на моделі Translator, не агрегується, просто передаємо
                F('rating'),
                0.0,
                output_field=FloatField()
            ),
            revision_count=Count('order', filter=revision_filter),
        ).order_by('-total_orders')

        result = []
        for t in stats:
            result.append({
                'id':             t.id,
                'full_name':      t.full_name,
                'total_orders':   t.total_orders,
                'total_revenue':  t.total_revenue,
                'avg_rating':     round(t.avg_rating, 2),
                'revision_count': t.revision_count,
            })

        return Response(result)

    @action(detail=False, methods=['get'], url_path='translators-stats/(?P<translator_id>[0-9]+)/details')
    def translator_detail(self, request, translator_id=None):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        try:
            translator = Translator.objects.get(pk=translator_id)
        except Translator.DoesNotExist:
            return Response({"detail": "Перекладача не знайдено."}, status=404)

        qs = Order.objects.filter(translator_id=translator_id)
        if start_date and end_date:
            qs = qs.filter(created_at__date__range=[start_date, end_date])

        now = timezone.now()

        summary_stats = qs.aggregate(
            total_orders=Count('id', distinct=True),
            total_revenue=Coalesce(Sum('total_amount'), Decimal('0.00')),
            total_cogs=Coalesce(
                Sum(
                    ExpressionWrapper(
                        Cast('page_count', DecimalField(max_digits=12, decimal_places=2)) *
                        Cast('translator_traffic_id__rate_per_page', DecimalField(max_digits=12, decimal_places=2)),
                        output_field=DecimalField(max_digits=12, decimal_places=2)
                    )
                ),
                Decimal('0.00')
            ),
            revision_count=Count('id', filter=Q(status_id=REVISION_STATUS_ID), distinct=True),
        )

        total_orders_val = summary_stats['total_orders'] or 0
        total_revenue_val = summary_stats['total_revenue'] or Decimal('0.00')
        total_cogs_val = summary_stats['total_cogs'] or Decimal('0.00')
        gross_profit = total_revenue_val - total_cogs_val
        avg_margin_val = (gross_profit / total_revenue_val * 100) if total_revenue_val > 0 else Decimal('0.00')
        avg_check_val = (total_revenue_val / total_orders_val) if total_orders_val > 0 else Decimal('0.00')

        orders_chart = (
            qs.annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id', distinct=True))
            .order_by('date')
        )

        revenue_chart = (
            qs.filter(status_id__in=SUCCESS_STATUSES)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(amount=Coalesce(Sum('total_amount'), Decimal('0.00')))
            .order_by('date')
        )

        return Response({
            "translator_info": {
                "id": translator.id,
                "full_name": translator.full_name,
                "email": translator.email,
                "rating": translator.rating,
            },
            "summary": {
                "total_orders": total_orders_val,
                "total_revenue": total_revenue_val,
                "avg_order_value": round(avg_check_val, 2),
                "avg_margin_percent": round(avg_margin_val, 2),
                "revision_count": summary_stats['revision_count'] or 0,
            },
            "orders_chart": list(orders_chart),
            "revenue_chart": list(revenue_chart),
        })

    # ── Статистика редакторів ──────────────────
    @extend_schema(
        summary="Статистика по редакторах",
        description="Кількість замовлень, виручка, маржа, сторінки та символи по кожному редактору (без обмеження по статусах).",
        parameters=[
            OpenApiParameter("start_date", OpenApiTypes.DATE),
            OpenApiParameter("end_date", OpenApiTypes.DATE),
        ],
        tags=["Owner Dashboard"]
    )
    @action(detail=False, methods=['get'], url_path='editors-stats')
    def editor_stats(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        # Фільтр виключно за датою (без статусів, як у менеджерів)
        order_filters = Q()
        if start_date and end_date:
            order_filters &= Q(edited_orders__created_at__date__range=[start_date, end_date])

        stats = User.objects.filter(role__slug='editor').annotate(
            # 1. Загальна кількість замовлень
            total_orders=Count('edited_orders', filter=order_filters, distinct=True),

            # 2. Загальна виручка
            total_revenue=Coalesce(
                Sum(
                    Cast('edited_orders__total_amount', DecimalField(max_digits=12, decimal_places=2)),
                    filter=order_filters
                ),
                Decimal('0.00'),
                output_field=DecimalField(max_digits=12, decimal_places=2)
            ),

            # 3. Витрати (на перекладачів) для підрахунку маржі
            total_cogs=Coalesce(
                Sum(
                    ExpressionWrapper(
                        Cast('edited_orders__page_count', DecimalField(max_digits=12, decimal_places=2)) *
                        Cast('edited_orders__translator_traffic_id__rate_per_page',
                             DecimalField(max_digits=12, decimal_places=2)),
                        output_field=DecimalField(max_digits=12, decimal_places=2)
                    ),
                    filter=order_filters
                ),
                Decimal('0.00'),
                output_field=DecimalField(max_digits=12, decimal_places=2)
            ),

            # 4. Загальна кількість сторінок
            total_pages=Coalesce(
                Sum(
                    Cast('edited_orders__page_count', DecimalField(max_digits=12, decimal_places=2)),
                    filter=order_filters
                ),
                Decimal('0.00'),
                output_field=DecimalField(max_digits=12, decimal_places=2)
            ),

            # 5. Символи (якщо додасте в модель, розкоментуйте ці рядки)
            # total_chars_with=Coalesce(Sum('edited_orders__chars_with_spaces', filter=order_filters), 0, output_field=IntegerField()),
            # total_chars_without=Coalesce(Sum('edited_orders__chars_without_spaces', filter=order_filters), 0, output_field=IntegerField()),

        ).annotate(
            # Розрахунок маржі у грошах
            gross_profit=ExpressionWrapper(
                F('total_revenue') - F('total_cogs'),
                output_field=DecimalField(max_digits=12, decimal_places=2)
            )
        ).annotate(
            # Відсоток маржі
            avg_margin_percent=Case(
                When(total_revenue=0, then=Value(Decimal('0.00'))),
                default=ExpressionWrapper(
                    (F('gross_profit') / F('total_revenue')) * Value(Decimal('100.0')),
                    output_field=DecimalField(max_digits=5, decimal_places=2)
                ),
                output_field=DecimalField(max_digits=5, decimal_places=2)
            )
        ).order_by('-total_orders')

        result = []
        for editor in stats:
            result.append({
                'id': editor.id,
                'full_name': editor.full_name,
                'total_orders': editor.total_orders,
                'total_revenue': editor.total_revenue,
                'gross_profit': editor.gross_profit,
                'avg_margin_percent': round(editor.avg_margin_percent, 2),
                'total_pages': editor.total_pages,

                # 'total_chars_with':    editor.total_chars_with,
                # 'total_chars_without': editor.total_chars_without,
            })

        return Response(result)

    @extend_schema(
        summary="Детальна статистика редактора",
        description="Повертає інформацію про редактора, динаміку замовлень по днях та час на сторінку.",
        parameters=[
            OpenApiParameter("start_date", OpenApiTypes.DATE, description="YYYY-MM-DD"),
            OpenApiParameter("end_date", OpenApiTypes.DATE, description="YYYY-MM-DD"),
        ],
        tags=["Owner Dashboard"]
    )
    @action(detail=False, methods=['get'], url_path='editors-stats/(?P<editor_id>[0-9]+)/details')
    def editor_detail(self, request, editor_id=None):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        try:
            editor = User.objects.get(pk=editor_id, role__slug='editor')
        except User.DoesNotExist:
            return Response({"detail": "Редактора не знайдено."}, status=404)

        # Отримуємо всі замовлення цього редактора
        # (переконайтесь, що поле в Order називається editor_id.
        # Якщо інакше - змініть editor_id= на правильну назву)
        qs = Order.objects.filter(editor_id=editor_id)

        if start_date and end_date:
            qs = qs.filter(created_at__date__range=[start_date, end_date])

        # ── ЗАГАЛЬНА СТАТИСТИКА ──────────
        summary_stats = qs.aggregate(
            total_orders=Count('id', distinct=True),
            total_pages=Coalesce(Sum(Cast('page_count', DecimalField(max_digits=12, decimal_places=2))),
                                 Decimal('0.00')),
            total_revenue=Coalesce(Sum(Cast('total_amount', DecimalField(max_digits=12, decimal_places=2))),
                                   Decimal('0.00')),
            total_cogs=Coalesce(
                Sum(
                    ExpressionWrapper(
                        Cast('page_count', DecimalField(max_digits=12, decimal_places=2)) *
                        Cast('translator_traffic_id__rate_per_page', DecimalField(max_digits=12, decimal_places=2)),
                        output_field=DecimalField(max_digits=12, decimal_places=2)
                    )
                ),
                Decimal('0.00')
            )
        )

        total_orders_val = summary_stats['total_orders'] or 0
        total_pages_val = summary_stats['total_pages'] or Decimal('0.00')
        total_revenue_val = summary_stats['total_revenue'] or Decimal('0.00')
        total_cogs_val = summary_stats['total_cogs'] or Decimal('0.00')

        gross_profit = total_revenue_val - total_cogs_val
        avg_margin_val = (gross_profit / total_revenue_val * 100) if total_revenue_val > 0 else Decimal('0.00')

        # 🕒 РОЗРАХУНОК ЧАСУ НА СТОРІНКУ
        # УВАГА: Тут вам треба підставити реальні години.
        # Якщо у вас є поле work_hours в Order, то розрахунок буде такий:
        # total_hours = qs.aggregate(sum=Sum('work_hours'))['sum'] or 0
        # avg_time_per_page = float(total_hours) / float(total_pages_val) if total_pages_val > 0 else 0.0

        avg_time_per_page = 0.0  # ТИМЧАСОВА ЗАГЛУШКА (змініть на реальний розрахунок)

        # ── Графіки ─────────
        orders_chart = (
            qs.annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id', distinct=True))
            .order_by('date')
        )

        # Графік часу на сторінку по днях (теж потребує реального поля годин)
        # Наразі віддаємо порожній список, щоб фронтенд не падав,
        # поки ви не додасте обчислення годин у вашій базі.
        time_chart = []

        return Response({
            "editor_info": {
                "id": editor.id,
                "full_name": editor.full_name,
                "email": editor.email,
            },
            "summary": {
                "total_orders": total_orders_val,
                "total_pages": float(total_pages_val),
                "total_revenue": total_revenue_val,
                "avg_margin_percent": round(avg_margin_val, 2),
                "avg_time_per_page": round(avg_time_per_page, 2)
            },
            "orders_chart": list(orders_chart),
            "time_chart": list(time_chart),
        })

    # ── Топ мовних пар ─────────────────────────
    @extend_schema(
        summary="Топ мовних пар",
        description="Кількість замовлень, загальний дохід та середній чек по кожній мовній парі.",
        parameters=[
            OpenApiParameter("start_date", OpenApiTypes.DATE),
            OpenApiParameter("end_date", OpenApiTypes.DATE),
        ],
        tags=["Owner Dashboard"]
    )
    @action(detail=False, methods=['get'], url_path='language-pairs-stats')
    def language_pair_stats(self, request):
        start_date = request.query_params.get('start_date')
        end_date   = request.query_params.get('end_date')

        qs = Order.objects.filter(status_id__in=SUCCESS_STATUSES)
        if start_date and end_date:
            qs = qs.filter(created_at__date__range=[start_date, end_date])

        data = qs.annotate(
            pair_name=Concat(
                F('language_pair_id__source_language__name'),
                Value(' → '),
                F('language_pair_id__target_language__name')
            )
        ).values('pair_name').annotate(
            total_orders=Count('id'),
            total_revenue=Coalesce(Sum('total_amount'), Decimal('0.00')),
        ).order_by('-total_revenue')

        result = []
        for row in data:
            total_orders  = row['total_orders'] or 0
            total_revenue = row['total_revenue'] or Decimal('0.00')
            avg_check     = (total_revenue / total_orders) if total_orders > 0 else Decimal('0.00')
            result.append({
                'pair_name':     row['pair_name'],
                'total_orders':  total_orders,
                'total_revenue': total_revenue,
                'avg_order_value': round(avg_check, 2),
            })

        return Response(result)


# ─────────────────────────────────────────────
# P&L Звіт
# ─────────────────────────────────────────────
class PnLViewSet(viewsets.ViewSet):

    @extend_schema(
        summary="PnL Звіт",
        description=(
            "Повний фінансовий звіт за період: Revenue, COGS, Gross Profit, "
            "Gross Margin %, OPEX, Net Profit, AOV. "
            "Додатково підтримує розбивку (breakdown) по клієнту, менеджеру або мовній парі."
        ),
        parameters=[
            OpenApiParameter("start_date", OpenApiTypes.DATE, required=True),
            OpenApiParameter("end_date",   OpenApiTypes.DATE, required=True),
            OpenApiParameter(
                "group_by", str,
                description="Розбивка: client | manager | translator | language_pair"
            ),
        ],
        tags=["Finance Analytics"]
    )
    def list(self, request):
        start_date = request.query_params.get('start_date')
        end_date   = request.query_params.get('end_date')
        group_by   = request.query_params.get('group_by')

        # ── Базові замовлення за період ───────
        orders = Order.objects.filter(
            completed_at__date__range=[start_date, end_date],
            status_id__in=[2, 9]
        )

        # ── Revenue = закриті замовлення + income транзакції ──
        from apps.core.models import Transaction

        orders_revenue = (
            orders.aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
        )
        transactions_income = (
            Transaction.objects.filter(
                type='income',
                created_at__date__range=[start_date, end_date]
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        )
        revenue = Decimal(orders_revenue) + Decimal(transactions_income)

        # ── COGS = сума виплат перекладачам (сторінки * rate_per_page) ──
        orders_with_cost = orders.annotate(
            translator_cost_calc=ExpressionWrapper(
                Cast(F('page_count'), DecimalField(max_digits=12, decimal_places=2)) *
                Cast(F('translator_traffic_id__rate_per_page'), DecimalField(max_digits=12, decimal_places=2)),
                output_field=DecimalField(max_digits=12, decimal_places=2)
            )
        )
        cogs = orders_with_cost.aggregate(
            sum=Sum('translator_cost_calc')
        )['sum'] or Decimal('0.00')

        # ── Gross Profit & Margin ─────────────
        gross_profit = revenue - cogs
        gross_margin = (
            (Decimal(gross_profit) / Decimal(revenue)) * Decimal('100.0')
            if revenue > 0 else Decimal('0.0')
        )

        # ── OPEX = витрати з транзакцій ───────
        opex_agg = Transaction.objects.filter(
            created_at__date__range=[start_date, end_date],
            type='expense'
        ).aggregate(sum=Sum('amount'))['sum']
        total_opex = Decimal(str(opex_agg)) if opex_agg is not None else Decimal('0.00')

        # ── Net Profit ────────────────────────
        net_profit = gross_profit - total_opex

        # ── AOV (Average Order Value) ─────────
        total_order_count = orders.count()
        aov = (revenue / total_order_count) if total_order_count > 0 else Decimal('0.00')

        # ── Breakdown ─────────────────────────
        breakdown_data = []
        if group_by:
            if group_by == 'language_pair':
                breakdown_qs = orders_with_cost.annotate(
                    full_pair_name=Concat(
                        F('language_pair_id__source_language__name'),
                        Value(' → '),
                        F('language_pair_id__target_language__name')
                    )
                ).values(name=F('full_pair_name'))
            else:
                mapping = {
                    'client':     'client_id__full_name',
                    'manager':    'manager_accept_id__full_name',
                    'translator': 'translator_id__full_name',
                }
                db_field = mapping.get(group_by)
                if not db_field:
                    return Response({"detail": f"Невідомий group_by: {group_by}"}, status=400)
                breakdown_qs = orders_with_cost.values(name=F(db_field))

            raw = breakdown_qs.annotate(
                val_revenue=Coalesce(Sum('total_amount'), Decimal('0.00')),
                val_cost=Coalesce(Sum('translator_cost_calc'), Decimal('0.00')),
                val_orders=Count('id'),
            ).order_by('-val_revenue')

            for row in raw:
                val_revenue = row['val_revenue'] or Decimal('0.00')
                val_cost    = row['val_cost']    or Decimal('0.00')
                val_orders  = row['val_orders']  or 0
                val_profit  = val_revenue - val_cost
                row_aov     = (val_revenue / val_orders) if val_orders > 0 else Decimal('0.00')

                breakdown_data.append({
                    'name':        row['name'],
                    'val_revenue': val_revenue,
                    'val_cost':    val_cost,
                    'val_profit':  val_profit,
                    'val_orders':  val_orders,
                    'avg_order_value': round(row_aov, 2),
                })

        return Response({
            "period": {"start": start_date, "end": end_date},
            "summary": {
                "revenue":              revenue,
                "cogs":                 cogs,
                "gross_profit":         gross_profit,
                "gross_margin_percent": round(gross_margin, 2),
                "opex":                 total_opex,
                "net_profit":           net_profit,
                "avg_order_value":      round(aov, 2),
                "total_orders":         total_order_count,
            },
            "breakdown": breakdown_data
        })
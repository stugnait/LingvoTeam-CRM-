from datetime import timezone, timedelta

from django.db.models import Q, Count, Sum
from django.db.models.functions import Coalesce
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.clients.models import Client
from apps.orders.models import Order
from apps.statistic.serializers import OwnerOrderListSerializer, StatsSerializer
from apps.translators.models import Translator
from apps.users.models import User


from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, NumberFilter
from apps.orders.models import Order
from django.utils import timezone


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
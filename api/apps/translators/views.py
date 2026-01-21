from datetime import timedelta

from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, filters
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as django_filters
from django.db.models import Count  # 1. Імпортуємо Count для підрахунку
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import viewsets
from rest_framework import status as http_status
from ..orders.models import OrderLink, status

from .models import Translator, TranslatorTraffic
from .serializers import TranslatorSerializer, TranslatorTrafficSerializer
from ..orders.models import OrderLink, status
from ..orders.serializers import OrderCreateSerializer
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

    ordering_fields = ['created_at', 'full_name', 'orders_count']

    def get_queryset(self):
        return Translator.objects.annotate(
            orders_count=Count('order')
        ).order_by('-created_at').distinct()

    def get_required_permissions(self, request):
        if self.action == 'create':
            return ['translator.create']
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


class ExternalOrderAccessView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        link_obj = get_object_or_404(OrderLink, link=slug)

        if link_obj.expire_at < timezone.now():
            return Response({"error": "Термін дії посилання закінчився"}, status=http_status.HTTP_410_GONE)

        return Response({
            "message": "URL валідний. Очікується пароль.",
            "status": "awaiting_password"
        }, status=http_status.HTTP_200_OK)

    def post(self, request, slug):
        link_obj = get_object_or_404(OrderLink, link=slug)
        now = timezone.now()

        if link_obj.banned_to and link_obj.banned_to > now:
            remaining_time = int((link_obj.banned_to - now).total_seconds() / 60)
            return Response({
                "error": f"Забагато спроб. Доступ заблоковано. Спробуйте через {remaining_time} хв."
            }, status=http_status.HTTP_429_TOO_MANY_REQUESTS)

        input_password = request.data.get('password')

        if link_obj.password == input_password:
            link_obj.attempts = 0
            link_obj.banned_to = None
            link_obj.save()

            order = link_obj.order
            return Response({
                "access": "granted",
                "order_data": {
                    "id": order.id,
                    "language_pair": str(order.language_pair_id),
                    "deadline": order.deadline,
                    "comment": getattr(order, 'translator_comment', "Коментар відсутній")
                }
            }, status=http_status.HTTP_200_OK)

        link_obj.attempts += 1

        if link_obj.attempts >= 5:
            link_obj.banned_to = now + timedelta(minutes=3)
            message = "Невірний пароль. Доступ заблоковано на 15 хвилин."
        else:
            message = f"Невірний пароль. Залишилося спроб: {5 - link_obj.attempts}"

        link_obj.save()

        return Response({"error": message}, status=http_status.HTTP_403_FORBIDDEN)
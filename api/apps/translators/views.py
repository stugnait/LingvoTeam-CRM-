import secrets
import os
from datetime import timedelta

from django.db import transaction
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
from rest_framework.parsers import MultiPartParser, FormParser

from .models.translator_language_pairs import TranslatorLanguagePairs
from ..orders.models import OrderLink, status

from .models import Translator, TranslatorTraffic
from ..orders.models import Order, File
from .serializers import TranslatorSerializer, TranslatorTrafficSerializer
from ..orders.models import OrderLink, status
from ..orders.serializers import OrderCreateSerializer
from ..users.permissions import HasPermission

from rest_framework import viewsets
from .serializers import TranslatorLanguagePairsSerializer, TranslatorUploadFileSerializer

from ..dropbox_services.dropbox_utils import upload_file_to_order_folder


class TranslatorLanguagePairsViewSet(viewsets.ModelViewSet):
    queryset = TranslatorLanguagePairs.objects.all().select_related('translator', 'language_pair')
    serializer_class = TranslatorLanguagePairsSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        translator_id = self.request.query_params.get('translator_id')
        if translator_id:
            queryset = queryset.filter(translator_id=translator_id)
        return queryset

class NumberInFilter(django_filters.BaseInFilter, django_filters.NumberFilter):
    pass

class TranslatorFilter(django_filters.FilterSet):
    categories = NumberInFilter(
        field_name='translatortraffic__category',
        lookup_expr='in'
    )

    language_pair_id = django_filters.NumberFilter(
        field_name='language_pair_relations__language_pair'
    )

    source_language = django_filters.NumberFilter(
        field_name='language_pair_relations__language_pair__source_lang'
    )
    target_language = django_filters.NumberFilter(
        field_name='language_pair_relations__language_pair__target_lang'
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

    def get_queryset(self):
        return Translator.objects.annotate(
            orders_count=Count('order')
        ).prefetch_related('translatortraffic').order_by('-created_at').distinct()


class TranslatorTrafficViewSet(viewsets.ModelViewSet):
    queryset = TranslatorTraffic.objects.select_related(
        'language_pair',
        'currency_id',
        'translator',
        'category'
    ).all()

    serializer_class = TranslatorTrafficSerializer

    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['translator', 'language_pair', 'category']
    permission_classes = [HasPermission]
    required_permissions = ['translator.traffic.manage']


class ExternalOrderAccessView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        link_obj = get_object_or_404(OrderLink, link=slug)

        if link_obj.expire_at < timezone.now():
            return Response(
                {"error": "Термін дії посилання закінчився"},
                status=http_status.HTTP_410_GONE
            )

        return Response({
            "message": "URL валідний. Очікується пароль.",
            "status": "awaiting_password"
        }, status=http_status.HTTP_200_OK)

    def post(self, request, slug):
        with transaction.atomic():
            link_obj = get_object_or_404(OrderLink.objects.select_for_update(), link=slug)
            now = timezone.now()

            if link_obj.expire_at < now:
                return Response(
                    {"error": "Термін дії посилання закінчився"},
                    status=http_status.HTTP_410_GONE
                )


            if link_obj.banned_to and link_obj.banned_to > now:
                remaining_time = int((link_obj.banned_to - now).total_seconds() / 60)
                display_time = remaining_time if remaining_time > 0 else 1
                return Response({
                    "error": f"Забагато спроб. Доступ заблоковано. Спробуйте через {display_time} хв."
                }, status=http_status.HTTP_429_TOO_MANY_REQUESTS)

            input_password = request.data.get('password', '')

            if secrets.compare_digest(link_obj.password, input_password):
                link_obj.attempts = 0
                link_obj.banned_to = None
                link_obj.save()

                order = link_obj.order

                response = Response({
                    "access": "granted",
                    "order_data": {
                        "id": order.id,
                        "language_pair": str(order.language_pair_id),
                        "deadline": order.deadline,
                        "comment": getattr(order, 'translator_comment', "Коментар відсутній")
                    }
                }, status=http_status.HTTP_200_OK)

                max_age = int((link_obj.expire_at - now).total_seconds())

                response.set_cookie(
                    key=f'order_auth_{order.id}',
                    value=input_password,
                    max_age=max_age,
                    httponly=True,
                    samesite='Lax',
                    secure=False
                )

                return response

            link_obj.attempts += 1
            max_attempts = 5
            ban_minutes = 15

            if link_obj.attempts >= max_attempts:
                link_obj.banned_to = now + timedelta(minutes=ban_minutes)
                link_obj.attempts = 0
                message = f"Невірний пароль. Доступ заблоковано на {ban_minutes} хвилин."
            else:
                remaining_attempts = max_attempts - link_obj.attempts
                message = f"Невірний пароль. Залишилося спроб: {remaining_attempts}"

            link_obj.save()

            return Response({"error": message}, status=http_status.HTTP_403_FORBIDDEN)

class TranslatorUploadView(APIView):
    permission_classes = [AllowAny]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        order_id = request.data.get("order_id")
        if not order_id:
            return Response(
                {"detail": "order_id is required"},
                status=http_status.HTTP_400_BAD_REQUEST
            )

        order = get_object_or_404(Order, id=order_id)

        serializer = TranslatorUploadFileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        files = serializer.validated_data["files"]
        base_path = f"/orders/order_{order.id}"

        uploaded = []
        for f in files:
            dropbox_path = upload_file_to_order_folder(
                order=order,
                file=f,
                base_path=base_path,
                subdir="target",
            )
            uploaded.append({
                "filename": f.name,
                "dropbox_path": dropbox_path
            })

        for i, f in enumerate(files):
            ext = os.path.splitext(f.name)[1].lstrip(".").lower()
            File.objects.create(
                order=order,
                file_type=ext,
                dropbox_url=uploaded[i]["dropbox_path"],
                detected_pages=0,
                detected_symbols=0,
            )

        return Response(
            {
                "message": "Files uploaded",
                "count": len(uploaded),
                "files": uploaded
            },
            status=http_status.HTTP_201_CREATED,
        )

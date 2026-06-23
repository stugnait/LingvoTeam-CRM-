import mimetypes
from csv import reader
import re
from decimal import Decimal, InvalidOperation

import docx
import pypdf
import zipfile
import tempfile
import uuid
import secrets
import os
import logging
from io import BytesIO
from datetime import timedelta
import easyocr
import numpy as np

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework import status
from .utils import analyze_file_content

# Third-party imports
from PIL import Image
import pytesseract
import fitz  # PyMuPDF

# Django imports
from django.core.mail import send_mail
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.http import FileResponse
from django.conf import settings
from django_filters import OrderingFilter, filters
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import OrderingFilter, SearchFilter
from django.db.models import Q, Avg, F
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

# DRF imports
from rest_framework import viewsets, status, request
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

# Local imports
from .models import (
    Order, OrderTraffic, Status, OrderLink,
    OrderEditorReview, TranslationQuality, File, OrderStatusHistory
)
from .serializers import (
    OrderCreateSerializer, OrderTrafficSerializer,
    RejectTranslationSerializer, ApproveTranslationSerializer,
    OrderListSerializer, UploadFileSerializer
)
from .utils import analyze_file_content
from ..core.models import LanguagePair, Language
from ..core.serializers import LanguagePairSelectSerializer
from ..notifications.models import Notification
from ..translators.models import Translator
from ..users.permissions import HasPermission
from ..dropbox_services.dropbox_utils import (
    create_order_folder, upload_file_to_order_folder, get_dbx, move_file_from_target_to_final
)
from ..translators.models import TranslatorTraffic
from ..users.models import EditorLanguagePairs, User, RolePermission
from django_filters import rest_framework as filters

logger = logging.getLogger(__name__)


class OrderTrafficFilter(filters.FilterSet):
    currency = filters.AllValuesFilter(field_name='currency_id')
    category = filters.AllValuesFilter(field_name='category')
    language_pair = filters.AllValuesFilter(field_name='language_pair')

    class Meta:
        model = OrderTraffic
        fields = ['currency', 'category', 'language_pair']


class OrderFilter(filters.FilterSet):
    status = filters.ModelChoiceFilter(field_name='status_id', queryset=Status.objects.all())
    manager = filters.ModelChoiceFilter(queryset=User.objects.all(), method='filter_by_manager')
    date_from = filters.DateFilter(field_name='created_at', lookup_expr='gte')
    date_to = filters.DateFilter(field_name='created_at', lookup_expr='lte')
    deadline_from = filters.DateFilter(field_name='deadline', lookup_expr='gte')
    deadline_to = filters.DateFilter(field_name='deadline', lookup_expr='lte')

    class Meta:
        model = Order
        fields = ['status', 'created_at', 'deadline']

    def filter_by_manager(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(
            Q(manager_accept_id=value) | Q(manager_delivery_id=value)
        )


@extend_schema_view(
    list=extend_schema(summary="Список трафіку замовлень", tags=["Order Pricing"]),
    retrieve=extend_schema(summary="Деталі трафіку", tags=["Order Pricing"]),
    create=extend_schema(summary="Створити тариф замовлення", tags=["Order Pricing"]),
    update=extend_schema(summary="Оновити тариф замовлення", tags=["Order Pricing"]),
)
class OrderTrafficViewSet(viewsets.ModelViewSet):
    queryset = OrderTraffic.objects.select_related(
        'language_pair',
        'currency_id',
        'category'
    ).all()
    serializer_class = OrderTrafficSerializer
    permission_classes = [HasPermission]

    required_permissions = ['order.traffic.manage']
    filter_backends = [
        DjangoFilterBackend,
        OrderingFilter,
        SearchFilter
    ]

    search_fields = ['name']
    ordering_fields = ['price_per_page', 'id', 'name', 'position', 'created_at', 'deadline']

    filterset_class = OrderTrafficFilter
    ordering = ['id']


class AnalyzeFileUploadView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request, *args, **kwargs):
        uploaded_file = request.FILES.get('file')

        if not uploaded_file:
            return Response(
                {"detail": "Файл не завантажено або передано неправильний ключ."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            file_stats = analyze_file_content(uploaded_file)
            return Response(file_stats, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"detail": f"Помилка під час аналізу файлу: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@extend_schema_view(
    list=extend_schema(
        summary="Список замовлень",
        description="Повертає замовлення залежно від ролі: адмін бачить все, редактор — лише свої.",
        tags=["Orders"]
    ),
    create=extend_schema(
        summary="Створити замовлення",
        description="Створює замовлення, завантажує файли в Dropbox, аналізує текст та генерує посилання для перекладача.",
        tags=["Orders"]
    ),
    retrieve=extend_schema(summary="Деталі замовлення", tags=["Orders"]),
    update=extend_schema(summary="Оновити замовлення", tags=["Orders"]),
    partial_update=extend_schema(summary="Частково змінити замовлення", tags=["Orders"]),
    destroy=extend_schema(summary="Видалити замовлення", tags=["Orders"]),
)
class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    permission_classes = [HasPermission]
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_class = OrderFilter
    ordering_fields = ['id', 'position', 'created_at']

    ordering = ['-id']

    search_fields = ['id']

    def get_required_permissions(self, request):
        mapping = {
            'create': ['order.create'],
            'list': ['order.view'],
            'retrieve': ['order.view'],
            'update': [AllowAny],
            'assign_translator': ['order.assign'],
            'reject_translation': ['order.reject_translation'],
            'approve_translation': ['order.approve_translation'],
            'download_files': ['order.view'],
            'analyze_images': ['order.update'],
            'upload_files': ['order.view'],
            'upload_target_files': ['order.view'],
            'margins': ['order.view'],
            'editors_by_language_pair': ['order.view'],
        }

        if self.action in ['update', 'partial_update']:
            status_fields = {'status_id', 'editor_status', 'client_status', 'translator_status'}
            data_keys = set(request.data.keys())
            if data_keys.intersection(status_fields):
                return ['order.change.status']
            return ['order.update']

        return mapping.get(self.action, [])

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return Order.objects.none()

        if user.role.slug in ['admin', 'owner']:
            queryset = Order.objects.all()
        elif user.role.slug == 'editor':
            queryset = Order.objects.filter(editor_id=user)
        else:
            queryset = Order.objects.all()

        my_orders_only = self.request.query_params.get('my_orders')
        if my_orders_only and my_orders_only.lower() == 'true':
            queryset = queryset.filter(Q(manager_accept_id=user) | Q(manager_delivery_id=user))

        return queryset

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return OrderListSerializer
        return OrderCreateSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        data = request.data.dict() if hasattr(request.data, 'getlist') else request.data.copy()
        if hasattr(request.data, 'getlist'):
            files_list = request.data.getlist('files')
            if files_list:
                data['files'] = files_list

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        source_id = serializer.validated_data.pop('source_language')
        target_id = serializer.validated_data.pop('target_language')
        serializer.validated_data.pop('files', None)

        try:
            language_pair_instance, created = LanguagePair.objects.get_or_create(
                source_language_id=source_id,
                target_language_id=target_id
            )
        except Exception as e:
            return Response({"detail": f"Помилка з мовною парою: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        raw_amount = data.get('total_amount')
        final_total_amount = Decimal('0.00')

        if raw_amount:
            raw_str = str(raw_amount).strip().lower()
            if raw_str not in ['', 'null', 'none', 'undefined']:
                try:
                    final_total_amount = Decimal(raw_str)
                except InvalidOperation:
                    pass

        status_planned = Status.objects.filter(slug__iexact="planned").first()
        status_to_do = Status.objects.filter(slug__iexact="to do").first() or status_planned
        client_unpaid = Status.objects.filter(slug__iexact="unpaid").first()

        # 1. Створюємо замовлення в базі, щоб отримати його order.id
        order = serializer.save(
            manager_accept_id_id=request.data.get('manager_accept_id'),
            manager_delivery_id_id=data.get('manager_delivery_id'),
            language_pair_id=language_pair_instance,
            status_id=status_planned,
            editor_status=status_planned,
            translator_status=status_to_do,
            client_status=client_unpaid,
            total_amount=final_total_amount,
            editor_id_id=data.get('editor_id'),
            traffic_id_id=data.get('traffic_id'),
            translator_id_id=data.get('translator_id'),
            translator_traffic_id_id=data.get('translator_traffic_id'),
        )

        generated_link_slug = str(uuid.uuid4())
        generated_password = secrets.token_urlsafe(8)
        expire_date = timezone.now() + timedelta(days=45)

        OrderLink.objects.create(
            order=order,
            assignee=OrderLink.Assignee.TRANSLATOR,
            link=generated_link_slug,
            password=generated_password,
            expire_at=expire_date
        )

        # 2. Аналізуємо файли і завантажуємо в Dropbox
        uploaded_files = request.FILES.getlist('files')
        stats_data = self._analyze_and_upload_files(order, uploaded_files)

        # 3. Витягуємо результати аналізу
        totals = stats_data.get("total_stats", {})

        # 4. Записуємо їх у вже створений об'єкт замовлення
        order.page_count = totals.get("physical_pages", 0)
        order.symbols_count = totals.get("chars_no_spaces", 0)
        order.symbols_with_spaces_count = totals.get("chars_with_spaces", 0)
        order.images_count = totals.get("images", 0)

        # 5. Оновлюємо базу даних
        order.save(update_fields=['page_count', 'symbols_count', 'symbols_with_spaces_count', 'images_count'])

        base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        full_link = f"{base_url}/translator/{generated_link_slug}"

        if order.translator_id and order.translator_id.email:
            self._send_translator_invite(order, full_link, generated_password, expire_date, order.translator_id)

        return Response({
            "message": "Замовлення успішно створено",
            "order_id": order.id,
            "language_pair": {
                "id": language_pair_instance.id,
                "source": source_id,
                "target": target_id
            },
            "stats": totals,
            "translator_link": {
                "slug": generated_link_slug,
                "password": generated_password,
                "expire_at": expire_date
            }
        }, status=status.HTTP_201_CREATED)

    @extend_schema(
        summary="Попередній розрахунок статистики файлів",
        description="Приймає файли, повертає кількість сторінок та символів. Не створює замовлення.",
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'files': {
                        'type': 'array',
                        'items': {'type': 'string', 'format': 'binary'}
                    }
                }
            }
        },
        tags=["Order Files"]
    )
    @action(detail=False, methods=['post'], url_path='calculate-stats', parser_classes=[MultiPartParser])
    def calculate_stats(self, request):
        files = request.FILES.getlist('files')

        if not files:
            return Response({"detail": "No files provided"}, status=status.HTTP_400_BAD_REQUEST)

        total_stats = {
            "chars_with_spaces": 0,
            "chars_no_spaces": 0,
            "images": 0,
            "physical_pages": 0
        }

        file_results = []

        for f in files:
            stats = analyze_file_content(f)

            total_stats["chars_with_spaces"] += stats["chars_with_spaces"]
            total_stats["chars_no_spaces"] += stats["chars_no_spaces"]
            total_stats["images"] += stats["images"]
            total_stats["physical_pages"] += stats["pages"]

            file_results.append({
                "filename": f.name,
                "stats": stats
            })

        return Response({
            "total_stats": total_stats,
            "files": file_results
        })

    def _analyze_and_upload_files(self, order, files):
        total_stats = {
            "chars_with_spaces": 0,
            "chars_no_spaces": 0,
            "images": 0,
            "physical_pages": 0
        }

        if not files:
            return {"total_stats": total_stats}

        uploaded_paths = []

        try:
            base_path = create_order_folder(order)
            for f in files:
                f.seek(0)
                try:
                    path = upload_file_to_order_folder(order, f, base_path=base_path, subdir="source")
                except Exception as e:
                    logger.error(f"UPLOAD ERROR: {e}")
                _ = upload_file_to_order_folder(order, f, base_path=base_path, subdir="target",
                                                create_only_dir="target")
                _ = upload_file_to_order_folder(order, f, base_path=base_path, subdir="final",
                                                create_only_dir="final")
                uploaded_paths.append(path)
        except Exception as e:
            logger.error(f"Upload failed: {e}")
            uploaded_paths = [None] * len(files)

        for i, f in enumerate(files):
            stats = analyze_file_content(f)

            total_stats["chars_with_spaces"] += stats["chars_with_spaces"]
            total_stats["chars_no_spaces"] += stats["chars_no_spaces"]
            total_stats["images"] += stats["images"]
            total_stats["physical_pages"] += stats["pages"]

            dropbox_url = (uploaded_paths[i] if i < len(uploaded_paths) else None) or "None"
            ext = os.path.splitext(f.name)[1].lstrip(".").lower()

            File.objects.create(
                order=order,
                file_type=ext,
                dropbox_url=dropbox_url,
                detected_pages=stats["pages"],
                detected_symbols=stats["chars_no_spaces"],
            )

        return {"total_stats": total_stats}

    @extend_schema(
        summary="Завантаження файлів перекладу (Target) менеджером",
        request=UploadFileSerializer,
        tags=["Order Files"]
    )
    @action(detail=True, methods=["post"], url_path="upload-target-files", parser_classes=[MultiPartParser, FormParser])
    def upload_target_files(self, request, pk=None):
        order = self.get_object()
        user = request.user

        is_authorized = (
            user == order.manager_accept_id or
            user == order.manager_delivery_id or
            user == order.translator_id or
            user == order.editor_id
        )

        if not is_authorized and not user.role.slug in ['admin', 'owner']:
            return Response({"detail": "Недостатньо прав."}, status=status.HTTP_403_FORBIDDEN)

        serializer = UploadFileSerializer(data=request.data)
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
            uploaded.append({"filename": f.name, "dropbox_path": dropbox_path})

        for i, f in enumerate(files):
            ext = os.path.splitext(f.name)[1].lstrip(".").lower()
            dropbox_url = uploaded[i]["dropbox_path"]

            File.objects.create(
                order=order,
                file_type=ext,
                dropbox_url=dropbox_url,
                detected_pages=0,
                detected_symbols=0,
            )

        return Response(
            {"message": "Target files uploaded", "count": len(uploaded), "files": uploaded},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'], url_path=r'analyze-folder/(?P<folder>source|target)')
    def analyze_folder_files(self, request, pk=None, folder=None):
        order = self.get_object()
        folder_param = (folder or "").strip().lower()

        files_qs = File.objects.filter(order=order)
        base_folder_path = f"/orders/order_{order.id}/{folder_param}"
        folder_files = files_qs.filter(dropbox_url__startswith=base_folder_path)

        if not folder_files.exists():
            return Response(
                {"detail": f"Файли у папці {folder_param} відсутні або ще не завантажені."},
                status=status.HTTP_404_NOT_FOUND
            )

        total_stats = {
            "chars_with_spaces": 0,
            "chars_no_spaces": 0,
            "images": 0,
            "physical_pages": 0
        }
        file_results = []

        try:
            dbx = get_dbx()
            for f_obj in folder_files:
                if not f_obj.dropbox_url or f_obj.dropbox_url == "None":
                    continue

                metadata, resp = dbx.files_download(f_obj.dropbox_url)
                file_bytes = resp.content
                filename = os.path.basename(f_obj.dropbox_url)

                file_mock = BytesIO(file_bytes)
                file_mock.name = filename
                file_mock.seek(0)

                stats = analyze_file_content(file_mock)

                total_stats["chars_with_spaces"] += stats.get("chars_with_spaces", 0)
                total_stats["chars_no_spaces"] += stats.get("chars_no_spaces", 0)
                total_stats["images"] += stats.get("images", 0)
                total_stats["physical_pages"] += stats.get("pages", 0)

                file_results.append({
                    "filename": filename,
                    "stats": stats
                })

            return Response({
                "folder": folder_param,
                "total_stats": total_stats,
                "files": file_results
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Помилка аналізу папки {folder_param} для замовлення {order.id}: {str(e)}")
            return Response(
                {"detail": f"Помилка під час аналізу файлів з сховища: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'], url_path='calculate-full', parser_classes=[MultiPartParser])
    def calculate_full(self, request):
        files = request.FILES.getlist('files')
        traffic_id = request.data.get('traffic_id')

        # Замість translator_id приймаємо конкретний ID обраного тарифу перекладача
        translator_traffic_id = request.data.get('translator_traffic_id')

        if not files or not traffic_id:
            return Response({"detail": "files and traffic_id required"}, status=status.HTTP_400_BAD_REQUEST)

        total_pages = Decimal('0')

        for f in files:
            f.seek(0)
            stats = analyze_file_content(f)
            total_pages += Decimal(str(stats["pages"]))

        # 1. Розрахунок ціни для клієнта (за тарифом замовлення)
        traffic = get_object_or_404(OrderTraffic, id=traffic_id)
        client_price = total_pages * Decimal(str(traffic.price_per_page))

        translator_rate = None
        translator_total = None
        margin = None

        # 2. Розрахунок оплати перекладачу (за ОБРАНИМ тарифом)
        if translator_traffic_id:
            try:
                tt = TranslatorTraffic.objects.get(id=translator_traffic_id)
                if tt.rate_per_page is not None:
                    translator_rate = Decimal(str(tt.rate_per_page))
                    translator_total = translator_rate * total_pages
                    margin = client_price - translator_total
            except TranslatorTraffic.DoesNotExist:
                return Response(
                    {"detail": "Обраний тариф перекладача не знайдено"},
                    status=status.HTTP_404_NOT_FOUND
                )

        return Response({
            "pages": float(total_pages),
            "client_price_per_page": str(traffic.price_per_page),
            "total_client_price": str(client_price.quantize(Decimal("0.01"))),
            # Явна перевірка is not None вирішує проблему з нулями
            "translator_rate_per_page": str(translator_rate) if translator_rate is not None else None,
            "translator_total": str(
                translator_total.quantize(Decimal("0.01"))) if translator_total is not None else None,
            "margin": str(margin.quantize(Decimal("0.01"))) if margin is not None else None,
        })
    @action(detail=True, methods=['post'], url_path='reject-translation')
    def reject_translation(self, request, pk=None):
        order = self.get_object()
        serializer = RejectTranslationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        comment = serializer.validated_data['review_comment']

        status_revision = Status.objects.filter(slug__iexact="revision").first()
        status_rejected = Status.objects.filter(slug__iexact="rejected").first()

        OrderEditorReview.objects.create(
            order=order,
            editor=request.user,
            review_comment=comment,
            review_status='rejected'
        )

        if status_revision and status_rejected:
            order.status_id = status_rejected
            order.editor_status = status_revision
            order.translator_status = status_revision
            order.save(update_fields=['status_id', 'editor_status', 'translator_status'])

        current_user = request.user
        manager_accept = order.manager_accept_id
        manager_delivery = order.manager_delivery_id

        recipients = set()
        if manager_accept and manager_accept != current_user:
            recipients.add(manager_accept)
        if manager_delivery and manager_delivery != current_user:
            recipients.add(manager_delivery)

        for manager_obj in recipients:
            try:
                Notification.objects.create(
                    recipient=manager_obj,
                    order=order,
                    title="Переклад відхилено",
                    message=comment,
                    status="rejected"
                )
            except Exception as e:
                logger.error(f"Failed to create notification: {e}")

            try:
                send_mail(
                    subject=f"Замовлення #{order.id}: Переклад відхилено — LingvoTeam",
                    message=(
                        f"Вітаємо, {manager_obj.full_name}!\n\n"
                        f"Редактор {current_user.full_name} відхилив переклад замовлення #{order.id}.\n"
                        f"Коментар: {comment}\n\n"
                        f"З повагою, команда LingvoTeam."
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[manager_obj.email],
                    fail_silently=True
                )
            except Exception as e:
                logger.error(f"Failed to send rejection email: {e}")

        return Response({"message": "Переклад відхилено, менеджер повідомлений."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='approve-translation', permission_classes=[AllowAny],
            parser_classes=[MultiPartParser, FormParser, JSONParser])
    def approve_translation(self, request, pk=None):
        order = get_object_or_404(Order, pk=pk)

        is_editor = False
        if request.user.is_authenticated:
            if request.user.is_staff:
                is_editor = True
            elif hasattr(request.user, 'role') and request.user.role:
                is_editor = RolePermission.objects.filter(
                    role=request.user.role,
                    permission__slug='order.approve_translation'
                ).exists()

        provided_password = request.COOKIES.get(f'order_auth_{order.id}') or request.data.get('password')
        link_obj = OrderLink.objects.filter(order=order).last()

        is_password_valid = False
        if provided_password and link_obj:
            is_password_valid = secrets.compare_digest(link_obj.password, provided_password)

        if not (is_editor or is_password_valid):
            return Response(
                {"detail": "У вас немає доступу (потрібна роль Editor або вірний пароль)."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ApproveTranslationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        score = serializer.validated_data['score']
        comment = serializer.validated_data.get('comment', '')

        uploaded_files = request.FILES.getlist('files')
        if uploaded_files:
            old_target_files = File.objects.filter(
                order=order,
                dropbox_url__contains='/target/'
            ).exclude(dropbox_url__exact="None")

            try:
                dbx = get_dbx()
                for f_obj in old_target_files:
                    try:
                        dbx.files_delete_v2(f_obj.dropbox_url)
                    except Exception as e:
                        logger.warning(f"Could not delete dropbox file {f_obj.dropbox_url}: {e}")
                old_target_files.delete()
            except Exception as e:
                logger.error(f"Failed to clean target files: {e}")

            try:
                base_path = f"/orders/order_{order.id}"
                for f in uploaded_files:
                    f.seek(0)
                    dropbox_path = upload_file_to_order_folder(
                        order=order,
                        file=f,
                        base_path=base_path,
                        subdir="target",
                    )
                    ext = os.path.splitext(f.name)[1].lstrip(".").lower()
                    File.objects.create(
                        order=order,
                        file_type=ext,
                        dropbox_url=dropbox_path,
                        detected_pages=0,
                        detected_symbols=0,
                    )
            except Exception as e:
                logger.error(f"Failed to upload editor files: {e}")
                return Response(
                    {"detail": f"Помилка завантаження файлів: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        acting_user = request.user if request.user.is_authenticated else None

        TranslationQuality.objects.update_or_create(
            order=order,
            defaults={
                'user': order.translator_id,
                'score': score,
                'comment': comment
            }
        )

        OrderEditorReview.objects.create(
            order=order,
            editor=acting_user,
            review_comment="Approved via guest link" if not acting_user else "Approved by editor",
            review_status='approved'
        )

        status_done = Status.objects.filter(slug__iexact="done").first()

        if status_done:
            order.status_id = status_done
            order.editor_status = status_done
            order.translator_status = status_done
            order.completed_at = timezone.now()
            order.save(update_fields=['status_id', 'editor_status', 'translator_status', 'completed_at'])

        if order.translator_id:
            self.update_translator_rating(order.translator_id)

        current_user = request.user if request.user.is_authenticated else None
        status_name = status_done.name if status_done else 'Done'
        msg_text = f"Замовлення #{order.id} перейшло в статус «{status_name}»"

        manager_accept = order.manager_accept_id
        manager_delivery = order.manager_delivery_id

        recipients = set()
        if manager_accept and manager_accept != current_user:
            recipients.add(manager_accept)
        if manager_delivery and manager_delivery != current_user:
            recipients.add(manager_delivery)

        for manager_obj in recipients:
            try:
                Notification.objects.create(
                    recipient=manager_obj,
                    order=order,
                    title="Замовлення перевірено та виконано",
                    message=comment,
                    status="rejected"
                )
            except Exception as e:
                logger.error(f"Failed to create notification: {e}")

            try:
                send_mail(
                    subject=f"Замовлення #{order.id}: Виконано — LingvoTeam",
                    message=(
                        f"Вітаємо, {manager_obj.full_name}!\n\n"
                        f"{msg_text}.\n\n"
                        f"З повагою, команда LingvoTeam."
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[manager_obj.email],
                    fail_silently=True
                )
            except Exception as e:
                logger.error(f"Failed to send email: {e}")

        return Response({
            "message": "Замовлення успішно прийнято та оцінено!",
            "files_replaced": len(uploaded_files) > 0,
            "files_count": len(uploaded_files),
        }, status=status.HTTP_200_OK)

    def update_translator_rating(self, translator):
        average_data = TranslationQuality.objects.filter(
            user=translator
        ).aggregate(avg_score=Avg('score'))

        new_rating = average_data['avg_score'] or 0.0

        translator.rating = round(new_rating, 2)
        translator.save(update_fields=['rating'])

        return translator.rating

    @extend_schema(
        summary="Завантажити файли (ZIP, список або окремий файл)",
        tags=["Order Files"]
    )
    @action(detail=True, methods=['get'],
            url_path=r'download-files(?:/(?P<folder>source|target|final)(?:/(?P<file_id>\d+))?)?')
    def download_files(self, request, pk=None, folder=None, file_id=None):
        order = self.get_object()
        user = request.user

        is_authorized = (
            user == order.manager_accept_id or
            user == order.manager_delivery_id or
            user == order.translator_id or
            user == order.editor_id
        )

        if not is_authorized and not user.role.slug in ['admin', 'owner']:
            return Response({"detail": "Недостатньо прав."}, status=status.HTTP_403_FORBIDDEN)

        files_qs = File.objects.filter(order=order)
        folder_param = (folder or "").strip().lower()

        if folder_param:
            base = f"/orders/order_{order.id}/{folder_param}"
            files_qs = files_qs.filter(dropbox_url__startswith=base)

        if not files_qs.exists():
            return Response({"detail": "Файли відсутні."}, status=status.HTTP_404_NOT_FOUND)

        if request.query_params.get("list") == "1":
            items = [{"id": f.id, "name": os.path.basename(f.dropbox_url or f"file_{f.id}")} for f in
                     files_qs.order_by("id")]
            return Response({"order_id": order.id, "folder": folder_param, "count": len(items), "files": items},
                            status=status.HTTP_200_OK)

        if file_id is not None:
            file_obj = get_object_or_404(files_qs, id=file_id)
            if not file_obj.dropbox_url:
                return Response({"detail": "Файл недоступний."}, status=status.HTTP_404_NOT_FOUND)

            try:
                dbx = get_dbx()
                _md, resp = dbx.files_download(file_obj.dropbox_url)

                filename = os.path.basename(file_obj.dropbox_url)
                content_type = getattr(resp, "headers", {}).get("Content-Type") or mimetypes.guess_type(filename)[
                    0] or "application/octet-stream"

                tmp = tempfile.SpooledTemporaryFile(max_size=50 * 1024 * 1024, mode="w+b")
                tmp.write(resp.content)
                tmp.seek(0)

                return FileResponse(tmp, as_attachment=True, filename=filename, content_type=content_type)
            except Exception as e:
                return Response({"detail": f"Помилка завантаження файлу: {str(e)}"},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            dbx = get_dbx()
            tmp = tempfile.NamedTemporaryFile(suffix=".zip", delete=False)
            zip_filename = tmp.name
            tmp.close()

            with zipfile.ZipFile(zip_filename, "w", compression=zipfile.ZIP_DEFLATED) as zf:
                for f in files_qs:
                    if f.dropbox_url:
                        dropbox_path = f.dropbox_url
                        filename = os.path.basename(dropbox_path)
                        try:
                            md, resp = dbx.files_download(dropbox_path)
                            zf.writestr(filename, resp.content)
                        except Exception as e:
                            logger.error(f"Error downloading file {filename}: {e}")

            return FileResponse(
                open(zip_filename, "rb"),
                as_attachment=True,
                filename=f"order_{order.id}_files.zip",
                content_type='application/zip'
            )
        except Exception as e:
            return Response({"detail": f"Error generating zip: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(
        summary="Аналіз зображень",
        tags=["Order Files"]
    )
    @action(
        detail=False,
        methods=["post"],
        url_path="analyze-uploaded-images",
        parser_classes=[MultiPartParser, FormParser],
    )
    def analyze_uploaded_images(self, request):
        uploaded_files = request.FILES.getlist("files")
        if not uploaded_files:
            return Response({"detail": "files is required"}, status=status.HTTP_400_BAD_REQUEST)

        source_slug = (request.data.get("source_language_slug") or "").strip().lower()

        if not source_slug:
            raw_source_language_id = request.data.get("source_language_id")
            try:
                source_language_id = int(str(raw_source_language_id).strip()) if raw_source_language_id else None
            except ValueError:
                return Response({"detail": "source_language_id must be int"}, status=status.HTTP_400_BAD_REQUEST)

            if source_language_id:
                lang_row = (
                    Language.objects
                    .filter(id=source_language_id)
                    .values("slug")
                    .first()
                )
                if lang_row and lang_row.get("slug"):
                    source_slug = str(lang_row["slug"]).lower()

        if not source_slug:
            source_slug = "en"

        source_slug = {"ua": "uk"}.get(source_slug, source_slug)

        try:
            reader = easyocr.Reader([source_slug], gpu=False)
        except Exception:
            source_slug = "en"
            reader = easyocr.Reader(["en"], gpu=False)

        results = []
        total_detected_symbols = 0
        total_images_found = 0

        for f in uploaded_files:
            filename = getattr(f, "name", "file")
            ext = os.path.splitext(filename)[1].lstrip(".").lower()

            if ext not in ["docx", "pdf"]:
                results.append({"filename": filename, "file_type": ext, "error": "Only docx/pdf supported"})
                continue

            try:
                f.seek(0)
                data = f.read()
            except Exception as e:
                results.append({"filename": filename, "file_type": ext, "error": f"Read failed: {e}"})
                continue

            images_found = 0
            ocr_texts = []

            try:
                if ext == "docx":
                    with zipfile.ZipFile(BytesIO(data)) as z:
                        media_files = [n for n in z.namelist() if n.startswith("word/media/")]
                        for name in media_files:
                            try:
                                img_bytes = z.read(name)
                                img = Image.open(BytesIO(img_bytes)).convert("RGB")
                                arr = np.array(img)
                                text = "\n".join(reader.readtext(arr, detail=0, paragraph=True))
                                if text.strip():
                                    ocr_texts.append(text)
                                images_found += 1
                            except Exception:
                                pass
                else:
                    doc = fitz.open(stream=data, filetype="pdf")
                    for page in doc:
                        for img_info in page.get_images(full=True):
                            xref = img_info[0]
                            try:
                                base = doc.extract_image(xref)
                                img_bytes = base.get("image")
                                if not img_bytes:
                                    continue
                                img = Image.open(BytesIO(img_bytes)).convert("RGB")
                                arr = np.array(img)
                                text = "\n".join(reader.readtext(arr, detail=0, paragraph=True))
                                if text.strip():
                                    ocr_texts.append(text)
                                images_found += 1
                            except Exception:
                                pass
            except Exception as e:
                results.append({"filename": filename, "file_type": ext, "error": f"Parse/OCR failed: {e}"})
                continue

            full_text = "\n".join(ocr_texts)
            full_text_clean = re.sub(r"[\ufeff\u200b\u200c\u200d]", "", full_text)
            full_text_clean = re.sub(r"[ \t]+", " ", full_text_clean).strip()

            detected_symbols = len(full_text_clean)

            total_detected_symbols += detected_symbols
            total_images_found += images_found

            results.append({
                "filename": filename,
                "file_type": ext,
                "ocr_language": source_slug,
                "images_found": images_found,
                "detected_symbols_from_images": detected_symbols,
                "preview_text": (full_text_clean[:200] + "...") if full_text_clean else "",
            })

        return Response(
            {
                "ocr_language": source_slug,
                "total_images_found": total_images_found,
                "total_detected_symbols_from_images": total_detected_symbols,
                "results": results,
            },
            status=status.HTTP_200_OK
        )

    @extend_schema(
        summary="Завантаження файлів",
        request=UploadFileSerializer,
        tags=["Order Files"]
    )
    @action(detail=True, methods=["post"], url_path="upload-files")
    def upload_files(self, request, pk=None):
        order = self.get_object()
        user = request.user

        is_authorized = (
            user == order.manager_accept_id or
            user == order.manager_delivery_id or
            user == order.translator_id or
            user == order.editor_id
        )

        if not is_authorized and not user.role.slug in ['admin', 'owner']:
            return Response({"detail": "Недостатньо прав."}, status=status.HTTP_403_FORBIDDEN)

        serializer = UploadFileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        files = serializer.validated_data["files"]
        base_path = f"/orders/order_{order.id}"

        uploaded = []
        for f in files:
            dropbox_path = upload_file_to_order_folder(
                order=order,
                file=f,
                base_path=base_path,
                subdir="final",
            )
            uploaded.append({"filename": f.name, "dropbox_path": dropbox_path})

        for i, f in enumerate(files):
            ext = os.path.splitext(f.name)[1].lstrip(".").lower()
            dropbox_url = uploaded[i]["dropbox_path"]

            File.objects.create(
                order=order,
                file_type=ext,
                dropbox_url=dropbox_url,
                detected_pages=0,
                detected_symbols=0,
            )

        return Response(
            {"message": "Files uploaded", "count": len(uploaded), "files": uploaded},
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(
        summary="Розрахунок маржинальності",
        description="Порівнює ціну замовлення з тарифами перекладачів. Якщо передати translator_traffic_id, рахує тільки для нього.",
        parameters=[
            OpenApiParameter("traffic_id", int, required=True, description="ID тарифу клієнта (замовлення)"),
            OpenApiParameter("translator_traffic_id", int, required=False, description="ID обраного тарифу перекладача")
        ],
        tags=["Order Pricing"]
    )
    @action(detail=False, methods=["get"], url_path="margins")
    def margins(self, request):
        traffic_id = request.query_params.get("traffic_id")
        translator_traffic_id = request.query_params.get("translator_traffic_id")

        if not traffic_id:
            return Response({"detail": "traffic_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            traffic_id_int = int(str(traffic_id).strip())
        except ValueError:
            return Response({"detail": "traffic_id must be int"}, status=status.HTTP_400_BAD_REQUEST)

        ot = OrderTraffic.objects.filter(id=traffic_id_int).values(
            "price_per_page", "currency_id_id", "language_pair_id", "category_id"
        ).first()

        if not ot or ot.get("price_per_page") is None:
            return Response({"detail": "OrderTraffic not found or invalid"}, status=status.HTTP_404_NOT_FOUND)

        order_price = Decimal(str(ot["price_per_page"]))
        currency_id = ot.get("currency_id_id")
        lp_id = ot.get("language_pair_id")
        category_id = ot.get("category_id")

        translator_traffics = TranslatorTraffic.objects.filter(language_pair_id=lp_id).prefetch_related('translators')

        # ЯКЩО ПЕРЕДАЛИ КОНКРЕТНИЙ ТАРИФ ПЕРЕКЛАДАЧА - ФІЛЬТРУЄМО ТІЛЬКИ ЙОГО
        if translator_traffic_id:
            try:
                tt_id = int(str(translator_traffic_id).strip())
                translator_traffics = translator_traffics.filter(id=tt_id)
            except ValueError:
                pass

        results = []

        for tt in translator_traffics:
            is_exact_match = (tt.category_id == category_id)
            is_fallback = (category_id is not None and tt.category_id is None)

            # Відсіюємо чужі категорії, тільки якщо ми шукаємо списком (немає конкретного translator_traffic_id)
            if not translator_traffic_id:
                if tt.category_id is not None and tt.category_id != category_id:
                    continue

            for tr in tt.translators.all():
                tr_rate = Decimal(str(tt.rate_per_page)) if tt.rate_per_page is not None else None
                margin_percent = None
                margin_absolute = None
                margin_label = None

                if tr_rate is not None:
                    margin_absolute = order_price - tr_rate
                    # Запобігаємо діленню на нуль
                    if order_price > 0:
                        margin_percent = (margin_absolute / order_price) * Decimal("100")
                    else:
                        margin_percent = Decimal("0")

                    margin_label = "Не вигідно" if margin_percent < 40 else "Вигідно"

                # Додаємо КОЖЕН тариф окремо (ніякого злиття чи заміни)
                results.append({
                    "translator_id": tr.id,
                    "translator_name": getattr(tr, "full_name", None),
                    "translator_traffic_id": tt.id,
                    "translator_currency_id": tt.currency_id_id,
                    "order_price_per_page": str(order_price),
                    "translator_rate_per_page": str(tr_rate) if tr_rate is not None else None,
                    "margin_absolute": str(
                        margin_absolute.quantize(Decimal("0.01"))) if margin_absolute is not None else None,
                    "margin_percent": str(
                        margin_percent.quantize(Decimal("0.01"))) if margin_percent is not None else None,
                    "margin_label": margin_label,
                    "language_pair_label": "Є мовна пара",
                    "category_label": "Є категорія" if is_exact_match else (
                        "Загальний тариф" if is_fallback else "Нема категорії"),
                    "is_exact_match": is_exact_match
                })

        def sort_key(x):
            mval = Decimal(x["margin_percent"]) if x["margin_percent"] is not None else Decimal("-Infinity")
            return (
                1 if x["is_exact_match"] else 0,  # Пріоритет 1: Точний збіг категорії
                mval,  # Пріоритет 2: Найкраща маржа
            )

        results.sort(key=sort_key, reverse=True)

        for r in results:
            r.pop("is_exact_match", None)

        return Response({
            "traffic_id": traffic_id_int,
            "language_pair_id": lp_id,
            "currency_id": currency_id,
            "category_id": category_id,
            "results": results,
        }, status=status.HTTP_200_OK)

        # def sort_key(x):
        #     mval = Decimal(x["margin_percent"]) if x["margin_percent"] is not None else Decimal("-Infinity")
        #     return (
        #         1 if x["category_label"] == "Є категорія" else 0,
        #         mval,
        #     )
        #
        # results.sort(key=sort_key, reverse=True)
        #
        # return Response({
        #     "traffic_id": traffic_id_int,
        #     "language_pair_id": lp_id,
        #     "currency_id": currency_id,
        #     "category_id": category_id,
        #     "results": results,
        # }, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Редактори по мовній парі",
        parameters=[
            OpenApiParameter("source_language_id", int, required=True),
            OpenApiParameter("target_language_id", int, required=True),
        ],
        tags=["Orders"]
    )
    @action(detail=False, methods=["get"], url_path="editors-by-language-pair")
    def editors_by_language_pair(self, request):
        source_language_id = request.query_params.get("source_language_id")
        target_language_id = request.query_params.get("target_language_id")

        if not source_language_id or not target_language_id:
            return Response(
                {"detail": "source_language_id and target_language_id are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            source_language_id = int(str(source_language_id).strip())
            target_language_id = int(str(target_language_id).strip())
        except ValueError:
            return Response(
                {"detail": "source_language_id and target_language_id must be int"},
                status=status.HTTP_400_BAD_REQUEST
            )

        lp_ids = list(
            LanguagePair.objects
            .filter(
                Q(source_language_id=source_language_id, target_language_id=target_language_id) |
                Q(source_language_id=target_language_id, target_language_id=source_language_id)
            )
            .values_list("id", flat=True)
        )

        if not lp_ids:
            return Response(
                {"detail": "LanguagePair not found for given languages"},
                status=status.HTTP_404_NOT_FOUND
            )

        elps = (EditorLanguagePairs.objects
                .filter(language_pair_id__in=lp_ids)
                .values("id", "editor_id"))

        by_editor = {}
        for row in elps:
            by_editor.setdefault(row["editor_id"], row["id"])

        editors = (User.objects
                   .filter(role__slug='editor')
                   .distinct()
                   .only("id", "full_name")
                   .order_by("id"))

        results = []
        for ed in editors:
            elp_id = by_editor.get(ed.id)
            has_lp = elp_id is not None

            results.append({
                "editor_id": ed.id,
                "editor_name": getattr(ed, "full_name", None),
                "editor_language_pair_id": elp_id,
                "language_pair_label": "Є" if has_lp else "Нема",
            })

        def sort_key(x):
            return (
                1 if x["language_pair_label"] == "Є" else 0,
                (x["editor_name"] or "").lower(),
                x["editor_id"],
            )

        results.sort(key=sort_key, reverse=True)

        return Response(
            {
                "languages": {
                    "source_language_id": source_language_id,
                    "target_language_id": target_language_id,
                },
                "count": len(results),
                "results": results,
            },
            status=status.HTTP_200_OK
        )

    @extend_schema(
        summary="Підтвердити та активувати замовлення",
        description=(
            "Змінює статус замовлення на 'Виконано' (ID 4), генерує унікальне посилання з паролем "
            "для клієнта, аналізує завантажені файли (сторінки/символи) та надсилає запрошення."
        ),
        operation_id="confirm_order_with_files",
        responses={200: OpenApiTypes.OBJECT},
        tags=["Order Workflow"]
    )
    @action(detail=True, methods=["get"], url_path="confirm-order")
    def confirm_order(self, request, pk=None):
        order = self.get_object()

        qs = (
            File.objects
            .filter(order=order)
            .exclude(dropbox_url__exact="None")
            .filter(dropbox_url__contains="/target/")
        )

        moved = []
        errors = []

        for f in qs:
            from_path = (f.dropbox_url or "").strip()
            if not from_path:
                continue

            try:
                new_path = move_file_from_target_to_final(from_path)
                f.dropbox_url = new_path
                f.save(update_fields=["dropbox_url"])
                moved.append({"file_id": f.id, "from": from_path, "to": new_path})
            except Exception as e:
                errors.append({"file_id": f.id, "from": from_path, "error": str(e)})

        done_status = Status.objects.filter(slug__iexact="done").first()

        if done_status and order.status_id != done_status:
            order.status_id = done_status
            order.client_status = done_status
            order.save(update_fields=["status_id", "client_status"])

        self._generate_client_link_and_notify(order)

        return Response(
            {
                "order_id": order.id,
                "moved_count": len(moved),
                "moved": moved,
                "errors_count": len(errors),
                "errors": errors,
            },
            status=status.HTTP_200_OK,
        )

    # --- Private Helpers ---

    def _get_language_pair(self, raw_lp_id):
        if not raw_lp_id:
            return None
        try:
            lp_id = int(str(raw_lp_id).strip())
            return LanguagePair.objects.get(pk=lp_id)
        except (ValueError, LanguagePair.DoesNotExist):
            logger.warning(f"Error: Language pair with ID '{raw_lp_id}' not found.")
            return None

    def perform_update(self, serializer):
        order = serializer.instance
        request = self.request

        has_internal_access = False
        if request.user.is_authenticated:
            if request.user.is_staff:
                has_internal_access = True
            elif hasattr(request.user, 'role') and request.user.role:
                has_internal_access = RolePermission.objects.filter(
                    role=request.user.role,
                    permission__slug__in=['order.update', 'order.change.status']
                ).exists()

        provided_password = request.COOKIES.get(f'order_auth_{order.id}') or request.data.get('password')
        link_obj = OrderLink.objects.filter(order=order).last()

        is_password_valid = False
        if provided_password and link_obj:
            is_password_valid = secrets.compare_digest(link_obj.password, provided_password)

        if not (has_internal_access or is_password_valid):
            raise PermissionDenied("У вас немає доступу (потрібна роль Менеджера/Редактора або вірний пароль).")

        old_states = {
            'manager': order.status_id_id if order.status_id else None,
            'editor': order.editor_status_id if order.editor_status else None,
            'client': order.client_status_id if order.client_status else None,
            'translator': order.translator_status_id if order.translator_status else None,
        }

        updated_instance = serializer.save()

        NOTIFY_TRIGGERS = {
            'done': ("Замовлення виконано", "перейшло в статус «Виконано»"),
            'checked': ("Замовлення перевірено", "перейшло в статус «Перевірено»"),
            'rejected': ("Замовлення відхилено", "відхилено"),
            'translated': ("Замовлення перекладено", "перекладено"),
            'in_checking': ("Замовлення на перевірці", "передано на перевірку"),
            'in progress': ("Замовлення в роботі", "взято в роботу"),
            'in_progress': ("Замовлення в роботі", "взято в роботу"),
        }

        current_user = self.request.user
        manager_obj = updated_instance.manager_accept_id

        changed_slug = None
        changed_status_obj = None

        new_m_slug = updated_instance.status_id.slug if updated_instance.status_id else ""
        new_e_slug = updated_instance.editor_status.slug if updated_instance.editor_status else ""
        new_c_slug = updated_instance.client_status.slug if updated_instance.client_status else ""
        new_t_slug = updated_instance.translator_status.slug if updated_instance.translator_status else ""

        if old_states['manager'] != (updated_instance.status_id.id if updated_instance.status_id else None):
            changed_slug = new_m_slug
            changed_status_obj = updated_instance.status_id
        elif old_states['editor'] != (updated_instance.editor_status.id if updated_instance.editor_status else None):
            changed_slug = new_e_slug
            changed_status_obj = updated_instance.editor_status
        elif old_states['client'] != (updated_instance.client_status.id if updated_instance.client_status else None):
            changed_slug = new_c_slug
            changed_status_obj = updated_instance.client_status
        elif old_states['translator'] != (updated_instance.translator_status.id if updated_instance.translator_status else None):
            changed_slug = new_t_slug
            changed_status_obj = updated_instance.translator_status

        if changed_slug in NOTIFY_TRIGGERS and manager_obj and current_user != manager_obj:
            notif_title, notif_verb = NOTIFY_TRIGGERS[changed_slug]
            status_name = changed_status_obj.name if changed_status_obj else changed_slug

            msg_text = f"Замовлення #{updated_instance.id} {notif_verb}"

            try:
                Notification.objects.create(
                    recipient=manager_obj,
                    order=updated_instance,
                    title=notif_title,
                    message=msg_text
                )
            except Exception as e:
                logger.error(f"Failed to create notification: {e}")

            try:
                subject = f"Замовлення #{updated_instance.id}: {notif_title} — LingvoTeam"
                message = (
                    f"Вітаємо, {manager_obj.full_name}!\n\n"
                    f"Користувач {current_user.full_name} змінив статус (#{updated_instance.id}).\n"
                    f"Новий статус: {status_name}\n\n"
                    f"З повагою, команда LingvoTeam."
                )
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[manager_obj.email],
                    fail_silently=True
                )
            except Exception as e:
                logger.error(f"Failed to send email to manager: {e}")

    @extend_schema(
        summary="Оновити статус клієнта (оплата)",
        description="Змінює поле client_status для фіксації оплат (payed, deposit) без зміни загального статусу замовлення.",
        tags=["Order Workflow"]
    )
    @action(detail=True, methods=['post', 'patch'], url_path='update-client-status')
    def update_client_status(self, request, pk=None):
        order = self.get_object()

        new_status_id = request.data.get('client_status_id')
        if not new_status_id:
            return Response(
                {"detail": "Необхідно передати client_status_id."},
                status=status.HTTP_400_BAD_REQUEST
            )

        new_status = get_object_or_404(Status, id=new_status_id)

        if order.client_status_id == new_status.id:
            return Response(
                {"detail": "Цей статус клієнта вже встановлено."},
                status=status.HTTP_200_OK
            )

        order.client_status = new_status
        order.save(update_fields=['client_status'])

        CLIENT_NOTIFY_TRIGGERS = {
            'payed': ("Замовлення оплачено", "оплачено повністю"),
            'deposit': ("Отримано завдаток", "оплачено частково (завдаток)"),
        }

        slug = new_status.slug.lower() if new_status.slug else ""
        current_user = request.user
        manager_obj = order.manager_accept_id

        if slug in CLIENT_NOTIFY_TRIGGERS and manager_obj and current_user != manager_obj:
            notif_title, notif_verb = CLIENT_NOTIFY_TRIGGERS[slug]
            msg_text = f"Клієнтський статус замовлення #{order.id} змінено: {notif_verb}"

            try:
                Notification.objects.create(
                    recipient=manager_obj,
                    order=order,
                    title=notif_title,
                    message=msg_text
                )
            except Exception as e:
                logger.error(f"Failed to create client status notification: {e}")

            try:
                subject = f"Замовлення #{order.id}: {notif_title} — LingvoTeam"
                message = (
                    f"Вітаємо, {manager_obj.full_name}!\n\n"
                    f"Оновлено фінансовий статус замовлення #{order.id}.\n"
                    f"Новий статус: {new_status.name}\n\n"
                    f"З повагою, команда LingvoTeam."
                )
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[manager_obj.email],
                    fail_silently=True
                )
            except Exception as e:
                logger.error(f"Failed to send email regarding client status: {e}")

        return Response({
            "message": "Статус клієнта успішно оновлено.",
            "client_status": {
                "id": new_status.id,
                "name": new_status.name,
                "slug": new_status.slug
            }
        }, status=status.HTTP_200_OK)

    def _send_translator_invite(self, order, full_link, password, expire_date, recipient):
        try:
            subject = f"Нове замовлення - LingvoTeam"
            message = (
                f"Вітаємо, {recipient.full_name}!\n\n"
                f"Посилання з роботою: {full_link}\n"
                f"Пароль доступу: {password}\n\n"
                f"Термін дії посилання: до {expire_date.strftime('%d.%m.%Y %H:%M')}\n\n"
                f"З повагою, команда LingvoTeam."
            )
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient.email],
                fail_silently=False,
            )
        except Exception as e:
            logger.error(f"Email error: {e}")

    def _send_client_invite(self, order, full_link, password, expire_date, recipient):
        try:
            subject = f"Нове замовлення - LingvoTeam"
            message = (
                f"Вітаємо, {recipient.full_name}!\n\n"
                f"Посилання з роботою: {full_link}\n"
                f"Пароль доступу: {password}\n\n"
                f"Термін дії посилання: до {expire_date.strftime('%d.%m.%Y %H:%M')}\n\n"
                f"З повагою, команда LingvoTeam."
            )
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient.email],
                fail_silently=False,
            )
        except Exception as e:
            logger.error(f"Email error: {e}")

    def _generate_client_link_and_notify(self, order):
        if OrderLink.objects.filter(order=order, assignee=OrderLink.Assignee.CLIENT).exists():
            return

        if not (order.client_id and order.client_id.email):
            return

        client_generated_link_slug = str(uuid.uuid4())
        client_generated_password = secrets.token_urlsafe(8)
        expire_date = timezone.now() + timedelta(days=45)

        OrderLink.objects.create(
            order=order,
            assignee=OrderLink.Assignee.CLIENT,
            link=client_generated_link_slug,
            password=client_generated_password,
            expire_at=expire_date
        )

        base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        full_client_link = f"{base_url}/clients/{client_generated_link_slug}"

        self._send_client_invite(order, full_client_link, client_generated_password, expire_date, order.client_id)

    @extend_schema(
        summary="Перемістити замовлення",
        description="Змінює позицію замовлення в канбан-дошці.",
        request=OpenApiTypes.OBJECT,
        examples=[OpenApiExample("Move Example", value={"prev_id": 1, "next_id": 2})],
        tags=["Orders"]
    )
    @action(detail=True, methods=['post'], url_path='move')
    @transaction.atomic
    def move_order(self, request, pk=None):
        source_column = request.data.get('source_column')
        board_type = request.data.get('board')

        if source_column in ['all_orders', 'All Orders'] or board_type in ['all_orders', 'All Orders']:
            return Response(
                {"detail": "Переміщення завдань у колонці 'Всі замовлення' суворо заборонено. Вона лише для відображення."},
                status=status.HTTP_400_BAD_REQUEST
            )

        order = self.get_object()

        prev_id = request.data.get('prev_id')
        next_id = request.data.get('next_id')

        pos_above = None
        pos_below = None

        if prev_id:
            prev_order = Order.objects.filter(id=prev_id).first()
            if prev_order:
                pos_above = float(prev_order.position)

        if pos_above is None:
            first_order = Order.objects.filter(
                status_id=order.status_id
            ).order_by('position').first()
            pos_above = (float(first_order.position) - 10000.0) if first_order else 0.0

        next_order_obj = None

        if next_id:
            next_order_obj = Order.objects.filter(id=next_id).first()
            if next_order_obj:
                pos_below = float(next_order_obj.position)

        if pos_below is None:
            last_order = Order.objects.filter(
                status_id=order.status_id
            ).order_by('-position').first()
            pos_below = (float(last_order.position) + 10000.0) if last_order else 10000.0

        if (pos_below - pos_above) < 0.001:
            if next_order_obj:
                new_next_pos = pos_above + 10000.0
                next_order_obj.position = new_next_pos
                next_order_obj.save(update_fields=['position'])
                pos_below = new_next_pos
            else:
                pos_below = pos_above + 10000.0

        new_position = (pos_above + pos_below) / 2.0

        order.position = new_position
        order.save(update_fields=['position'])

        return Response({
            "id": order.id,
            "position": new_position,
            "message": "Order moved successfully"
        }, status=status.HTTP_200_OK)
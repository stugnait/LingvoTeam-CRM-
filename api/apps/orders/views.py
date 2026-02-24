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
from rest_framework.filters import OrderingFilter, SearchFilter
from django.db.models import Q, Avg
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

# DRF imports
from rest_framework import viewsets, status
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
    create_order_folder, upload_file_to_order_folder, get_dbx
)
from ..translators.models import TranslatorTraffic
from django_filters import rest_framework as filters

logger = logging.getLogger(__name__)


class OrderTrafficFilter(filters.FilterSet):
    currency = filters.AllValuesFilter(field_name='currency_id')
    category = filters.AllValuesFilter(field_name='category')
    language_pair = filters.AllValuesFilter(field_name='language_pair')

    class Meta:
        model = OrderTraffic
        fields = ['currency', 'category', 'language_pair']

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
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [OrderingFilter]
    ordering_fields = ['position', 'created_at']
    ordering = ['position']

    def get_required_permissions(self, request):
        mapping = {
            'create': ['order.create'],
            'list': ['order.view'],
            'retrieve': ['order.view'],
            'update': ['order.update'],
            'assign_translator': ['order.assign'],
            'reject_translation': ['order.reject_translation'],
            'approve_translation': ['order.approve_translation'],
            'download_files': ['order.view'],
            'analyze_images': ['order.update'],
            'upload_files' : ['order.view'],
            'margins': ['order.view'],
        }

        if self.action in ['update', 'partial_update']:
            status_fields = {'status_id', 'status', 'client_status', 'translator_status'}

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
            return Order.objects.all()

        if user.role.slug == 'editor':
            return Order.objects.filter(editor_id=user)

        # Можна додати фільтрацію для менеджера/перекладача
        return Order.objects.all()

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
        if raw_amount and str(raw_amount).strip():
            try:
                final_total_amount = Decimal(str(raw_amount))
            except:
                pass

        status_in_progress = get_object_or_404(Status, slug="in_translation")

        order = serializer.save(
            manager_id=request.user,
            language_pair_id=language_pair_instance,

            status_id=status_in_progress,
            client_status=status_in_progress,
            translator_status=status_in_progress,

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

        uploaded_files = request.FILES.getlist('files')
        stats_data = self._analyze_and_upload_files(order, uploaded_files)

        order.symbols_count = stats_data["total_stats"]["chars_with_spaces"]
        order.page_count = stats_data["total_stats"]["physical_pages"]

        if order.traffic_id:
            order.total_amount = Decimal(order.page_count) * Decimal(order.traffic_id.price_per_page)

        order.save()

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
            "stats": stats_data["total_stats"],
            "translator_link": {
                "slug": generated_link_slug,
                "password": generated_password
            }
        }, status=status.HTTP_201_CREATED)

    # --- Actions ---
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
                path = upload_file_to_order_folder(order, f, base_path=base_path, subdir="source")
                _ = upload_file_to_order_folder(order, f, base_path=base_path, subdir="target",
                                                create_only_dir="target")
                _ = upload_file_to_order_folder(order, f, base_path=base_path, subdir="final", create_only_dir="final")
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
                detected_symbols=stats["chars_with_spaces"],
            )

        return {"total_stats": total_stats}

    @extend_schema(
        summary="Відхилити переклад",
        description="Метод для редактора. Змінює статус на 'Відхилено' та надсилає email менеджеру.",
        request=RejectTranslationSerializer,
        tags=["Order Workflow"]
    )

    @action(detail=True, methods=['post'], url_path='reject-translation')
    def reject_translation(self, request, pk=None):
        order = self.get_object()
        serializer = RejectTranslationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        comment = serializer.validated_data['review_comment']
        # Краще використовувати slug або константу, ніж ID 6
        rejected_status = Status.objects.filter(id=6).first()

        OrderEditorReview.objects.create(
            order=order,
            editor=request.user,
            review_comment=comment,
            review_status='rejected'
        )

        if rejected_status:
            order.status_id = rejected_status
            order.save()

        if order.manager_id:
            try:
                send_mail(
                    subject=f"УВАГА: Переклад замовлення #{order.id} відхилено!",
                    message=f"Редактор {request.user.full_name} відхилив переклад.\nКоментар: {comment}",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[order.manager.email],
                    fail_silently=True
                )
            except Exception as e:
                logger.error(f"Failed to send rejection email: {e}")

        return Response({"message": "Переклад відхилено, менеджер повідомлений."}, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Прийняти переклад",
        description="Оцінка якості перекладу та закриття замовлення. Доступно по паролю з посилання.",
        request=ApproveTranslationSerializer,
        tags=["Order Workflow"]
    )
    @action(detail=True, methods=['post'], url_path='approve-translation', permission_classes=[AllowAny])
    def approve_translation(self, request, pk=None):
        order = get_object_or_404(Order, pk=pk)

        is_editor = request.user.is_authenticated and (
                request.user.is_staff or
                getattr(request.user, 'role_id', None) == 2
        )

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

        acting_user = request.user if request.user.is_authenticated else None

        TranslationQuality.objects.update_or_create(
            order=order,
            defaults={
                'user': acting_user,
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

        order.status_id_id = 4
        order.save(update_fields=['status_id'])

        if order.translator_id:
            self.update_translator_rating(order.translator_id)

        return Response({"message": "Замовлення успішно прийнято та оцінено!"}, status=status.HTTP_200_OK)

    def update_translator_rating(self, translator):

        average_data = TranslationQuality.objects.filter(
            order__translator_id=translator.id
        ).aggregate(avg_score=Avg('score'))

        new_rating = average_data['avg_score'] or 0.0

        translator.rating = round(new_rating, 2)
        translator.save()

        return translator.rating

    @extend_schema(
        summary="Завантажити файли (ZIP)",
        description="Збирає файли з Dropbox (джерела або готові переклади) у ZIP-архів.",
        parameters=[
            OpenApiParameter("folder", str, OpenApiParameter.PATH, description="Папка: 'source' або 'target'")
        ],
        tags=["Order Files"]
    )

    @action(detail=True, methods=['get'], url_path=r'download-files(?:/(?P<folder>source|target|final))?')
    def download_files(self, request, pk=None, folder=None):
        order = self.get_object()
        user = request.user

        # Перевірка прав (використовуємо порівняння об'єктів або ID)
        is_authorized = (
                user == order.manager_id or
                user == order.translator_id or
                user == order.editor_id
        )

        if not is_authorized and not user.role.slug in ['admin', 'owner']:
            return Response({"detail": "Недостатньо прав."}, status=status.HTTP_403_FORBIDDEN)

        files = File.objects.filter(order=order)
        folder_label = "all"
        folder_param = (folder or "").strip().lower()

        if folder_param:
            folder_label = folder_param
            base = f"/orders/order_{order.id}/{folder_param}"
            files = files.filter(dropbox_url__startswith=base)

        if not files.exists():
            return Response({"detail": "Файли відсутні."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            dbx = get_dbx()
            tmp = tempfile.NamedTemporaryFile(suffix=".zip", delete=False)
            zip_filename = tmp.name
            tmp.close()

            with zipfile.ZipFile(zip_filename, "w", compression=zipfile.ZIP_DEFLATED) as zf:
                for f in files:
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
    @action(detail=True, methods=["post"], url_path="analyze-images")
    def analyze_images(self, request, pk=None):
        """
        Аналізує зображення всередині DOCX/PDF файлів замовлення за допомогою OCR (Tesseract).
        Оновлює статистику символів у File.
        """
        order = self.get_object()

        # 1. Визначаємо мову для Tesseract
        # Tesseract використовує 3-літерні коди (eng, ukr, deu), а не slug мови (en, uk).
        # Тут потрібен маппінг. Поки що спробуємо взяти slug, але краще мати окреме поле tesseract_code.

        source_slug = "en"
        language_pair_val = (
            getattr(order, "language_pair_id", None)
            or getattr(order, "language_pair_id_id", None)
            or getattr(order, "language_pair", None)
        )

        language_pair_id = getattr(language_pair_val, "id", language_pair_val)

        source_language_id = None

        if language_pair_id:
            lp_row = (
                LanguagePair.objects
                .filter(id=language_pair_id)
                .values("source_language_id")
                .first()
            )
            if lp_row:
                source_language_id = lp_row.get("source_language_id")

        source_slug = "src"
        lang_row = None
        if source_language_id:
            lang_row = (
                Language.objects
                .filter(id=source_language_id)
                .values("slug")
                .first()
            )
        if lang_row and lang_row.get("slug"):
            source_slug = lang_row["slug"]
        

        files = File.objects.filter(order=order).exclude(dropbox_url__exact='None')
        dbx = get_dbx()
        results = []
        reader = easyocr.Reader([source_slug], gpu=False)

        for f in files:
            if not f.dropbox_url:
                continue

            dropbox_path = f.dropbox_url
            ext = (f.file_type or os.path.splitext(dropbox_path)[1].lstrip(".")).lower()

            if ext not in ['docx', 'pdf']:
                continue

            try:
                _, resp = dbx.files_download(dropbox_path)
                data = resp.content
            except Exception as e:
                results.append({"file_id": f.id, "error": f"Dropbox download failed: {e}"})
                continue

            images_found = 0
            ocr_texts = []

            try:
                # --- OCR для DOCX ---
                if ext == "docx":
                    with zipfile.ZipFile(BytesIO(data)) as z:
                        media_files = [n for n in z.namelist() if n.startswith("word/media/")]
                        for name in media_files:
                            img_bytes = z.read(name)
                            try:
                                img = Image.open(BytesIO(img_bytes)).convert("RGB")
                                # Використовуємо визначену мову, а не хардкод 'ukr'
                                arr = np.array(img)
                                text = "\n".join(reader.readtext(arr, detail=0, paragraph=True))
                                if text.strip():
                                    ocr_texts.append(text)
                                    images_found += 1
                            except Exception:
                                pass

                # --- OCR для PDF ---
                elif ext == "pdf":
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
                results.append({"file_id": f.id, "error": f"Parse/OCR failed: {e}"})
                continue

            # Очищення та підрахунок
            full_text = "\n".join(ocr_texts)
            # Базова очистка
            full_text_clean = re.sub(r'[\ufeff\u200b\u200c\u200d]', '', full_text)
            full_text_clean = re.sub(r'[ \t]+', ' ', full_text_clean)
            full_text_clean = full_text_clean.strip()

            detected_symbols = len(full_text_clean)

            # Оновлюємо файл
            if detected_symbols > 0:
                f.detected_symbols = (f.detected_symbols or 0) + detected_symbols
                f.save(update_fields=["detected_symbols"])

            results.append({
                "file_id": f.id,
                "file_type": ext,
                "images_found": images_found,
                "detected_symbols_from_images": detected_symbols,
                "preview_text": full_text_clean[:100] + "...",
            })

        return Response({"order_id": order.id, "results": results}, status=status.HTTP_200_OK)

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
                user == order.manager_id or
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
        description="Порівнює ціну замовлення з тарифами всіх доступних перекладачів для обраної мовної пари.",
        parameters=[
            OpenApiParameter("traffic_id", int, required=True, description="ID тарифу замовлення")
        ],
        tags=["Order Pricing"]
    )
    @action(detail=False, methods=["get"], url_path="margins")
    def margins(self, request):
        """
        GET /api/orders/margins/?traffic_id=1

        Повертає маржу (%) для кожного перекладача по:
        - order_traffic.price_per_page (дохід за сторінку)
        - translator_traffic.rate_per_page (витрата на сторінку)
        """

        traffic_id = request.query_params.get("traffic_id")
        if not traffic_id:
            return Response({"detail": "traffic_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            traffic_id_int = int(str(traffic_id).strip())
        except ValueError:
            return Response({"detail": "traffic_id must be int"}, status=status.HTTP_400_BAD_REQUEST)

        ot = (OrderTraffic.objects
            .filter(id=traffic_id_int)
            .values("id", "price_per_page", "currency_id_id", "language_pair_id", "category_id")
            .first())

        if not ot:
            return Response({"detail": "OrderTraffic not found"}, status=status.HTTP_404_NOT_FOUND)

        price_per_page = ot.get("price_per_page")
        if price_per_page is None:
            return Response({"detail": "OrderTraffic.price_per_page is null"}, status=status.HTTP_400_BAD_REQUEST)

        order_price = Decimal(str(price_per_page))
        if order_price <= 0:
            return Response({"detail": "OrderTraffic.price_per_page must be > 0"}, status=status.HTTP_400_BAD_REQUEST)

        currency_id = ot.get("currency_id_id")
        lp_id = ot.get("language_pair_id")
        category_id = ot.get("category_id")

        qs = (TranslatorTraffic.objects
            .filter(language_pair_id=lp_id))

        if category_id is not None:
            qs = qs.filter(Q(category_id=category_id) | Q(category_id__isnull=True))


        qs = qs.select_related("translator")

        results = []
        for tt in qs:
            if tt.rate_per_page is None:
                continue

            tr_rate = Decimal(str(tt.rate_per_page))
            margin_percent = (order_price - tr_rate) / order_price * Decimal("100")
            margin_label = "Не вигідно" if margin_percent < 40 else "Вигідно"

            tr = getattr(tt, "translator", None)
            results.append({
                "translator_id": tr.id if tr else tt.translator_id,
                "translator_name": getattr(tr, "full_name", None),
                "translator_traffic_id": tt.id,
                "order_price_per_page": str(order_price),
                "translator_rate_per_page": str(tr_rate),
                "margin_percent": str(margin_percent.quantize(Decimal("0.01"))),
                "margin_label": margin_label,
            })

        # краща маржа зверху
        results.sort(key=lambda x: Decimal(x["margin_percent"]), reverse=True)

        return Response({
            "traffic_id": traffic_id_int,
            "language_pair_id": lp_id,
            "currency_id": currency_id,
            "category_id": category_id,
            "results": results,
        }, status=status.HTTP_200_OK)

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
        order.status_id_id = 4

        generated_link_slug = str(uuid.uuid4())
        generated_password = secrets.token_urlsafe(8)
        expire_date = timezone.now() + timedelta(days=45)

        OrderLink.objects.create(
            order=order,
            assignee=OrderLink.Assignee.CLIENT,
            link=generated_link_slug,
            password=generated_password,
            expire_at=expire_date
        )

        uploaded_files = request.FILES.getlist('files')
        stats_data = self._analyze_and_upload_files(order, uploaded_files)

        order.symbols_count = stats_data["total_stats"]["chars_with_spaces"]
        order.page_count = stats_data["total_stats"]["physical_pages"]
        order.save()

        base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        full_link = f"{base_url}/clients/{generated_link_slug}"

        self._send_translator_invite(order, full_link, generated_password, expire_date, order.client_id)

        order.save()
        return Response({"message": "Статус змінено на Виконано", "slug": generated_link_slug}, status=status.HTTP_200_OK)

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
        instance = serializer.instance

        old_status_int = instance.status_id_id
        old_translator_status_int = instance.translator_status_id

        updated_instance = serializer.save()

        new_status_obj = updated_instance.status_id
        new_status_int = updated_instance.status_id_id

        new_trans_obj = updated_instance.translator_status
        new_trans_int = updated_instance.translator_status_id

        print(instance.status_id_id)
        DONE_SLUGS = ['Done']

        main_slug = new_status_obj.slug if new_status_obj else ""
        trans_slug = new_trans_obj.slug if new_trans_obj else ""

        main_became_done = (old_status_int != new_status_int) and (main_slug in DONE_SLUGS)

        trans_became_done = (old_translator_status_int != new_trans_int) and (trans_slug in DONE_SLUGS)


        if main_became_done or trans_became_done:

            manager_obj = updated_instance.manager_id
            current_user_id = self.request.user.id
            manager_id = manager_obj.id if manager_obj else None

            if manager_obj:

                if trans_became_done:
                    msg_text = f"Статус перекладача змінено на {new_trans_obj.name}"
                else:
                    msg_text = f"Статус замовлення змінено на {new_status_obj.name}"

                try:
                    Notification.objects.create(
                        recipient=manager_obj,
                        order=updated_instance,
                        title="Зміна статусу",
                        message=msg_text
                    )


                except Exception as e:
                    print(f"DEBUG: ERROR creating notification: {e}")
            else:
                print("DEBUG: Notification SKIPPED (No manager or Self-update)")


#TODO full_link to change order.translator_id
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
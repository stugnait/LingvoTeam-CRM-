import logging
import os
import secrets
import os
import tempfile
import zipfile
import zoneinfo
import mimetypes
from datetime import timedelta

from django.db import transaction
from django.http import FileResponse
from django.utils import timezone
from django.shortcuts import get_object_or_404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view

from rest_framework import filters, status as http_status, viewsets
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.parsers import FormParser, MultiPartParser
from drf_spectacular.utils import extend_schema_view, extend_schema, OpenApiParameter
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

from apps.dropbox_services.dropbox_utils import get_dbx

from ..dropbox_services.dropbox_utils import get_dbx
from ..orders.models import File, Order, OrderLink, Status, status
from ..orders.serializers import OrderCreateSerializer
from ..users.permissions import HasPermission

from .models import Translator, TranslatorTraffic
from .models.translator_language_pairs import TranslatorLanguagePairs
from .serializers import (
    TranslatorLanguagePairsSerializer,
    TranslatorSerializer,
    TranslatorTrafficSerializer,
    TranslatorUploadFileSerializer,
)

logger = logging.getLogger(__name__)


from ..dropbox_services.dropbox_utils import upload_file_to_order_folder

@extend_schema_view(
    list=extend_schema(
        summary="Мовні пари перекладачів",
        parameters=[
            OpenApiParameter("translator_id", OpenApiTypes.INT, OpenApiParameter.QUERY, description="Фільтр за ID перекладача")
        ],
        tags=["Translators"]
    )
)
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

@extend_schema_view(
    list=extend_schema(
        summary="Список перекладачів",
        description="Повертає список перекладачів з кількістю їхніх замовлень (orders_count). Підтримує складну фільтрацію за мовами та категоріями.",
        tags=["Translators"]
    ),
    create=extend_schema(summary="Додати перекладача", tags=["Translators"]),
    retrieve=extend_schema(summary="Профіль перекладача", tags=["Translators"]),
)
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

@extend_schema_view(
    list=extend_schema(summary="Тарифи перекладачів", tags=["Translators Pricing"]),
    create=extend_schema(summary="Встановити тариф", tags=["Translators Pricing"]),
)
class TranslatorTrafficViewSet(viewsets.ModelViewSet):
    queryset = TranslatorTraffic.objects.select_related(
        'language_pair',
        'currency_id',
        'translator',
        'category'
    ).all()

    serializer_class = TranslatorTrafficSerializer

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    filterset_fields = ['translator', 'language_pair', 'category', 'name']

    search_fields = ['name']

    ordering_fields = ['id', 'name']
    ordering = ['id']
    permission_classes = [HasPermission]
    required_permissions = ['translator.traffic.manage']


class ExternalOrderAccessView(APIView):
    permission_classes = [AllowAny]

    def _set_assignee_active(self, link_obj):
        order = link_obj.order

        if link_obj.assignee == 'translator' and order.translator_id:
            translator = order.translator_id
            if hasattr(translator, 'is_active') and not translator.is_active:
                translator.is_active = True
                translator.save(update_fields=['is_active'])

        elif link_obj.assignee == 'client' and order.client_id:
            client = order.client_id
            if hasattr(client, 'is_active') and not client.is_active:
                client.is_active = True
                client.save(update_fields=['is_active'])

    @extend_schema(
        summary="Перевірка валідності посилання та наявності кукі",
        description="Якщо кука вже є і валідна — оновлює її, робить користувача онлайн і пускає. Якщо ні — просить пароль.",
        responses={200: OpenApiTypes.OBJECT, 410: OpenApiTypes.OBJECT},
        tags=["External Access"]
    )
    def get(self, request, slug):
        link_obj = get_object_or_404(OrderLink, link=slug)
        now = timezone.now()

        if link_obj.expire_at < now:
            return Response(
                {"error": "Термін дії посилання закінчився"},
                status=http_status.HTTP_410_GONE
            )

        order = link_obj.order
        provided_password = request.COOKIES.get(f'order_auth_{order.id}')

        if provided_password and secrets.compare_digest(link_obj.password, provided_password):
            self._set_assignee_active(link_obj)

            response = Response({
                "access": "granted",
                "status": "granted",
                "order_data": {
                    "id": order.id,
                    "language_pair": str(order.language_pair_id),
                    "deadline": str(order.deadline),
                    "target_language": order.language_pair_id.target_language.name if order.language_pair_id and order.language_pair_id.target_language else "-",
                    "source_language": order.language_pair_id.source_language.name if order.language_pair_id and order.language_pair_id.source_language else "-",
                    "comment": getattr(order, 'client_comment', "Коментар відсутній")
                }
            }, status=http_status.HTTP_200_OK)

            max_age = int((link_obj.expire_at - now).total_seconds())
            response.set_cookie(
                key=f'order_auth_{order.id}',
                value=provided_password,
                max_age=max_age,
                httponly=True,
                samesite='Lax',
                secure=False
            )
            return response

        return Response({
            "message": "URL валідний. Очікується пароль.",
            "status": "awaiting_password"
        }, status=http_status.HTTP_200_OK)

    @extend_schema(
        summary="Авторизація за паролем",
        description="Перевірка пароля. При успіху — видає куку і робить користувача онлайн.",
        tags=["External Access"]
    )
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
                }, status=http_status.HTTP_403_FORBIDDEN)

            input_password = request.data.get('password', '')

            if secrets.compare_digest(link_obj.password, input_password):
                link_obj.attempts = 0
                link_obj.banned_to = None
                link_obj.save()

                self._set_assignee_active(link_obj)

                order = link_obj.order

                response = Response({
                    "access": "granted",
                    "order_data": {
                        "id": order.id,
                        "language_pair": str(order.language_pair_id),
                        "deadline": str(order.deadline),
                        "target_language": order.language_pair_id.target_language.name if order.language_pair_id and order.language_pair_id.target_language else "-",
                        "source_language": order.language_pair_id.source_language.name if order.language_pair_id and order.language_pair_id.source_language else "-",
                        "comment": getattr(order, 'client_comment', "Коментар відсутній")
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
                kyiv_tz = zoneinfo.ZoneInfo("Europe/Kyiv")
                banned_to_kyiv = link_obj.banned_to.astimezone(kyiv_tz)

                response = Response({
                    "message": f"Перевищено ліміт спроб. Спробуйте через {ban_minutes} хв.",
                    "remaining_attempts": 0,
                    "ban_minutes": ban_minutes,
                    "banned_to": banned_to_kyiv.isoformat(),
                }, status=http_status.HTTP_403_FORBIDDEN)

            else:
                remaining_attempts = max_attempts - link_obj.attempts
                response = Response({
                    "message": "Невірний пароль.",
                    "remaining_attempts": remaining_attempts,
                }, status=http_status.HTTP_403_FORBIDDEN)

            link_obj.save()
            return response

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

        # done_status = Status.objects.get(slug="Done")

        # if order.status_id != done_status:
        #     order.status_id = done_status
        #     order.save(update_fields=["status_id"])

        return Response(
            {
                "message": "Files uploaded",
                "count": len(uploaded),
                "files": uploaded
            },
            status=http_status.HTTP_201_CREATED,
        )
        

class ExternalTranslatorDownloadView(APIView):
    """
    External access (SOURCE + TARGET):

    Routes:
      - /external/orders/<order_id>/download-files/<folder>/?list=1
            -> list files in folder (id + name)

      - /external/orders/<order_id>/download-files/<folder>/
            -> download all files in folder as ZIP

      - /external/orders/<order_id>/download-files/<folder>/<file_id>/
            -> download single file by id (must be inside that folder)
    """
    authentication_classes = []
    permission_classes = []

    ALLOWED_FOLDERS = {"source", "target"}

    def _check_access(self, request, order: Order):
        provided_password = request.COOKIES.get(f"order_auth_{order.id}")
        if not provided_password:
            return None, Response({"detail": "Немає доступу."}, status=http_status.HTTP_403_FORBIDDEN)

        now = timezone.now()


        link_qs = OrderLink.objects.filter(order=order, assignee=OrderLink.Assignee.TRANSLATOR)
        link_obj = None
        for candidate in link_qs.order_by("-id"):
            expire_at = getattr(candidate, "expire_at", None) or getattr(candidate, "expire_date", None)
            if expire_at and expire_at < now:
                continue
            if candidate.password and secrets.compare_digest(candidate.password, provided_password):
                link_obj = candidate
                break

        if not link_obj:
            return None, Response({"detail": "Невірний пароль."}, status=http_status.HTTP_403_FORBIDDEN)

        return link_obj, None

    def get(self, request, order_id: int, folder: str, file_id: int = None):
        order = get_object_or_404(Order, id=order_id)

        _link, denied = self._check_access(request, order)
        if denied:
            return denied

        folder = (folder or "").strip().lower()
        if folder not in self.ALLOWED_FOLDERS:
            return Response({"detail": "Недоступна папка."}, status=http_status.HTTP_403_FORBIDDEN)

        folder_prefix = f"/orders/order_{order.id}/{folder}/"
        files_qs = File.objects.filter(order=order, dropbox_url__startswith=folder_prefix)

        if not files_qs.exists():
            return Response({"detail": f"Файли {folder} відсутні."}, status=http_status.HTTP_404_NOT_FOUND)

        if request.query_params.get("list") == "1":
            items = []
            for f in files_qs.order_by("id"):
                dropbox_url = f.dropbox_url or ""
                name = os.path.basename(dropbox_url) or f"file_{f.id}"
                items.append({"id": f.id, "name": name})
            return Response(
                {"order_id": order.id, "folder": folder, "count": len(items), "files": items},
                status=http_status.HTTP_200_OK,
            )

        if file_id is not None:
            file_obj = get_object_or_404(
                File,
                id=file_id,
                order=order,
                dropbox_url__startswith=folder_prefix,
            )

            if not file_obj.dropbox_url:
                return Response({"detail": "Файл недоступний."}, status=http_status.HTTP_404_NOT_FOUND)

            try:
                dbx = get_dbx()
                _md, resp = dbx.files_download(file_obj.dropbox_url)

                filename = os.path.basename(file_obj.dropbox_url) or f"file_{file_obj.id}"
                content_type = getattr(resp, "headers", {}).get("Content-Type")
                if not content_type:
                    content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"

                tmp = tempfile.SpooledTemporaryFile(max_size=50 * 1024 * 1024, mode="w+b")
                tmp.write(resp.content)
                tmp.seek(0)

                return FileResponse(tmp, as_attachment=True, filename=filename, content_type=content_type)

            except Exception as e:
                logger.exception("Помилка завантаження файлу з Dropbox")
                return Response(
                    {"detail": f"Помилка завантаження файлу: {str(e)}"},
                    status=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        try:
            dbx = get_dbx()
            zip_tmp = tempfile.SpooledTemporaryFile(max_size=200 * 1024 * 1024, mode="w+b")

            with zipfile.ZipFile(zip_tmp, "w", zipfile.ZIP_DEFLATED) as zf:
                for f in files_qs.order_by("id"):
                    if not f.dropbox_url:
                        continue

                    filename = os.path.basename(f.dropbox_url) or f"file_{f.id}"
                    try:
                        _md, resp = dbx.files_download(f.dropbox_url)
                        zf.writestr(filename, resp.content)
                    except Exception as e:
                        logger.error(f"Dropbox error {filename}: {e}")

            zip_tmp.seek(0)
            return FileResponse(
                zip_tmp,
                as_attachment=True,
                filename=f"order_{order.id}_{folder}_files.zip",
                content_type="application/zip",
            )

        except Exception as e:
            logger.exception("Помилка створення ZIP")
            return Response(
                {"detail": f"Помилка створення ZIP: {str(e)}"},
                status=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets

import logging
import secrets
import os
import tempfile
import zipfile
import mimetypes
from datetime import timedelta

from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction

from rest_framework import status as http_status, viewsets
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from LingvoTeam import settings
from ..orders.models import Order, OrderLink, File
from ..dropbox_services.dropbox_utils import get_dbx
from ..users.permissions import HasPermission
from .models.client import Client
from .models.client_category import ClientCategory
from .serializers import ClientCategorySerializer, ClientSerializer

logger = logging.getLogger(__name__)

@extend_schema_view(
    list=extend_schema(summary="Список категорій клієнтів", description="Отримати перелік усіх категорій з їхніми знижками."),
    create=extend_schema(summary="Створити категорію", description="Додати нову категорію клієнтів (напр. VIP, Standard)."),
    retrieve=extend_schema(summary="Деталі категорії", description="Отримати інформацію про конкретну категорію за ID."),
    update=extend_schema(summary="Оновити категорію", description="Повне оновлення даних категорії."),
    partial_update=extend_schema(summary="Змінити категорію", description="Часткове оновлення полів категорії."),
    destroy=extend_schema(summary="Видалити категорію", description="Видалення категорії клієнтів з бази даних.")
)


class ClientCategoryViewSet(viewsets.ModelViewSet):
    queryset = ClientCategory.objects.all()
    serializer_class = ClientCategorySerializer
    permission_classes = [HasPermission]

    def get_required_permissions(self, request):
        mapping = {
            'create': ['client.create'],
            'list': ['client.view'],
            'retrieve': ['client.view'],
            'update': ['client.create'],  # Зазвичай право на створення включає редагування
            'partial_update': ['client.create'],
        }
        return mapping.get(self.action, [])


@extend_schema_view(
    list=extend_schema(summary="Список клієнтів", description="Отримати список усіх клієнтів з інформацією про їхні категорії."),
    retrieve=extend_schema(summary="Дані клієнта", description="Детальна інформація про конкретного клієнта."),
    create=extend_schema(summary="Додати клієнта", description="Реєстрація нового клієнта в системі."),
    update=extend_schema(summary="Редагувати клієнта", description="Повне оновлення профілю клієнта."),
    destroy=extend_schema(summary="Видалити клієнта", description="Видалення клієнта з системи.")
)

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.select_related('category').all()
    serializer_class = ClientSerializer
    permission_classes = [HasPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    search_fields = ['full_name', 'email']

    ordering_fields = ['full_name', 'created_at']

    def get_required_permissions(self, request):
        if self.action in ['list', 'retrieve']:
            return ['client.view']
        return ['client.category.manage']

class ClientOrderAccessView(APIView):
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
                    secure=False,
                    domain=settings.COOKIE_DOMAIN
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

class ClientDownloadView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, order_id, file_id: int = None, folder=None):
        order = get_object_or_404(Order, id=order_id)

        provided_password = request.COOKIES.get(f"order_auth_{order.id}")
        if not provided_password:
            return Response({"detail": "Немає доступу."}, status=http_status.HTTP_403_FORBIDDEN)

        now = timezone.now()

        link_obj = None
        for candidate in (
            OrderLink.objects.filter(order=order, assignee=OrderLink.Assignee.CLIENT).order_by("-id")
        ):
            expire_at = getattr(candidate, "expire_at", None) or getattr(candidate, "expire_date", None)
            if expire_at and expire_at < now:
                continue
            if candidate.password and secrets.compare_digest(candidate.password, provided_password):
                link_obj = candidate
                break

        if not link_obj:
            return Response({"detail": "Невірний пароль."}, status=http_status.HTTP_403_FORBIDDEN)

        folder = (request.query_params.get("folder") or folder or "final").strip().lower()
        if folder != "final":
            return Response({"detail": "Недоступна папка."}, status=http_status.HTTP_403_FORBIDDEN)

        folder_prefix = f"/orders/order_{order.id}/{folder}/"
        files_qs = File.objects.filter(order=order, dropbox_url__startswith=folder_prefix)

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

        if not files_qs.exists():
            return Response({"detail": "Файлів ще немає."}, status=http_status.HTTP_404_NOT_FOUND)

        try:
            dbx = get_dbx()
            zip_tmp = tempfile.SpooledTemporaryFile(max_size=200 * 1024 * 1024, mode="w+b")

            with zipfile.ZipFile(zip_tmp, "w", zipfile.ZIP_DEFLATED) as zf:
                for f in files_qs.order_by("id"):
                    if not f.dropbox_url:
                        continue

                    filename = os.path.basename(f.dropbox_url)

                    try:
                        md, resp = dbx.files_download(f.dropbox_url)
                        zf.writestr(filename, resp.content)
                    except Exception as e:
                        logger.error(f"Dropbox error {filename}: {e}")

            zip_tmp.seek(0)
            return FileResponse(
                zip_tmp,
                as_attachment=True,
                filename=f"order_{order.id}_{folder}_files.zip",
                content_type="application/zip"
            )

        except Exception as e:
            return Response(
                {"detail": f"Помилка створення ZIP: {str(e)}"},
                status=http_status.HTTP_500_INTERNAL_SERVER_ERROR
            )

import logging
import secrets
import os
import tempfile
import zipfile

from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status as http_status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..orders.models import Order, OrderLink, File
from ..dropbox_services.dropbox_utils import get_dbx
from ..users.permissions import HasPermission
from .models.client import Client
from .models.client_category import ClientCategory
from .serializers import ClientCategorySerializer, ClientSerializer

logger = logging.getLogger(__name__)

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



class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.select_related('category').all()
    serializer_class = ClientSerializer
    permission_classes = [HasPermission]

    def get_required_permissions(self, request):
        if self.action in ['list', 'retrieve']:
            return ['client.view']
        return ['client.category.manage']
    
class ClientDownloadView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, order_id, folder=None):
        order = get_object_or_404(Order, id=order_id)

        provided_password = request.COOKIES.get(f"order_auth_{order.id}")
        link_obj = OrderLink.objects.filter(order=order).last()

        if not (provided_password and link_obj):
            return Response({"detail": "Немає доступу."}, status=http_status.HTTP_403_FORBIDDEN)

        expire_at = getattr(link_obj, "expire_at", None) or getattr(link_obj, "expire_date", None)
        if expire_at and expire_at < timezone.now():
            return Response({"detail": "Посилання протерміноване."}, status=http_status.HTTP_403_FORBIDDEN)

        if not secrets.compare_digest(link_obj.password, provided_password):
            return Response({"detail": "Невірний пароль."}, status=http_status.HTTP_403_FORBIDDEN)

        files = File.objects.filter(order=order)

        if folder:
            folder = folder.lower()
            if folder != "final":
                return Response({"detail": "Недоступна папка."}, status=http_status.HTTP_403_FORBIDDEN)

            base = f"/orders/order_{order.id}/{folder}"
            files = files.filter(dropbox_url__startswith=base)

        if not files.exists():
            return Response({"detail": "Файли відсутні."}, status=http_status.HTTP_404_NOT_FOUND)

        try:
            dbx = get_dbx()
            tmp = tempfile.NamedTemporaryFile(suffix=".zip", delete=False)
            zip_path = tmp.name
            tmp.close()

            with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
                for f in files:
                    if not f.dropbox_url:
                        continue

                    filename = os.path.basename(f.dropbox_url)

                    try:
                        md, resp = dbx.files_download(f.dropbox_url)
                        zf.writestr(filename, resp.content)
                    except Exception as e:
                        logger.error(f"Dropbox error {filename}: {e}")

            return FileResponse(
                open(zip_path, "rb"),
                as_attachment=True,
                filename=f"order_{order.id}_files.zip",
                content_type="application/zip"
            )

        except Exception as e:
            return Response(
                {"detail": f"Помилка створення ZIP: {str(e)}"},
                status=http_status.HTTP_500_INTERNAL_SERVER_ERROR
            )
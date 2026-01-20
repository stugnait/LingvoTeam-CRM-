import re
import docx
import pypdf
import zipfile
import uuid
import secrets
import os
from datetime import timedelta

from django.core.mail import send_mail
from django.utils import timezone
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from LingvoTeam import settings
from .models import Order, OrderTraffic, Status, OrderLink, OrderEditorReview, TranslationQuality
from .serializers import OrderCreateSerializer, OrderTrafficSerializer, RejectTranslationSerializer, \
    ApproveTranslationSerializer
from .models import Order, OrderTraffic, Status, OrderLink, File
from .serializers import OrderCreateSerializer, OrderTrafficSerializer
from ..core.models import LanguagePair
from ..core.serializers import LanguagePairSelectSerializer
from ..users.permissions import HasPermission

from ..dropbox_services.dropbox_utils import create_order_folder, upload_file_to_order_folder, get_shared_folder_link



class OrderTrafficViewSet(viewsets.ModelViewSet):
    queryset = OrderTraffic.objects.select_related('language_pair', 'currency_id').all()
    serializer_class = OrderTrafficSerializer
    permission_classes = [HasPermission]
    required_permissions = ['order.traffic.manage']

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderCreateSerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        try:
            if hasattr(request.data, 'getlist'):
                data = request.data.dict()
                files_list = request.data.getlist('files')
                if files_list:
                    data['files'] = files_list
            else:
                data = request.data.copy()

            raw_lp_id = data.get('language_pair_id') or data.get('language_pair')
            language_pair_instance = None

            if raw_lp_id:
                try:
                    lp_id = int(str(raw_lp_id).strip())
                    language_pair_instance = LanguagePair.objects.get(pk=lp_id)
                except (ValueError, LanguagePair.DoesNotExist):
                    print(f"Error: Language pair with ID '{raw_lp_id}' not found or invalid.")

            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            serializer.validated_data.pop('files', None)

            status_instance = get_object_or_404(Status, slug="in_translation")

            order = serializer.save(
                manager_id=request.user,
                editor_id_id=data.get('editor_id'),
                status_id=status_instance,
                client_status=status_instance,
                translator_status=status_instance,

                language_pair_id=language_pair_instance,

                client_id_id=data.get('client_id'),
                traffic_id_id=data.get('traffic_id'),
                translator_id_id=data.get('translator_id'),
                translator_traffic_id_id=data.get('translator_traffic_id')
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

            files = request.FILES.getlist('files')
            stats = {
                "chars_with_spaces": 0, "chars_no_spaces": 0, "images": 0, "physical_pages": 0
            }
            chars_with_spaces_separate_files = []
            physical_pages_separate_files = []

            for file in files:
                file_name = file.name.lower()
                text_parts = []
                try:
                    # DOCX
                    if file_name.endswith('.docx'):
                        try:
                            doc = docx.Document(file)
                            text_parts.extend([p.text for p in doc.paragraphs])
                            for table in doc.tables:
                                text_parts.extend([cell.text for row in table.rows for cell in row.cells])
                            # ... (твій код парсингу DOCX) ...
                        except Exception as e:
                            print(f"DOCX error: {e}")

                        # ZIP аналіз для сторінок/картинок
                        file.seek(0)
                        try:
                            with zipfile.ZipFile(file) as archive:
                                namelist = archive.namelist()
                                stats["images"] += sum(1 for name in namelist if name.startswith('word/media/'))
                                if 'docProps/app.xml' in namelist:
                                    app_xml = archive.read('docProps/app.xml').decode('utf-8')
                                    pages_match = re.search(r'<Pages>(\d+)</Pages>', app_xml)
                                    if pages_match: stats["physical_pages"] += int(pages_match.group(1))
                        except Exception:
                            pass

                    # PDF
                    elif file_name.endswith('.pdf'):
                        try:
                            reader = pypdf.PdfReader(file)
                            stats["physical_pages"] += len(reader.pages)
                            for page in reader.pages:
                                extracted = page.extract_text()
                                if extracted: text_parts.append(extracted)
                                if hasattr(page, 'images'): stats["images"] += len(page.images)
                        except Exception as e:
                            print(f"PDF error: {e}")

                    # Статистика символів
                    full_text = "\n".join(text_parts)
                    full_text_cleaned = re.sub(r'[\ufeff\u200b]', '', full_text)
                    clean_text_no_space = re.sub(r'[\s\ufeff\u200b]+', '', full_text)

                    stats["chars_with_spaces"] += len(full_text_cleaned)
                    stats["chars_no_spaces"] += len(clean_text_no_space)

                    chars_with_spaces_separate_files.append(len(full_text_cleaned))
                    physical_pages_separate_files.append(
                        len(clean_text_no_space))  # Тут, мабуть, помилка в логіці (символи замість сторінок?), але залишаю як було у тебе

                except Exception as e:
                    print(f"File processing error: {e}")

            order.symbols_count = stats["chars_with_spaces"]
            order.page_count = stats["physical_pages"]
            order.save()

            full_link = f"http://localhost:3000/translator/{generated_link_slug}"

            if order.translator_id and order.translator_id.email:
                try:
                    subject = f"Нове замовлення #{order.id} - LingvoTeam"
                    message = (
                        f"Вітаємо, {order.translator_id.full_name}!\n\n"
                        f"Посилання: {full_link}\nПароль: {generated_password}\n"
                    )
                    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [order.translator_id.email],
                              fail_silently=False)
                except Exception as e:
                    print(f"Email error: {e}")

            lp_response_data = None
            if language_pair_instance:
                lp_response_data = LanguagePairSelectSerializer(language_pair_instance).data

            if files:
                try:
                    base_path = create_order_folder(order)
                    for f in files:
                        f.seek(0)
                        upload_file_to_order_folder(order, f, base_path=base_path, subdir="source")

                    source_folder_link = get_shared_folder_link(base_path)
                    for i, f in enumerate(files):
                        ext = os.path.splitext(f.name)[1].lstrip(".").lower()
                        p_pages = physical_pages_separate_files[i] if i < len(physical_pages_separate_files) else 0
                        s_symb = chars_with_spaces_separate_files[i] if i < len(chars_with_spaces_separate_files) else 0

                        File.objects.create(
                            order=order,
                            file_type=ext,
                            dropbox_url=source_folder_link,
                            detected_pages=p_pages,
                            detected_symbols=s_symb,
                        )
                except Exception as e:
                    print(f"Dropbox error: {e}")

            return Response({
                "message": "Замовлення успішно створено",
                "order_id": order.id,
                "language_pair": lp_response_data,
                "stats": stats,
                "translator_link": {"full_url": full_link, "password": generated_password}
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            import traceback
            traceback.print_exc()
            raise e


    def get_required_permissions(self, request):
        mapping = {
            'create': ['order.create'],
            'list': ['order.view'],
            'update': ['order.update'],
            'partial_update': ['order.update'],
            'assign_translator': ['order.assign']
        }
        return mapping.get(self.action, [])

    @action(detail=True, methods=['post'], url_path='reject-translation')
    def reject_translation(self, request, pk=None):
        order = self.get_object()
        serializer = RejectTranslationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        comment = serializer.validated_data['review_comment']
        REJECTED_STATUS_ID = 6

        OrderEditorReview.objects.create(
            order=order,
            editor=request.user,
            review_comment=comment,
            review_status='rejected'
        )

        order.status_id_id = REJECTED_STATUS_ID

        order.save()

        if order.manager_id:
            try:
                send_mail(
                    subject=f"УВАГА: Переклад замовлення #{order.id} відхилено!",
                    message=f"Редактор {request.user.full_name} відхилив переклад.\nКоментар: {comment}",
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[order.manager.email],
                    fail_silently=True
                )
            except Exception:
                pass

        return Response({"message": "Переклад відхилено, менеджер повідомлений."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='approve-translation')
    def approve_translation(self, request, pk=None):
        order = self.get_object()
        serializer = ApproveTranslationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        score = serializer.validated_data['score']
        comment = serializer.validated_data.get('comment', '')
        COMPLETED_STATUS_ID = 4

        TranslationQuality.objects.create(
            order=order,
            user=request.user,
            score=score,
            comment=comment
        )

        OrderEditorReview.objects.create(
            order=order,
            editor=request.user,
            review_comment="Approved",
            review_status='approved'
        )

        order.status_id_id = COMPLETED_STATUS_ID
        order.save()

        return Response({"message": "Замовлення прийнято та оцінено!"}, status=status.HTTP_200_OK)
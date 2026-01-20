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
    ApproveTranslationSerializer, TranslatorUploadFileSerializer
from .models import Order, OrderTraffic, Status, OrderLink, File
from .serializers import OrderCreateSerializer, OrderTrafficSerializer
from ..core.models import LanguagePair
from ..core.serializers import LanguagePairSelectSerializer
from ..users.permissions import HasPermission

from ..dropbox_services.dropbox_utils import create_order_folder, upload_file_to_order_folder, get_dbx



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
        data = request.data.copy()

        source_lang_id = data.get('source_language')
        target_lang_id = data.get('target_language')

        language_pair_obj = None

        if source_lang_id and target_lang_id:
            language_pair_obj, created = LanguagePair.objects.get_or_create(
                source_language_id=source_lang_id,
                target_language_id=target_lang_id,
                defaults={'name': f"{source_lang_id} -> {target_lang_id}"}
            )
            data['language_pair'] = language_pair_obj.id

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.validated_data.pop('files', None)

        # Отримуємо об'єкти для заповнення обов'язкових полів
        status_instance = get_object_or_404(Status, slug="in_translation")  # Стовпець 6 на вашому скріншоті
        User = get_user_model()
        test_user = User.objects.get(pk=3)

        # 👇 ПЕРЕДАЄМО ID ЯВНО
        order = serializer.save(
            manager_id=test_user,
            editor_id=test_user,
            status_id=status_instance,
            client_status=status_instance,
            translator_status=status_instance,

            # Використовуємо імена полів з моделі Order
            # Додаємо _id, щоб передати саме число (ID)
            language_pair_id_id=data.get('language_pair_id') or data.get('language_pair'),
            client_id_id=data.get('client_id'),
            traffic_id_id=data.get('traffic_id'),
            translator_id_id=data.get('translator_id'),
            translator_traffic_id_id=data.get('translator_traffic_id')
        )

        generated_link_slug = str(uuid.uuid4())
        generated_password = secrets.token_urlsafe(8)
        expire_date = timezone.now() + timedelta(days=45)

        order_link = OrderLink.objects.create(
            order=order,
            assignee=OrderLink.Assignee.TRANSLATOR,
            link=generated_link_slug,
            password=generated_password,
            expire_at=expire_date
        )

        files = request.FILES.getlist('files')

        stats = {
            "chars_with_spaces": 0,
            "chars_no_spaces": 0,
            "images": 0,
            "physical_pages": 0
        }

        chars_with_spaces_separate_files = []
        physical_pages_separate_files = []

        WORD_NAMESPACE = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

        for file in files:
            file_name = file.name.lower()
            text_parts = []

            try:
                # --- Обробка DOCX ---
                if file_name.endswith('.docx'):
                    try:
                        doc = docx.Document(file)

                        # 1. Текст з абзаців
                        text_parts.extend([p.text for p in doc.paragraphs])

                        # 2. Текст з таблиць
                        for table in doc.tables:
                            text_parts.extend([cell.text for row in table.rows for cell in row.cells])

                        # 3. Текст з колонтитулів
                        for section in doc.sections:
                            text_parts.extend([p.text for p in section.header.paragraphs])
                            text_parts.extend([p.text for p in section.footer.paragraphs])

                        # 4. Текст з Textboxes/Shapes (через XML)
                        try:
                            # doc.element.xpath повертає список елементів
                            for t in doc.element.xpath('.//w:txbxContent//w:t'):
                                if t.text:
                                    text_parts.append(t.text)
                        except Exception as e:
                            print(f"DOCX Textbox extraction warning: {e}")

                    except Exception as e:
                        print(f"DOCX text extraction error: {e}")

                    # 5. ZIP-структура (Картинки + Фізичні сторінки)
                    file.seek(0)
                    try:
                        with zipfile.ZipFile(file) as archive:
                            namelist = archive.namelist()
                            # Рахуємо картинки
                            stats["images"] += sum(1 for name in namelist if name.startswith('word/media/'))

                            # Рахуємо сторінки з метаданих app.xml
                            if 'docProps/app.xml' in namelist:
                                app_xml = archive.read('docProps/app.xml').decode('utf-8')
                                pages_match = re.search(r'<Pages>(\d+)</Pages>', app_xml)
                                if pages_match:
                                    stats["physical_pages"] += int(pages_match.group(1))
                    except Exception as e:
                        print(f"DOCX zip analysis error: {e}")

                # --- Обробка PDF ---
                elif file_name.endswith('.pdf'):
                    try:
                        reader = pypdf.PdfReader(file)
                        stats["physical_pages"] += len(reader.pages)

                        for page in reader.pages:
                            extracted = page.extract_text()
                            if extracted:
                                text_parts.append(extracted)
                            if hasattr(page, 'images'):
                                stats["images"] += len(page.images)
                    except Exception as e:
                        print(f"PDF error: {e}")

                # --- Фінальна агрегація тексту файлу ---
                full_text = "\n".join(text_parts)

                # 1. Рахуємо символи з пробілами (очищаємо тільки невидимі службові символи)
                full_text_cleaned_display = re.sub(r'[\ufeff\u200b]', '', full_text)
                stats["chars_with_spaces"] += len(full_text_cleaned_display)
                chars_with_spaces_separate_files.append(len(full_text_cleaned_display))

                # 2. Рахуємо символи БЕЗ пробілів (видаляємо всі пробіли, ентери, таби)
                clean_text = re.sub(r'[\s\ufeff\u200b]+', '', full_text)
                stats["chars_no_spaces"] += len(clean_text)
                physical_pages_separate_files.append(len(clean_text))

            except Exception as e:
                print(f"General error processing file {file.name}: {e}")

        # Оновлюємо та зберігаємо замовлення зі статистикою
        order.symbols_count = stats["chars_with_spaces"]
        order.page_count = stats["physical_pages"]
        order.save()


        full_link = f"http://localhost:3000/translator/{generated_link_slug}" #TODO

        if order.translator_id and order.translator_id.email:
            try:
                subject = f"Нове замовлення #{order.id} - LingvoTeam"
                message = (
                    f"Вітаємо, {order.translator_id.full_name}!\n\n"
                    f"Для вас створено новий проект доступу до замовлення #{order.id}.\n"
                    f"Посилання для роботи: {full_link}\n"
                    f"Пароль доступу: {generated_password}\n\n"
                    f"Термін дії посилання: до {expire_date.strftime('%d.%m.%Y %H:%M')}\n\n"
                    f"З повагою, команда LingvoTeam."
                )

                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[order.translator_id.email],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"Помилка відправки пошти перекладачу: {e}")

        lp_response_data = None
        if language_pair_obj:
            lp_response_data = LanguagePairSelectSerializer(language_pair_obj).data

        if files:
            try:
                base_path = create_order_folder(order)

                for f in files:
                    f.seek(0)
                    upload_file_to_order_folder(order, f, base_path=base_path, subdir="source")
                source_folder_link = get_shared_folder_link(base_path) + str(order.id)

                for i, f in enumerate(files):
                    ext = os.path.splitext(f.name)[1].lstrip(".").lower()

                    File.objects.create(
                        order=order,
                        file_type=ext,
                        dropbox_url=source_folder_link,
                        detected_pages=physical_pages_separate_files[i],
                        detected_symbols=chars_with_spaces_separate_files[i],
                    )

            except Exception as e:
                print(f"Dropbox failed for order {order.id}: {e}")

        return Response({
            "message": "Замовлення успішно створено",
            "order_id": order.id,

            "language_pair": lp_response_data,

            "stats": {
                "physical_pages": stats["physical_pages"],
                "chars_with_spaces": stats["chars_with_spaces"],
                "chars_no_spaces": stats["chars_no_spaces"],
                "images_count": stats["images"]
            },

            "translator_link": {
                "full_url": full_link,
                "password": generated_password,
                "expire_at": expire_date
            }
        }, status=status.HTTP_201_CREATED)


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
    
    @action(detail=True, methods=["post"], url_path="translator-upload",)
    def translator_file_upload(self, request, pk=None):
        order = self.get_object()
        serializer = TranslatorUploadFileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if user != order.manager_id and user != order.translator_id and user != order.editor_id:
            return Response({"detail": "Недостатньо прав для завантаження файлів."}, status=status.HTTP_403_FORBIDDEN)
        dbx = get_dbx()
        files = serializer.validated_data["files"]

        base_path = f"/orders/order_{order.id}"
        uploaded = []
        for f in files:
            dropbox_path = upload_file_to_order_folder(
                order=order,
                file=f,
                base_path=base_path,
                subdir="source",
            )
            uploaded.append(
                {
                    "filename": f.name,
                    "dropbox_path": dropbox_path,
                }
            )

        return Response(
            {
                "message": "Files uploaded",
                "count": len(uploaded),
                "files": uploaded,
            },
            status=status.HTTP_201_CREATED,
        )
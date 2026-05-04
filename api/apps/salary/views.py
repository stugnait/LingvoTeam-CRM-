from django.db import transaction
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from decimal import Decimal

from apps.users.models import User
from apps.translators.models import Translator  # 🔥 ОБОВ'ЯЗКОВО ДОДАЙ ЦЕЙ ІМПОРТ
from apps.core.models.transaction import Transaction
from apps.core.models.transaction_category import TransactionCategory
from .models import ManagerStats, TranslatorStats, EditorStats

from .models.salary import Salary
from .serializers import SalarySerializer
from .services import calculate_stats


class SalaryViewSet(viewsets.ModelViewSet):
    queryset = Salary.objects.select_related("user", "user__role").all()
    serializer_class = SalarySerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get("role")

        if role:
            if str(role) == "5" or role == "translator":
                queryset = queryset.filter(translator__isnull=False)
            elif role in ["manager", "editor"]:
                queryset = queryset.filter(user__role__slug=role)
            elif str(role).isdigit():
                queryset = queryset.filter(user__role_id=int(role))

        return queryset

    # 🔥 PREVIEW
    @action(detail=False, methods=["get"])
    def preview(self, request):
        user_id = request.query_params.get("user")
        start = request.query_params.get("start_date")
        end = request.query_params.get("end_date")
        role = request.query_params.get("role")

        # Перевіряємо, в якій таблиці шукати працівника
        if str(role) == "5" or role == "translator":
            person = Translator.objects.get(id=user_id)
            last_salary = Salary.objects.filter(translator=person).order_by("-end_date").first()
            role_slug = "translator"
        else:
            person = User.objects.get(id=user_id)
            last_salary = Salary.objects.filter(user=person).order_by("-end_date").first()
            role_slug = person.role.slug if hasattr(person, 'role') and person.role else None

        # Отримуємо розширену статистику (виручка, маржа, сторінки, кількість)
        stats = calculate_stats(person, start, end, role_slug)

        base_salary = last_salary.base_salary if last_salary else 0

        return Response({
            "user": person.id,
            "full_name": person.full_name,
            "base_salary": base_salary,
            "bonus": 0,
            "premium": 0,
            **stats
        })

    # 🔥 CONFIRM (CREATE)
    # @transaction.atomic
    def create(self, request, *args, **kwargs):
        data = request.data
        start = data["start_date"]
        end = data["end_date"]

        translator_id = data.get("translator")
        user_id = data.get("user")

        # 1. Визначаємо, хто це, і створюємо базовий запис
        if translator_id:
            person = Translator.objects.get(id=translator_id)
            role_slug = "translator"

            if Salary.objects.filter(translator=person, start_date=start, end_date=end).exists():
                return Response({"detail": "Salary already exists for this period"}, status=400)

            salary = Salary.objects.create(
                translator=person,  # Зберігаємо в поле translator
                start_date=start,
                end_date=end,
                base_salary=data.get("base_salary", 0),
                bonus=data.get("bonus", 0),
                premium=data.get("premium", 0),
                status="finalized"
            )
        else:
            person = User.objects.get(id=user_id)
            role_slug = person.role.slug if hasattr(person, 'role') and person.role else None

            if Salary.objects.filter(user=person, start_date=start, end_date=end).exists():
                return Response({"detail": "Salary already exists for this period"}, status=400)

            salary = Salary.objects.create(
                user=person,  # Зберігаємо в поле user
                start_date=start,
                end_date=end,
                base_salary=data.get("base_salary", 0),
                bonus=data.get("bonus", 0),
                premium=data.get("premium", 0),
                status="finalized"
            )

        # 2. Рахуємо статистику
        stats = calculate_stats(person, start, end, role_slug)

        # 3. Розкидаємо статистику по відповідних таблицях
        if role_slug == "manager":
            ManagerStats.objects.create(
                salary=salary,
                revenue=stats.get("revenue", 0),
                orders_count=stats.get("orders_count", 0),
                overdue_orders_count=stats.get("overdue_orders_count", 0),
                margin=stats.get("margin", 0)
            )
        elif role_slug == "translator":
            TranslatorStats.objects.create(
                salary=salary,
                # revenue=stats.get("revenue", 0),
                # orders_count=stats.get("orders_count", 0),
                avg_rating=stats.get("average_score", 0),
                pages=stats.get("pages_count", 0),
                symbols=stats.get("chars_count", 0)  # Беремо 'chars_count', як вказано в calculate_stats
            )
        elif role_slug == "editor":
            EditorStats.objects.create(
                salary=salary,
                orders_count=stats.get("orders_count", 0),
                pages=stats.get("pages_count", 0)
            )

        serializer = self.get_serializer(salary)
        return Response(serializer.data)
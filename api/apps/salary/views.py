from datetime import date
from dateutil.relativedelta import relativedelta

from django.db import transaction
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.users.models import User
from apps.translators.models import Translator
from apps.core.models.transaction import Transaction
from apps.core.models.transaction_category import TransactionCategory
from .models import ManagerStats, TranslatorStats, EditorStats
from .models.salary import Salary
from .serializers import SalarySerializer
from .services import calculate_stats


def _get_previous_month_base_salary(person, is_translator: bool) -> int:
    """
    Повертає base_salary з останнього запису за ПОПЕРЕДНІЙ місяць.
    Якщо запису немає — повертає 0.
    """
    today = date.today()
    prev_month_start = date(today.year, today.month, 1) - relativedelta(months=1)
    prev_month_end = date(today.year, today.month, 1) - relativedelta(days=1)

    if is_translator:
        last_salary = (
            Salary.objects
            .filter(
                translator=person,
                start_date__gte=prev_month_start,
                end_date__lte=prev_month_end,
            )
            .order_by("-end_date")
            .first()
        )
    else:
        last_salary = (
            Salary.objects
            .filter(
                user=person,
                start_date__gte=prev_month_start,
                end_date__lte=prev_month_end,
            )
            .order_by("-end_date")
            .first()
        )

    return last_salary.base_salary if last_salary else 0


class SalaryViewSet(viewsets.ModelViewSet):
    queryset = Salary.objects.select_related("user", "user__role", "translator").all()
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

    # ─── PREVIEW ──────────────────────────────────────────────────────────────
        # ─── PREVIEW ──────────────────────────────────────────────────────────────
    @action(detail=False, methods=["get"])
    def preview(self, request):
        user_id = request.query_params.get("user")
        start = request.query_params.get("start_date")
        end = request.query_params.get("end_date")
        role = request.query_params.get("role")

        is_translator = str(role) == "5" or role == "translator"

        if is_translator:
            person = Translator.objects.get(id=user_id)
            role_slug = "translator"
        else:
            person = User.objects.get(id=user_id)
            role_slug = person.role.slug if hasattr(person, "role") and person.role else None

        stats = calculate_stats(person, start, end, role_slug)

        existing_salary = None
        if is_translator:
            existing_salary = Salary.objects.filter(translator=person, start_date=start, end_date=end).first()
        else:
            existing_salary = Salary.objects.filter(user=person, start_date=start, end_date=end).first()

        # 🔥 ДОДАЄМО ЛОГІКУ ДЛЯ is_saved
        if existing_salary:
            base_salary = existing_salary.base_salary
            bonus = existing_salary.bonus
            premium = existing_salary.premium
            is_saved = True  # <--- Запис вже існує в базі
        else:
            base_salary = _get_previous_month_base_salary(person, is_translator)
            bonus = 0
            premium = 0
            is_saved = False # <--- Запису ще немає, це чернетка

        return Response({
            "user": person.id,
            "full_name": person.full_name,
            "base_salary": base_salary,
            "bonus": bonus,
            "premium": premium,
            "is_saved": is_saved,  # 🔥 Віддаємо на фронтенд
            **stats,
        })

    # ─── CREATE (CONFIRM) ─────────────────────────────────────────────────────
    def create(self, request, *args, **kwargs):
        data = request.data
        start = data["start_date"]
        end = data["end_date"]

        translator_id = data.get("translator")
        user_id = data.get("user")

        if translator_id:
            person = Translator.objects.get(id=translator_id)
            role_slug = "translator"
            is_translator = True

            existing = Salary.objects.filter(translator=person, start_date=start, end_date=end).first()
            if existing:
                # Оновлюємо існуючий запис
                salary = existing
                salary.base_salary = data.get("base_salary", salary.base_salary)
                salary.bonus = data.get("bonus", salary.bonus)
                salary.premium = data.get("premium", salary.premium)
                salary.status = "finalized"
                salary.save()
            else:
                salary = Salary.objects.create(
                    translator=person,
                    start_date=start,
                    end_date=end,
                    base_salary=data.get("base_salary", 0),
                    bonus=data.get("bonus", 0),
                    premium=data.get("premium", 0),
                    status="finalized",
                )
        else:
            person = User.objects.get(id=user_id)
            role_slug = person.role.slug if hasattr(person, "role") and person.role else None
            is_translator = False

            existing = Salary.objects.filter(user=person, start_date=start, end_date=end).first()
            if existing:
                salary = existing
                salary.base_salary = data.get("base_salary", salary.base_salary)
                salary.bonus = data.get("bonus", salary.bonus)
                salary.premium = data.get("premium", salary.premium)
                salary.status = "finalized"
                salary.save()
            else:
                salary = Salary.objects.create(
                    user=person,
                    start_date=start,
                    end_date=end,
                    base_salary=data.get("base_salary", 0),
                    bonus=data.get("bonus", 0),
                    premium=data.get("premium", 0),
                    status="finalized",
                )

        # Рахуємо статистику і зберігаємо в окремі таблиці
        stats = calculate_stats(person, start, end, role_slug)

        if role_slug == "manager":
            ManagerStats.objects.update_or_create(
                salary=salary,
                defaults=dict(
                    revenue=stats.get("revenue", 0),
                    orders_count=stats.get("orders_count", 0),
                    overdue_orders_count=stats.get("overdue_orders_count", 0),
                    margin=stats.get("margin", 0),
                ),
            )
        elif role_slug == "translator":
            TranslatorStats.objects.update_or_create(
                salary=salary,
                defaults=dict(
                    avg_rating=stats.get("average_score", 0),
                    pages=stats.get("pages_count", 0),
                    symbols=stats.get("chars_count", 0),
                ),
            )
        elif role_slug == "editor":
            EditorStats.objects.update_or_create(
                salary=salary,
                defaults=dict(
                    orders_count=stats.get("orders_count", 0),
                    pages=stats.get("pages_count", 0),
                ),
            )

        serializer = self.get_serializer(salary)
        return Response(serializer.data)
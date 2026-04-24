from django.db import transaction
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from decimal import Decimal

from apps.users.models import User
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
            queryset = queryset.filter(user__role_id=role)

        return queryset

    # 🔥 PREVIEW
    @action(detail=False, methods=["get"])
    def preview(self, request):
        user_id = request.query_params.get("user")
        start = request.query_params.get("start_date")
        end = request.query_params.get("end_date")

        user = User.objects.get(id=user_id)

        # Отримуємо розширену статистику (виручка, маржа, сторінки, кількість)
        stats = calculate_stats(user, start, end)

        last_salary = Salary.objects.filter(user=user).order_by("-end_date").first()
        base_salary = last_salary.base_salary if last_salary else 0

        return Response({
            "user": user.id,
            "full_name": user.full_name,
            "base_salary": base_salary,
            "bonus": 0,
            "premium": 0,
            **stats  # Сюди підставляться: revenue, margin, pages_count, symbols_count, orders_count...
        })

    # 🔥 CONFIRM (CREATE)
    # @transaction.atomic  # Гарантує, що все збережеться або нічого
    def create(self, request, *args, **kwargs):
        data = request.data
        user = User.objects.get(id=data["user"])

        start = data["start_date"]
        end = data["end_date"]

        # 1. Перевірка дубля
        if Salary.objects.filter(user=user, start_date=start, end_date=end).exists():
            return Response({"detail": "Salary already exists for this period"}, status=400)

        # 2. Створюємо базовий запис зарплати (ТІЛЬКИ гроші та дати)
        salary = Salary.objects.create(
            user=user,
            start_date=start,
            end_date=end,
            base_salary=data.get("base_salary", 0),
            bonus=data.get("bonus", 0),
            premium=data.get("premium", 0),
            status="finalized"
        )

        # 3. Рахуємо статистику (твоя функція)
        stats = calculate_stats(user, start, end)
        role_slug = user.role.slug if user.role else None

        # 4. Розкидаємо статистику по відповідних таблицях
        if role_slug == "manager":
            ManagerStats.objects.create(
                salary=salary,  # Зв'язуємо з базовою зарплатою
                revenue=stats.get("revenue", 0),
                orders_count=stats.get("orders_count", 0),
                overdue_orders_count=stats.get("overdue_orders_count", 0),
                margin=stats.get("margin", 0)
            )
        elif role_slug == "translator":
            TranslatorStats.objects.create(
                salary=salary,
                revenue=stats.get("revenue", 0),
                orders_count=stats.get("orders_count", 0),
                pages_count=stats.get("pages_count", 0),
                symbols_count=stats.get("symbols_count", 0)
            )
        elif role_slug == "editor":
            EditorStats.objects.create(
                salary=salary,
                orders_count=stats.get("orders_count", 0),
                pages_count=stats.get("pages_count", 0)
            )

        # 5. Створення транзакції (Transaction) - залишається як було
        # total = (salary.base_salary or 0) + (salary.bonus or 0) + (salary.premium or 0)
        # salary_category = TransactionCategory.objects.filter(name="Salary").first()

        # Transaction.objects.create(
        #     amount=total,
        #     type=Transaction.TransactionType.EXPENSE,
        #     category=salary_category,
        #     comment=f"Salary for {user.full_name} ({start} - {end})"
        # )

        # Повертаємо створену зарплату
        serializer = self.get_serializer(salary)
        return Response(serializer.data)
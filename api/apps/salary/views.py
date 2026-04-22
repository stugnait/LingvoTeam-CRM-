from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from decimal import Decimal

from apps.users.models import User
from apps.core.models.transaction import Transaction
from apps.core.models.transaction_category import TransactionCategory

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

        stats = calculate_stats(user, start, end)

        last_salary = Salary.objects.filter(user=user).order_by("-end_date").first()

        base_salary = last_salary.base_salary if last_salary else 0

        return Response({
            "user": user.id,
            "full_name": user.full_name,
            "base_salary": base_salary,
            "bonus": 0,
            "premium": 0,
            **stats
        })

    # 🔥 CONFIRM (CREATE)
    def create(self, request, *args, **kwargs):
        data = request.data
        user = User.objects.get(id=data["user"])

        start = data["start_date"]
        end = data["end_date"]

        # ❗ перевірка дубля
        if Salary.objects.filter(user=user, start_date=start, end_date=end).exists():
            return Response({"detail": "Salary already exists for this period"}, status=400)

        stats = calculate_stats(user, start, end)

        salary = Salary.objects.create(
            user=user,
            start_date=start,
            end_date=end,
            base_salary=data.get("base_salary", 0),
            bonus=data.get("bonus", 0),
            premium=data.get("premium", 0),
            status="finalized",
            **stats
        )

        # 🔥 Transaction
        total = (
            (salary.base_salary or 0)
            + (salary.bonus or 0)
            + (salary.premium or 0)
        )

        salary_category = TransactionCategory.objects.filter(name="Salary").first()

        Transaction.objects.create(
            amount=total,
            type=Transaction.TransactionType.EXPENSE,
            category=salary_category,
            comment=f"Salary for {user.full_name} ({start} - {end})"
        )

        serializer = self.get_serializer(salary)
        return Response(serializer.data)
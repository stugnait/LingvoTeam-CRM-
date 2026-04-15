from rest_framework import serializers
from django.db.models import Sum, Count, F, Q
from decimal import Decimal

from .models import Salary
from apps.orders.models import Order


class SalarySerializer(serializers.ModelSerializer):
    total = serializers.SerializerMethodField()

    # 🔥 беремо роль з user
    role = serializers.IntegerField(source="user.role.id", read_only=True)

    class Meta:
        model = Salary
        fields = "__all__"

    def get_total(self, obj):
        return obj.revenue + obj.bonus + obj.premium

    def create(self, validated_data):
        user = validated_data["user"]
        start = validated_data["start_date"]
        end = validated_data["end_date"]

        role_id = user.role.id if user.role else None

        orders = Order.objects.none()

        # 🔥 РОЗГАЛУЖЕННЯ ПО РОЛІ
        if role_id == 3:
            # ❌ поки пропускаємо перекладачів
            pass

        elif role_id == 2:
            # ✅ EDITOR
            orders = Order.objects.filter(
                editor_id=user,
                completed_at__isnull=False,
                completed_at__date__gte=start,
                completed_at__date__lte=end,
            )

        elif role_id == 1:
            # ✅ MANAGER (якщо є поле client/manager)
            orders = Order.objects.filter(
                manager_id=user,
                completed_at__isnull=False,
                completed_at__date__gte=start,
                completed_at__date__lte=end,
            )

        elif role_id == 4:
            # ✅ FINANCE (може взагалі без фільтра або своя логіка)
            orders = Order.objects.filter(
                completed_at__isnull=False,
                completed_at__date__gte=start,
                completed_at__date__lte=end,
            )

        stats = orders.aggregate(
            revenue=Sum("total_amount"),
            orders_count=Count("id"),
            overdue_orders=Count(
                "id",
                filter=Q(completed_at__gt=F("deadline"))
            ),
        )

        validated_data["revenue"] = stats["revenue"] or 0
        validated_data["orders_count"] = stats["orders_count"] or 0
        validated_data["overdue_orders_count"] = stats["overdue_orders"] or 0
        validated_data["margin"] = 0

        return super().create(validated_data)
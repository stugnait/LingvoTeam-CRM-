from rest_framework import serializers
from decimal import Decimal

from .models.salary import Salary


class SalarySerializer(serializers.ModelSerializer):
    total = serializers.SerializerMethodField()
    full_name = serializers.CharField(source="user.full_name", read_only=True)
    role = serializers.IntegerField(source="user.role.id", read_only=True)

    class Meta:
        model = Salary
        fields = [
            "id",
            "user",
            "full_name",
            "role",
            "start_date",
            "end_date",
            "revenue",
            "orders_count",
            "overdue_orders_count",
            "margin",
            "base_salary",
            "bonus",
            "premium",
            "total",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "revenue",
            "orders_count",
            "overdue_orders_count",
            "margin",
            "total",
            "created_at",
            "updated_at",
        ]

    def get_total(self, obj):
        return (
            (obj.base_salary or 0)
            + (obj.bonus or 0)
            + (obj.premium or 0)
        )

    def validate(self, data):
        start = data.get("start_date")
        end = data.get("end_date")

        if start and end and start > end:
            raise serializers.ValidationError("Start date cannot be after end date")

        return data
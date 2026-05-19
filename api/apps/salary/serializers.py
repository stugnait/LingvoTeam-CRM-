from rest_framework import serializers
from decimal import Decimal

from .models.salary import Salary


class SalarySerializer(serializers.ModelSerializer):
    total = serializers.SerializerMethodField()

    # Підтримка і user, і translator
    full_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = Salary
        fields = [
            "id",
            "user",
            "translator",
            "full_name",
            "role",
            "start_date",
            "end_date",
            "base_salary",
            "bonus",
            "premium",
            "total",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "total",
            "created_at",
            "updated_at",
        ]

    def get_full_name(self, obj):
        if obj.translator:
            return obj.translator.full_name
        if obj.user:
            return obj.user.full_name
        return None

    def get_role(self, obj):
        # Перекладач — ID 5 (умовний)
        if obj.translator:
            return 5
        if obj.user and hasattr(obj.user, "role") and obj.user.role:
            return obj.user.role.id
        return None

    def get_total(self, obj):
        return float(
            (obj.base_salary or Decimal("0"))
            + (obj.bonus or Decimal("0"))
            + (obj.premium or Decimal("0"))
        )

    def validate(self, data):
        start = data.get("start_date")
        end = data.get("end_date")

        if start and end and start > end:
            raise serializers.ValidationError("Start date cannot be after end date")

        return data
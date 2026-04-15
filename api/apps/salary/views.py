from rest_framework import viewsets
from .models import Salary
from .serializers import SalarySerializer


class SalaryViewSet(viewsets.ModelViewSet):
    queryset = Salary.objects.select_related("user", "user__role").all()
    serializer_class = SalarySerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        role = self.request.query_params.get("role")

        # 🔥 ФІЛЬТР ПО ROLE
        if role:
            queryset = queryset.filter(user__role_id=role)

        return queryset

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()
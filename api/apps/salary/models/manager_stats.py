from django.db import models
from django.core.exceptions import ValidationError

from .salary import Salary
from apps.users.models import User

class ManagerStats(models.Model):
    salary = models.OneToOneField(Salary, on_delete=models.CASCADE, related_name="manager_stats")

    revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    orders_count = models.IntegerField(default=0)
    overdue_orders_count = models.IntegerField(default=0)
    margin = models.DecimalField(max_digits=5, decimal_places=2, default=0)
from django.db import models
from django.core.exceptions import ValidationError

from .salary import Salary
from apps.users.models import User

class TranslatorStats(models.Model):
    salary = models.OneToOneField(Salary, on_delete=models.CASCADE, related_name="translator_stats")

    pages = models.IntegerField(default=0)
    symbols = models.IntegerField(default=0)
    avg_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
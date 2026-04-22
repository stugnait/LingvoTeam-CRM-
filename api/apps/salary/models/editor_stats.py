from django.db import models
from django.core.exceptions import ValidationError

from .salary import Salary
from apps.users.models import User

class EditorStats(models.Model):
    salary = models.OneToOneField(Salary, on_delete=models.CASCADE, related_name="editor_stats")

    pages = models.IntegerField(default=0)
    symbols = models.IntegerField(default=0)
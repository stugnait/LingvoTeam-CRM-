from django.db import models
from django.core.exceptions import ValidationError
from apps.users.models import User


class Salary(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("calculated", "Calculated"),
        ("paid", "Paid"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="salaries", null=True, blank=True)
    translator = models.ForeignKey('translators.Translator', on_delete=models.CASCADE, related_name="salaries",
                                   null=True, blank=True)

    start_date = models.DateField(null=True, blank=True,)
    end_date = models.DateField(null=True, blank=True)

    revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    orders_count = models.PositiveIntegerField(default=0)
    overdue_orders_count = models.PositiveIntegerField(default=0)

    margin = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    base_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    bonus = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    premium = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="draft"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-start_date"]

    def clean(self):
        if self.start_date > self.end_date:
            raise ValidationError("Start date cannot be after end date")

    def __str__(self):
        return f"{self.user} | {self.start_date} - {self.end_date}"
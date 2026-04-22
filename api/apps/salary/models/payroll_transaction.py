from django.db import models
from django.utils import timezone

from apps.users.models import User


class PayrollTransaction(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="payroll_transactions"
    )

    # 💰 деталі виплати
    base_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    bonus = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    premium = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)


    # 📅 період зарплати
    period_start = models.DateField()
    period_end = models.DateField()

    # 📅 коли виплачено
    paid_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "payroll_transaction"
        ordering = ["-paid_at"]

    def save(self, *args, **kwargs):
        self.total = (
            (self.base_salary or 0)
            + (self.bonus or 0)
            + (self.premium or 0)
        )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user} | {self.total} | {self.period_start} - {self.period_end}"
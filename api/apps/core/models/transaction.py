from django.db import models

from apps import core
from apps.core.models.transaction_category import TransactionCategory


class Transaction(models.Model):
    class TransactionType(models.TextChoices):
        INCOME = 'income', 'Прихід'
        EXPENSE = 'expense', 'Витрата'

    amount = models.FloatField()
    currency = models.ForeignKey(
        'core.Currency',
        on_delete=models.PROTECT,
        related_name='transactions'
    )
    type = models.CharField(
        max_length=20,
        choices=TransactionType.choices,
        default=TransactionType.INCOME
    )
    category = models.ForeignKey(
        TransactionCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions'
    )
    comment = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = 'transaction'

    def __str__(self):
        return f"{self.type} - {self.amount} ({self.created_at.strftime('%Y-%m-%d')})"
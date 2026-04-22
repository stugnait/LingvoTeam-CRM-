from decimal import Decimal

from django.db import models

from apps import core, users, clients, orders, translators


class Priority(models.TextChoices):
    LOW = 'low', 'Низький'
    MEDIUM = 'medium', 'Середній'
    HIGH = 'high', 'Високий'
    CRITICAL = 'critical', 'Критичний'


class Order(models.Model):

    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM,
        verbose_name="Пріоритет"
    )

    language_pair_id = models.ForeignKey(
        "core.LanguagePair",
        on_delete=models.CASCADE,
        db_column='language_pair_id'
    )

    manager_accept_id = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name='accepted_orders',
        db_column='manager_accept_id'
    )

    manager_delivery_id = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name='delivered_orders',
        db_column='manager_delivery_id',
        null=True,
        blank=True
    )

    editor_id = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name='edited_orders',
        db_column='editor_id'
    )

    client_id = models.ForeignKey(
        "clients.Client",
        on_delete=models.CASCADE,
        db_column='client_id'
    )

    traffic_id = models.ForeignKey(
        'orders.OrderTraffic',
        on_delete=models.CASCADE,
        db_column='traffic_id'
    )

    translator_id = models.ForeignKey(
        "translators.Translator",
        on_delete=models.CASCADE,
        db_column='translator_id'
    )

    translator_traffic_id = models.ForeignKey(
        "translators.TranslatorTraffic",
        on_delete=models.CASCADE,
        db_column='translator_traffic_id'
    )

    # Також для статусів
    client_status = models.ForeignKey(
        "Status", on_delete=models.CASCADE,
        related_name='client_status_orders', db_column='client_status'
    )
    translator_status = models.ForeignKey(
        "Status", on_delete=models.CASCADE,
        related_name='translator_status_orders', db_column='translator_status'
    )
    status_id = models.ForeignKey(
        "Status", on_delete=models.CASCADE,
        related_name='general_status_orders', db_column='status_id'
    )
    accepted_at = models.DateTimeField(null=True)
    deadline = models.DateTimeField(null=True)
    flex_deadline = models.BooleanField(default=False)

    page_count = models.FloatField(default=0)
    symbols_count = models.IntegerField(default=0)

    client_comment = models.TextField(null=True)

    translator_comment = models.TextField(null=True)


    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True)
    completed_at = models.DateTimeField(null=True)

    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name="Сума для клієнта"
    )

    position = models.FloatField(default=0.0, db_index=True)

    class Meta:
        db_table = 'orders'
        ordering = ['position']

from django.db import models

class OrderStatusHistory(models.Model):
    order = models.ForeignKey(
        'Order',
        on_delete=models.CASCADE,
        related_name='status_history',
        verbose_name="Замовлення"
    )

    status = models.ForeignKey(
        'Status',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='history_main_statuses',
        verbose_name="Загальний статус"
    )

    client_status = models.ForeignKey(
        'Status',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='history_client_statuses',
        verbose_name="Статус для клієнта"
    )

    translator_status = models.ForeignKey(
        'Status',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='history_translator_statuses',
        verbose_name="Статус для перекладача"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата зміни"
    )

    class Meta:
        db_table = 'order_status_history'
        verbose_name = 'Історія статусів'
        verbose_name_plural = 'Історія статусів'
        ordering = ['-created_at']

    def __str__(self):
        return f"Зміна статусу замовлення #{self.order_id} від {self.created_at.strftime('%Y-%m-%d %H:%M')}"
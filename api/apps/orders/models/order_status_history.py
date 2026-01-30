from django.db import models


class OrderStatusHistory(models.Model):
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.CASCADE,
        related_name='history_logs'
    )

    client_status = models.ForeignKey(
        'orders.Status',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='history_as_client_status'
    )

    translator_status = models.ForeignKey(
        'orders.Status',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='history_as_translator_status'
    )

    status = models.ForeignKey(
        'orders.Status',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='history_as_main_status'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'order_status_history'
        verbose_name = 'Order Status History'
        verbose_name_plural = 'Order Status Histories'
        ordering = ['-created_at']  # Сортуємо від найновіших до найстаріших

    def __str__(self):
        return f"History for Order #{self.order_id} at {self.created_at}"
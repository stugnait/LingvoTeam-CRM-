from django.db import models

from LingvoTeam import settings


class OrderEditorReview(models.Model):
    STATUS_CHOICES = (
        ('rejected', 'Відхилено'),
        ('approved', 'Прийнято'),
    )

    order = models.ForeignKey(
        'Order',
        on_delete=models.CASCADE,
        related_name='editor_reviews',
        verbose_name='Замовлення'
    )

    editor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='Редактор'
    )

    review_comment = models.TextField(verbose_name='Коментар рев\'ю')

    review_status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='rejected',
        verbose_name='Статус рев\'ю'
    )

    reviewed_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата перевірки')

    class Meta:
        db_table = 'order_editor_review'
        verbose_name = 'Рев\'ю редактора'
        verbose_name_plural = 'Рев\'ю редакторів'
        ordering = ['-reviewed_at']

    def __str__(self):
        return f"Review {self.id} for Order {self.order_id} ({self.review_status})"
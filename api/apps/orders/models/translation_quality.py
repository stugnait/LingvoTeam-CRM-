from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models

from LingvoTeam import settings


class TranslationQuality(models.Model):
    order = models.OneToOneField(
        'Order',
        on_delete=models.CASCADE,
        related_name='quality_score',
        verbose_name='Замовлення'
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='Оцінювач'
    )

    score = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Оцінка (1-5)'
    )

    comment = models.TextField(blank=True, null=True, verbose_name='Коментар до оцінки')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата оцінювання')

    class Meta:
        db_table = 'translation_quality'
        verbose_name = 'Оцінка якості'
        verbose_name_plural = 'Оцінки якості'

    def __str__(self):
        return f"Order {self.order_id}: Score {self.score}"
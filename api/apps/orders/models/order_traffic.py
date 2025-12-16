from django.db import models

from apps import core


class OrderTraffic(models.Model):
    language_pair = models.ForeignKey(
        'core.LanguagePair',
        on_delete=models.SET_NULL,
        null=True,
    )

    currency_id=models.ForeignKey(
        'core.Currency',
        on_delete=models.SET_NULL,
        null=True,
    )

    price_per_page=models.FloatField(
        null=True,
        blank=True,
    )
    price_per_action = models.FloatField(
        null=True,
        blank=True,
    )

    class Meta:
        db_table = 'order_traffic'

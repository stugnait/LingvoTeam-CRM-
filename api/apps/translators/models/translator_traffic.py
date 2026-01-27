from django.db import models

from apps import core


class TranslatorTraffic(models.Model):
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

    rate_per_page=models.FloatField(
        null=True,
        blank=True,
    )

    rate_per_action = models.FloatField(
        null=True,
        blank=True,
    )
    translator = models.ForeignKey(
        'Translator',
        on_delete=models.CASCADE,
        related_name='translatortraffic',
        null=True,
        blank=True
    )

    category = models.ForeignKey(
        'core.OrderCategory',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='translator_tariffs'
    )

    class Meta:
        db_table = 'translator_traffic'

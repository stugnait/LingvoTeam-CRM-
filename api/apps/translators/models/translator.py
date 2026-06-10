from django.db import models

from apps import core


class Translator(models.Model):
    full_name = models.CharField(max_length=120)
    email = models.EmailField()
    phone = models.CharField(max_length=120)
    currency_id = models.ForeignKey('core.Currency', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    rating = models.FloatField(default=0.0)
    is_active = models.BooleanField(default=False)
    traffic = models.ManyToManyField(
        'TranslatorTraffic',
        blank=True,
        related_name='translators'
    )

    class Meta:
        db_table = 'translators'
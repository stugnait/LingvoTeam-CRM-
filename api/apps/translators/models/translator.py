from django.db import models

from apps import core


# translators/models.py
class Translator(models.Model):
    user = models.OneToOneField(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='translator_profile'
    )
    full_name = models.CharField(max_length=120)
    email = models.EmailField()
    phone = models.CharField(max_length=120)
    # currency_id = models.ForeignKey('core.Currency', on_delete=models.CASCADE)
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
from django.db import models

from apps import core


class Translator(models.Model):
    full_name = models.CharField(max_length=120)
    email = models.EmailField()
    phone = models.CharField(max_length=120)
    currency_id = models.ForeignKey('core.Currency', on_delete=models.CASCADE)
    work_type = models.CharField(max_length=120)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'translators'
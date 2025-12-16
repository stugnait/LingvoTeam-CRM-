from django.db import models

class ClientCategory(models.Model):
    name=models.CharField(max_length=100)
    discount_percent=models.FloatField(
        null=True,
        blank=True,
    )

    class Meta:
        db_table = 'client_category'
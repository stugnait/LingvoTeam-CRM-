from django.db import models

class Currency(models.Model):
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=10, unique=True)
    code_name = models.CharField(max_length=10, unique=True)

    class Meta:
        db_table = 'currency'
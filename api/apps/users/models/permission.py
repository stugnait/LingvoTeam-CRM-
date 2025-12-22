from django.db import models

class Permission(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True, null=True, blank=True)

    class Meta:
        db_table = 'permissions'
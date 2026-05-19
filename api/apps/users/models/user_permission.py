from django.contrib.auth.models import AbstractUser
from django.db import models

class UserPermission(models.Model):
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='extra_permissions'
    )
    permission = models.ForeignKey(
        'users.Permission',
        on_delete=models.CASCADE
    )

    class Meta:
        db_table = 'user_permissions'
        unique_together = ('user', 'permission')
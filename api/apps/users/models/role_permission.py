from django.db import models
from apps import users


class RolePermission(models.Model):
    role = models.ForeignKey('users.Role', on_delete=models.CASCADE)
    permission = models.ForeignKey("users.Permission", on_delete=models.CASCADE)

    class Meta:
        db_table = 'role_permissions'
        unique_together = ('role', 'permission')

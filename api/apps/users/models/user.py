from django.db import models

class User(models.Model):

    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)

    phone = models.CharField(max_length=20, blank=True, null=True)
    role = models.ForeignKey(
        'Role',
        on_delete=models.SET_NULL,
        null=True,
        db_column='role_id'
    )
    password = models.CharField(max_length=128)
    active = models.BooleanField(default=True)  # boolean

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'

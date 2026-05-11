from django.db import models

from apps.clients.models.client_category import ClientCategory


class Client(models.Model):
    category = models.ForeignKey(ClientCategory, on_delete=models.CASCADE, blank=True, null=True)
    full_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone_number = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'clients'

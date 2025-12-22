from django.db import models

class OrderLink(models.Model):
    class Assignee(models.TextChoices):
        TRANSLATOR = 'translator', 'Translator'
        CLIENT = 'client', 'Client'
        EDITOR = 'editor', 'Editor'

    order = models.ForeignKey('Order', on_delete=models.CASCADE, related_name='links')
    assignee = models.CharField(max_length=20, choices=Assignee.choices)
    link = models.CharField(max_length=255, unique=True)
    password = models.CharField(max_length=128, null=True, blank=True)
    expire_at = models.DateTimeField(null=True, blank=True)
    attempts = models.IntegerField(default=0)
    banned_to = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'order_links'
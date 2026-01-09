from django.db import models

class File(models.Model):
    order = models.ForeignKey('Order', on_delete=models.CASCADE, related_name='files')
    file_type = models.CharField(max_length=16)
    dropbox_url = models.CharField(max_length=255, unique=False)
    detected_pages = models.FloatField(default=0)
    detected_symbols = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = "files"
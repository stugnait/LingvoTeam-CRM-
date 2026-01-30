from django.db import models

class Status(models.Model):

    class StatusCategory(models.TextChoices):
        GENERAL = 'general', 'Загальний'
        CLIENT = 'client', 'Для клієнта'
        TRANSLATOR = 'translator', 'Для перекладача'
        EDITOR = 'editor', 'Для редактора'

    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True, null=True, blank=True)
    category = models.CharField(
        max_length=20,
        choices=StatusCategory.choices,
        default=StatusCategory.GENERAL,
        verbose_name="Категорія статусу"
    )


    class Meta:
        db_table = 'statuses'

    def __str__(self):
        return f"{self.name} [{self.get_category_display()}]"
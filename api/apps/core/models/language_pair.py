from django.db import models

from apps import core


class LanguagePair(models.Model):
    source_language = models.ForeignKey(
        'core.Language',
        on_delete=models.SET_NULL,
        null=True,
        related_name='source_for_pairs'
    )
    target_language = models.ForeignKey(
        'core.Language',
        on_delete=models.SET_NULL,
        null=True,
        related_name='target_for_pairs'
    )

    class Meta:
        db_table = 'language_pairs'



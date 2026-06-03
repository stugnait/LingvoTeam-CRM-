from django.db import models

from apps import core


class LanguagePair(models.Model):
    source_language = models.ForeignKey(
        'Language',
        on_delete=models.PROTECT,  # Або models.RESTRICT
        related_name='source_pairs'
    )
    target_language = models.ForeignKey(
        'Language',
        on_delete=models.PROTECT,  # Або models.RESTRICT
        related_name='target_pairs'
    )

    class Meta:
        db_table = 'language_pairs'

    def __str__(self):
        s_name = self.source_language.name if self.source_language else "???"
        t_name = self.target_language.name if self.target_language else "???"
        return f"{s_name} -> {t_name}"



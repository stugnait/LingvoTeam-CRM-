from django.db import models

class TranslatorLanguagePairs(models.Model):
    translator = models.ForeignKey(
        'Translator',
        on_delete=models.CASCADE,
        related_name='language_pair_relations'
    )
    language_pair = models.ForeignKey(
        'core.LanguagePair',
        on_delete=models.CASCADE,
        related_name='translator_relations'
    )

    class Meta:
        db_table = 'translator_language_pairs'
        verbose_name = 'Translator Language Pair'
        verbose_name_plural = 'Translator Language Pairs'
        unique_together = ('translator', 'language_pair')

    def __str__(self):
        return f"{self.translator} - {self.language_pair}"
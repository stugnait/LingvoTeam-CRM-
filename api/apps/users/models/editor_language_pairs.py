from django.db import models

from apps import core, users


class EditorLanguagePairs(models.Model):
    language_pair = models.ForeignKey("core.LanguagePair", on_delete=models.CASCADE)
    editor = models.ForeignKey("users.User", on_delete=models.CASCADE)

    class Meta:
        db_table = 'editor_language_pairs'
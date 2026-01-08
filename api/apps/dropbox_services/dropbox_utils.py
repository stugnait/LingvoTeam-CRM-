import os
import dropbox
from django.conf import settings
from dropbox.sharing import AddMember, MemberSelector, AccessLevel
from ..core.models import LanguagePair, Language


dbx = dropbox.Dropbox(settings.DROPBOX_ACCESS_TOKEN)

def create_order_folder(order):
    path = f"/orders/order_{order.id}"

    translator_email = order.translator_id.email

    try:
        dbx.files_create_folder_v2(path)
    except dropbox.exceptions.ApiError:
        pass

    try:
        launch = dbx.sharing_share_folder(path, force_async=False)
        shared_folder_id = launch.get_complete().shared_folder_id

        dbx.sharing_add_folder_member(
            shared_folder_id,
            members=[
                AddMember(
                    member=MemberSelector.email(translator_email),
                    access_level=AccessLevel.editor
                )
            ]
        )
    except dropbox.exceptions.ApiError:
        pass

    return path



def upload_file_to_order_folder(order, file, base_path, subdir="orders"):
    language_pair_val = (
        getattr(order, "language_pair_id", None)
        or getattr(order, "language_pair_id_id", None)
        or getattr(order, "language_pair", None)
    )

    language_pair_id = getattr(language_pair_val, "id", language_pair_val)

    source_language_id = None
    if language_pair_id:
        lp_row = (
            LanguagePair.objects
            .filter(id=language_pair_id)
            .values("source_language_id")
            .first()
        )
        if lp_row:
            source_language_id = lp_row.get("source_language_id")

    source_slug = "src"
    if source_language_id:
        lang_row = (
            Language.objects
            .filter(id=source_language_id)
            .values("slug")
            .first()
        )
        if lang_row and lang_row.get("slug"):
            source_slug = lang_row["slug"]

    name, ext = os.path.splitext(file.name)
    filename = f"{name}_{source_slug}{ext}"

    full_path = f"{base_path}/{subdir}/{filename}"

    try:
        file.seek(0)
    except Exception:
        pass

    content = file.read()
    if not content:
        file.seek(0)
        content = file.read()

    dbx.files_upload(
        content,
        full_path,
        mode=dropbox.files.WriteMode.overwrite
    )

    return full_path
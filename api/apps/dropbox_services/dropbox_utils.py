import os
import dropbox
from django.conf import settings
from django.core.mail import send_mail
from dropbox.sharing import AddMember, MemberSelector, AccessLevel
from ..core.models import LanguagePair, Language
from functools import lru_cache

ORDERS_ROOT = "/orders"

@lru_cache(maxsize=1)
def get_dbx():
    dbx = dropbox.Dropbox(
        oauth2_refresh_token=settings.DROPBOX_REFRESH_TOKEN,
        app_key=settings.DROPBOX_APP_KEY,
        app_secret=settings.DROPBOX_APP_SECRET,
    )
    return dbx

def ensure_folder(path: str):
    dbx = get_dbx()
    try:
        dbx.files_create_folder_v2(path)
    except dropbox.exceptions.ApiError as e:
        try:
            if e.error.is_path() and e.error.get_path().is_conflict():
                return
        except Exception:
            pass
        
        print("Dropbox API error: ", e)
        raise


def create_order_folder(order):

    dbx = get_dbx()
    ensure_folder(ORDERS_ROOT)
    path = f"{ORDERS_ROOT}/order_{order.id}"
    ensure_folder(path)

    translator_email = order.translator_id.email
    editor_email = order.editor_id.email
    manager_email = order.manager_id.email

    try:
        dbx.files_create_folder_v2(path)
    except dropbox.exceptions.ApiError as e:
        print("Folder already exists.")

    try:
        launch = dbx.sharing_share_folder(path, force_async=False)
        shared_folder_id = launch.get_complete().shared_folder_id

        dbx.sharing_add_folder_member(
            shared_folder_id,
            members=[
                AddMember(
                    member=MemberSelector.email(translator_email),
                    access_level=AccessLevel.editor
                ),
                AddMember(
                    member=MemberSelector.email(editor_email),
                    access_level=AccessLevel.editor
                ),
                AddMember(
                    member=MemberSelector.email(manager_email),
                    access_level=AccessLevel.editor
                )

            ],
            quiet=True
        )
        folder_link = None
        try:
            links = dbx.sharing_list_shared_links(path=path, direct_only=True).links
            if links:
                folder_link = links[0].url
            else:
                folder_link = dbx.sharing_create_shared_link_with_settings(path).url
        except dropbox.exceptions.ApiError:
            pass

        subject = f"Доступ до папки замовлення №{order.id}"
        message = (
            f"Вітаємо!\n\n"
            f"Вам надано доступ до папки Dropbox для замовлення №{order.id}.\n\n"
            f"Посилання на папку: {folder_link}\n\n"
            f"Якщо виникнуть запитання — звертайтеся до менеджера.\n\n"
            f"З повагою,\n"
            f"команда LingvoTeam."
        )
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [editor_email, manager_email], fail_silently=False)

    except dropbox.exceptions.ApiError as e:
        pass

    return path



def upload_file_to_order_folder(order, file, base_path, subdir="orders", create_only_dir=None):
    dbx = get_dbx()

    if create_only_dir:
        dir_path = f"{base_path}/{create_only_dir}".replace("//", "/")
        try:
            dbx.files_create_folder_v2(dir_path)
        except dropbox.exceptions.ApiError as e:
            print("Folder already exists.")
        return dir_path

    language_pair_val = (
        getattr(order, "language_pair_id", None)
        or getattr(order, "language_pair_id_id", None)
        or getattr(order, "language_pair", None)
    )

    language_pair_id = getattr(language_pair_val, "id", language_pair_val)

    source_language_id = None
    target_language_id = None

    if language_pair_id:
        lp_row = (
            LanguagePair.objects
            .filter(id=language_pair_id)
            .values("source_language_id", "target_language_id")
            .first()
        )
        if lp_row:
            source_language_id = lp_row.get("source_language_id")
            target_language_id = lp_row.get("target_language_id")

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

    target_slug = "tgt"
    if target_language_id:
        lang_row = (
            Language.objects
            .filter(id=target_language_id)
            .values("slug")
            .first()
        )
        if lang_row and lang_row.get("slug"):
            target_slug = lang_row["slug"]

    name, ext = os.path.splitext(file.name)

    if subdir == "source":
        filename = f"{name}_{source_slug}{ext}"
        full_path = f"{base_path}/{subdir}/{filename}"

    elif subdir == "target":
        source_suffix = f"_{source_slug}"

        if name.endswith(source_suffix):
            new_name = name[: -len(source_suffix)]
            filename = f"{new_name}_{target_slug}{ext}"
        else:
            filename = f"{name}_{target_slug}{ext}"

        full_path = f"{base_path}/{subdir}/{filename}"
    
    elif subdir == "final":
        source_suffix = f"_{source_slug}"
        target_suffix = f"_{target_slug}"
        if name.endswith(source_suffix):
            new_name = name[: -len(source_suffix)]
            filename = f"{new_name}_{target_slug}{ext}"
        elif name.endswith(target_suffix):
            new_name = name[: -len(target_suffix)]
            filename = f"{new_name}_{target_slug}{ext}"
        else:
            filename = f"{name}_final{ext}"
            
        full_path = f"{base_path}/{subdir}/{filename}"

    else:
        full_path = f"{base_path}/{subdir}/{file.name}"

    try:
        file.seek(0)
    except Exception as e:
        print("Error seeking file:", e)

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

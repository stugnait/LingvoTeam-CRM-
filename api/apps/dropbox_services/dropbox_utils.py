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

    # Явно створюємо підпапки одразу — щоб вони точно існували
    ensure_folder(f"{path}/source")
    ensure_folder(f"{path}/target")
    ensure_folder(f"{path}/final")

    # --- Збираємо email-и ---
    translator_email = order.translator_id.email if getattr(order, 'translator_id', None) else None
    editor_email = order.editor_id.email if getattr(order, 'editor_id', None) else None
    manager_accept_email = order.manager_accept_id.email if getattr(order, 'manager_accept_id', None) else None
    manager_delivery_email = order.manager_delivery_id.email if getattr(order, 'manager_delivery_id', None) else None

    # --- Sharing (не блокує повернення path якщо впаде) ---
    try:
        launch = dbx.sharing_share_folder(path, force_async=False)
        shared_folder_id = launch.get_complete().shared_folder_id

        dropbox_emails = set(filter(None, [
            translator_email, editor_email,
            manager_accept_email, manager_delivery_email,
        ]))

        members_to_add = [
            AddMember(member=MemberSelector.email(email), access_level=AccessLevel.editor)
            for email in dropbox_emails
        ]

        if members_to_add:
            dbx.sharing_add_folder_member(
                shared_folder_id,
                members=members_to_add,
                quiet=True
            )

        folder_link = None
        try:
            links = dbx.sharing_list_shared_links(path=path, direct_only=True).links
            folder_link = links[0].url if links else dbx.sharing_create_shared_link_with_settings(path).url
        except dropbox.exceptions.ApiError:
            pass

        mail_emails = list(filter(None, {editor_email, manager_accept_email, manager_delivery_email}))

        if mail_emails and folder_link:
            send_mail(
                subject=f"Доступ до папки замовлення №{order.id}",
                message=(
                    f"Вітаємо!\n\n"
                    f"Вам надано доступ до папки Dropbox для замовлення №{order.id}.\n\n"
                    f"Посилання на папку: {folder_link}\n\n"
                    f"Якщо виникнуть запитання — звертайтеся до керівника.\n\n"
                    f"З повагою,\nкоманда LingvoTeam."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=mail_emails,
                fail_silently=False,
            )

    except dropbox.exceptions.ApiError as e:
        # Sharing не критичний — папки вже створені, продовжуємо
        print(f"Dropbox Sharing Error (non-critical): {e}")

    return path


def upload_file_to_order_folder(order, file, base_path, subdir="orders", create_only_dir=None):
    dbx = get_dbx()

    if create_only_dir:
        dir_path = f"{base_path}/{create_only_dir}".replace("//", "/")
        ensure_folder(dir_path)
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
        lang_row = Language.objects.filter(id=source_language_id).values("slug").first()
        if lang_row and lang_row.get("slug"):
            source_slug = lang_row["slug"]

    target_slug = "tgt"
    if target_language_id:
        lang_row = Language.objects.filter(id=target_language_id).values("slug").first()
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


def move_file_from_target_to_final(from_path):
    if "/target/" not in from_path:
        raise ValueError("Path must contain '/target/'")

    dbx = get_dbx()

    base_dir = from_path.split("/target/", 1)[0]
    filename = from_path.split("/target/", 1)[1]

    final_dir = f"{base_dir}/final"
    ensure_folder(final_dir)

    name, ext = os.path.splitext(filename)

    if "_" in name:
        base_name = name.rsplit("_", 1)[0]
    else:
        base_name = name

    new_name = f"{base_name}_final{ext}"
    to_path = f"{final_dir}/{new_name}"

    dbx.files_move_v2(from_path, to_path, autorename=True)

    return to_path


def upload_user_avatar(user, file):
    dbx = get_dbx()

    base_path = "/avatars"
    user_path = f"{base_path}/user_{user.id}"

    ensure_folder(base_path)
    ensure_folder(user_path)

    name, ext = os.path.splitext(file.name)
    filename = f"avatar{ext}"
    full_path = f"{user_path}/{filename}"

    file.seek(0)
    content = file.read()

    dbx.files_upload(
        content,
        full_path,
        mode=dropbox.files.WriteMode.overwrite
    )

    try:
        links = dbx.sharing_list_shared_links(path=full_path, direct_only=True).links
        if links:
            url = links[0].url
        else:
            url = dbx.sharing_create_shared_link_with_settings(full_path).url

        url = url.replace("www.dropbox.com", "dl.dropboxusercontent.com")
        url = url.replace("?dl=0", "")

        print("FINAL AVATAR URL:", url)
        return url

    except Exception as e:
        print("ERROR generating link:", e)
        return None
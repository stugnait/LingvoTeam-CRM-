import re
import zipfile
import docx
import pypdf
import os
import subprocess
import tempfile
from io import BytesIO

try:
    import openpyxl
    HAS_OPENPYXL = True
except ImportError:
    HAS_OPENPYXL = False

try:
    import xlrd
    HAS_XLRD = True
except ImportError:
    HAS_XLRD = False

try:
    from pptx import Presentation
    HAS_PPTX = True
except ImportError:
    HAS_PPTX = False

def _safe_decode(data: bytes) -> str:
    """Автоматично розпізнає кодування (UTF-16 чи UTF-8) за допомогою BOM."""
    # Перевіряємо наявність маркерів UTF-16 (Byte Order Mark)
    if data.startswith(b'\xff\xfe') or data.startswith(b'\xfe\xff'):
        return data.decode('utf-16', errors='replace')
    # Перевіряємо наявність маркера UTF-8 BOM
    if data.startswith(b'\xef\xbb\xbf'):
        return data.decode('utf-8-sig', errors='replace')
    # За замовчуванням читаємо як звичайний UTF-8
    return data.decode('utf-8', errors='replace')


def _antiword_extract(file) -> str:
    """Витягує текст з .doc через antiword. Повертає рядок або ''."""
    try:
        file.seek(0)
        with tempfile.NamedTemporaryFile(suffix='.doc', delete=False) as tmp:
            tmp.write(file.read())
            tmp_path = tmp.name
        result = subprocess.run(
            ['antiword', tmp_path],
            capture_output=True, text=True, timeout=15
        )
        os.unlink(tmp_path)
        if result.returncode == 0:
            return result.stdout
    except Exception:
        pass
    return ''


def _extract_xliff_text(data: bytes) -> list[str]:
    """Витягує перекладний текст із XLIFF (Trados .sdlxliff / memoQ .mqxliff / generic .xliff)."""
    parts = []
    try:
        text = data.decode('utf-8', errors='replace')
        # <target> або <seg-source> — основний перекладний контент
        for tag in ('target', 'seg-source', 'source'):
            for match in re.finditer(rf'<{tag}[^>]*>(.*?)</{tag}>', text, re.DOTALL):
                inner = match.group(1)
                # Видаляємо вкладені XML-теги (<mrk>, <x/>, <g>, тощо)
                clean = re.sub(r'<[^>]+>', '', inner).strip()
                if clean:
                    parts.append(clean)
            if parts:
                break  # якщо знайшли в <target> — далі не шукаємо
    except Exception:
        pass
    return parts


def _extract_tmx_text(data: bytes) -> list[str]:
    """Витягує текст із TMX (Translation Memory Exchange)."""
    parts = []
    try:
        text = _safe_decode(data)  # ВИКОРИСТОВУЄМО НОВУ ФУНКЦІЮ
        # Додано [^>]* та re.IGNORECASE для більшої надійності
        for match in re.finditer(r'<seg[^>]*>(.*?)</seg>', text, re.IGNORECASE | re.DOTALL):
            clean = re.sub(r'<[^>]+>', '', match.group(1)).strip()
            if clean:
                parts.append(clean)
    except Exception:
        pass
    return parts


def _extract_ttx_text(data: bytes) -> list[str]:
    """Витягує текст із TTX (старий Trados TagEditor формат)."""
    parts = []
    try:
        text = data.decode('utf-8', errors='replace')
        for match in re.finditer(r'<Tu\b[^>]*>(.*?)</Tu>', text, re.DOTALL):
            clean = re.sub(r'<[^>]+>', '', match.group(1)).strip()
            if clean:
                parts.append(clean)
    except Exception:
        pass
    return parts


def _extract_mqxlz(file) -> tuple[list[str], int]:
    """
    Розпаковує .mqxlz (ZIP із .mqxliff всередині) та витягує текст.
    Повертає (text_parts, doc_count).
    """
    parts = []
    doc_count = 0
    try:
        file.seek(0)
        if zipfile.is_zipfile(file):
            file.seek(0)
            with zipfile.ZipFile(file) as zf:
                xliff_files = [n for n in zf.namelist() if n.endswith('.mqxliff')]
                doc_count = len(xliff_files)
                for name in xliff_files:
                    parts.extend(_extract_xliff_text(zf.read(name)))
    except Exception:
        pass
    return parts, doc_count


def _extract_sdltm(file) -> tuple[list[str], int]:
    """Безпечно витягує текст з .sdltm (SQLite), не блокуючи сервер."""
    parts = []
    pages = 0
    tmp_path = None

    try:
        file.seek(0)
        raw_data = file.read()
        if not raw_data:
            return [], 0

        # Створюємо тимчасовий файл
        import tempfile
        import os
        with tempfile.NamedTemporaryFile(suffix='.sdltm', delete=False) as tmp:
            tmp.write(raw_data)
            tmp_path = tmp.name

        import sqlite3
        # Підключаємося до бази
        conn = sqlite3.connect(tmp_path)
        cursor = conn.cursor()

        # Пробуємо отримати кількість Translation Units для "сторінок"
        try:
            cursor.execute("SELECT COUNT(*) FROM translation_units")
            pages = max(1, cursor.fetchone()[0] // 250)
        except Exception:
            pages = 1

        # Отримуємо список усіх таблиць
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [t[0] for t in cursor.fetchall()]

        # Шукаємо текст по всіх таблицях
        for table in tables:
            try:
                cursor.execute(f"SELECT * FROM {table}")
                for row in cursor.fetchall():
                    for item in row:
                        val = ""
                        if isinstance(item, str):
                            val = item
                        elif isinstance(item, bytes):
                            # Ігноруємо помилки кодування, щоб скрипт не падав на хешах/картинках
                            val = item.decode('utf-8', errors='ignore')

                        # Відбираємо лише фрагменти, схожі на реальний текст
                        if val and len(val) > 2:
                            clean = re.sub(r'<[^>]+>', ' ', val).strip()
                            if clean and len(clean) > 2 and not clean.isnumeric():
                                parts.append(clean)
            except Exception:
                continue  # Якщо таблиця закрита або бита - просто йдемо далі

        conn.close()

    except Exception as e:
        print(f"Critical SDLTm Error: {e}")
    finally:
        # НАЙГОЛОВНІШЕ: Завжди чистимо за собою, навіть якщо була помилка
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception:
                pass

    return parts, pages


def analyze_file_content(file):
    stats = {
        "chars_with_spaces": 0,
        "chars_no_spaces": 0,
        "pages": 0,
        "images": 0
    }

    file_name = file.name.lower()
    text_parts = []

    file.seek(0)

    try:

        # ------------------------------------------------------------------ #
        # WORD (.docx / .doc / .dotx / .dotm / .docm)
        # ------------------------------------------------------------------ #
        if file_name.endswith(('.docx', '.doc', '.dotx', '.dotm', '.docm')):
            try:
                file.seek(0)
                doc = docx.Document(file)
                text_parts.extend([p.text for p in doc.paragraphs])
                for table in doc.tables:
                    text_parts.extend([cell.text for row in table.rows for cell in row.cells])
                for section in doc.sections:
                    text_parts.extend([p.text for p in section.header.paragraphs])
                    text_parts.extend([p.text for p in section.footer.paragraphs])
            except Exception:
                pass

            # Сторінки та зображення через ZIP (для сучасних форматів)
            file.seek(0)
            try:
                if zipfile.is_zipfile(file):
                    file.seek(0)
                    with zipfile.ZipFile(file) as archive:
                        namelist = archive.namelist()
                        stats["images"] = sum(
                            1 for name in namelist if name.startswith('word/media/')
                        )
                        if 'docProps/app.xml' in namelist:
                            app_xml = archive.read('docProps/app.xml').decode('utf-8', errors='replace')
                            pages_match = re.search(r'<Pages>(\d+)</Pages>', app_xml)
                            if pages_match:
                                stats["pages"] = int(pages_match.group(1))
            except Exception:
                pass

            # Fallback для старого .doc — antiword
            if not text_parts and file_name.endswith('.doc'):
                extracted = _antiword_extract(file)
                if extracted.strip():
                    text_parts.append(extracted)

        # ------------------------------------------------------------------ #
        # PDF
        # ------------------------------------------------------------------ #
        elif file_name.endswith('.pdf'):
            try:
                file.seek(0)
                reader = pypdf.PdfReader(file)
                stats["pages"] = len(reader.pages)
                for page in reader.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text_parts.append(extracted)
                    if hasattr(page, 'images'):
                        stats["images"] += len(page.images)
            except Exception:
                pass

        elif file_name.endswith('.sdltm'):
            try:
                parts, pages = _extract_sdltm(file)
                if parts:
                    text_parts.extend(parts)
                if pages > 0:
                    stats["pages"] = max(stats.get("pages", 0), pages)
            except Exception as e:
                print(f"Помилка обробки SDLTm у головній функції: {e}")

        # ------------------------------------------------------------------ #
        # EXCEL сучасний (.xlsx / .xlsm / .xltx / .xltm)
        # ------------------------------------------------------------------ #
        elif file_name.endswith(('.xlsx', '.xlsm', '.xltx', '.xltm')):
            if HAS_OPENPYXL:
                try:
                    file.seek(0)
                    wb = openpyxl.load_workbook(file, read_only=True, data_only=True)
                    stats["pages"] = len(wb.sheetnames)
                    for sheet in wb.worksheets:
                        for row in sheet.iter_rows(values_only=True):
                            for cell in row:
                                if cell is not None:
                                    text_parts.append(str(cell))
                    wb.close()
                except Exception:
                    pass

            file.seek(0)
            try:
                if zipfile.is_zipfile(file):
                    file.seek(0)
                    with zipfile.ZipFile(file) as archive:
                        stats["images"] = sum(
                            1 for name in archive.namelist()
                            if name.startswith('xl/media/')
                        )
            except Exception:
                pass

        # ------------------------------------------------------------------ #
        # EXCEL старий (.xls)
        # ------------------------------------------------------------------ #
        elif file_name.endswith('.xls'):
            if HAS_XLRD:
                try:
                    file.seek(0)
                    raw = file.read()
                    wb = xlrd.open_workbook(file_contents=raw)
                    stats["pages"] = wb.nsheets
                    for sheet in wb.sheets():
                        for row_idx in range(sheet.nrows):
                            for col_idx in range(sheet.ncols):
                                val = sheet.cell(row_idx, col_idx).value
                                if val not in (None, ''):
                                    text_parts.append(str(val))
                except Exception:
                    pass

        # ------------------------------------------------------------------ #
        # POWERPOINT (.pptx / .pptm / .ppsx / .potx)
        # ------------------------------------------------------------------ #
        elif file_name.endswith(('.pptx', '.pptm', '.ppsx', '.potx')):
            if HAS_PPTX:
                try:
                    file.seek(0)
                    prs = Presentation(file)
                    stats["pages"] = len(prs.slides)

                    for slide in prs.slides:
                        for shape in slide.shapes:
                            if shape.has_text_frame:
                                for para in shape.text_frame.paragraphs:
                                    text = para.text.strip()
                                    if text:
                                        text_parts.append(text)
                            # Таблиці всередині слайду
                            if shape.has_table:
                                for row in shape.table.rows:
                                    for cell in row.cells:
                                        if cell.text.strip():
                                            text_parts.append(cell.text.strip())
                except Exception:
                    pass

            # Зображення через ZIP (ppt/media/)
            file.seek(0)
            try:
                if zipfile.is_zipfile(file):
                    file.seek(0)
                    with zipfile.ZipFile(file) as archive:
                        stats["images"] = sum(
                            1 for name in archive.namelist()
                            if name.startswith('ppt/media/')
                        )
            except Exception:
                pass

        # ------------------------------------------------------------------ #
        # TRADOS — .sdlxliff (білінгвальний XLIFF)
        # ------------------------------------------------------------------ #
        elif file_name.endswith('.sdlxliff'):
            try:
                file.seek(0)
                text_parts.extend(_extract_xliff_text(file.read()))
                stats["pages"] = 1
            except Exception:
                pass

        elif file_name.endswith(('.sdlppx', '.sdlproj', '.wsxz')):
            try:
                file.seek(0)
                if zipfile.is_zipfile(file):
                    file.seek(0)
                    with zipfile.ZipFile(file) as zf:
                        # 1. Шукаємо звичайні файли xliff/sdlxliff
                        xliff_files = [n for n in zf.namelist() if n.endswith(('.sdlxliff', '.xliff', '.xlf'))]

                        # 2. Шукаємо файли .xlz (це архіви всередині архіву .wsxz)
                        xlz_files = [n for n in zf.namelist() if n.endswith('.xlz')]

                        stats["pages"] = (len(xliff_files) + len(xlz_files)) or 1

                        # Читаємо звичайні файли
                        for name in xliff_files:
                            text_parts.extend(_extract_xliff_text(zf.read(name)))

                        # Читаємо .xlz (розпаковуємо внутрішній архів на льоту)
                        for name in xlz_files:
                            xlz_data = zf.read(name)
                            # Використовуємо BytesIO, щоб відкрити архів з пам'яті
                            with zipfile.ZipFile(BytesIO(xlz_data)) as inner_zf:
                                inner_xlf = [n for n in inner_zf.namelist() if n.endswith(('.xlf', '.xliff'))]
                                for inner_name in inner_xlf:
                                    text_parts.extend(_extract_xliff_text(inner_zf.read(inner_name)))
            except Exception:
                pass

        # ------------------------------------------------------------------ #
        # TRADOS / generic — .ttx (TagEditor)
        # ------------------------------------------------------------------ #
        elif file_name.endswith('.ttx'):
            try:
                file.seek(0)
                text_parts.extend(_extract_ttx_text(file.read()))
                stats["pages"] = 1
            except Exception:
                pass

        # ------------------------------------------------------------------ #
        # TMX — Translation Memory (.tmx) — Trados і memoQ обидва використовують
        # ------------------------------------------------------------------ #
        elif file_name.endswith('.tmx'):
            try:
                file.seek(0)
                raw_data = file.read()  # Читаємо байти один раз

                # 1. Витягуємо текст
                text_parts.extend(_extract_tmx_text(raw_data))

                # 2. Рахуємо сторінки (через безпечне декодування)
                content = _safe_decode(raw_data)
                tu_count = len(re.findall(r'<tu\b', content, re.IGNORECASE))
                stats["pages"] = max(1, tu_count // 250)
            except Exception:
                pass

        # ------------------------------------------------------------------ #
        # memoQ — .mqxliff (білінгвальний XLIFF memoQ)
        # ------------------------------------------------------------------ #
        elif file_name.endswith('.mqxliff'):
            try:
                file.seek(0)
                text_parts.extend(_extract_xliff_text(file.read()))
                stats["pages"] = 1
            except Exception:
                pass

        # ------------------------------------------------------------------ #
        # memoQ — .mqxlz (ZIP із .mqxliff всередині)
        # ------------------------------------------------------------------ #
        elif file_name.endswith('.mqxlz'):
            parts, doc_count = _extract_mqxlz(file)
            text_parts.extend(parts)
            stats["pages"] = max(1, doc_count)

        # ------------------------------------------------------------------ #
        # Generic XLIFF (.xliff / .xlf) — підтримується і Trados, і memoQ
        # ------------------------------------------------------------------ #
        elif file_name.endswith(('.xliff', '.xlf')):
            try:
                file.seek(0)
                text_parts.extend(_extract_xliff_text(file.read()))
                stats["pages"] = 1
            except Exception:
                pass

        # ------------------------------------------------------------------ #
        # Рахуємо символи
        # ------------------------------------------------------------------ #
        full_text = "\n".join(text_parts)
        cleaned_display = re.sub(r'[\ufeff\u200b]', '', full_text)
        stats["chars_with_spaces"] = len(cleaned_display)

        clean_text = re.sub(r'[\s\ufeff\u200b]+', '', full_text)
        stats["chars_no_spaces"] = len(clean_text)

    except Exception as e:
        print(f"Error analyzing file {file_name}: {e}")

    file.seek(0)
    return stats
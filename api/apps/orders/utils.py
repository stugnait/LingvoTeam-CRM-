import re
import zipfile
import tempfile
import os
import logging
import unicodedata
import xml.etree.ElementTree as ET
from io import BytesIO

# Вимикаємо спам у консоль від pdfminer (який працює під капотом pdfplumber)
logging.getLogger("pdfminer").setLevel(logging.ERROR)

logger = logging.getLogger(__name__)


# ============================================================= #
#  ВБУДОВАНИЙ АНАЛІЗАТОР ФАЙЛІВ (Pure Python: No Windows / COM)
# ============================================================= #

def _safe_decode(data: bytes) -> str:
    if data.startswith(b'\xff\xfe') or data.startswith(b'\xfe\xff'):
        return data.decode('utf-16', errors='replace')
    if data.startswith(b'\xef\xbb\xbf'):
        return data.decode('utf-8-sig', errors='replace')
    return data.decode('utf-8', errors='replace')


def normalize_text(text: str, collapse_spaces: bool = True) -> str:
    text = text.replace('\x02', '').replace('\x07', '').replace('\x08', '')
    text = text.replace('\x0b', '\n').replace('\x0c', '\n')
    text = text.replace('\x13', '').replace('\x14', '').replace('\x15', '')
    text = text.replace('\r', '').replace('\xad', '')
    text = text.replace('\ufeff', '').replace('\u200b', '')
    text = text.replace('\u200c', '').replace('\u200d', '')
    text = text.replace('\u2028', '\n').replace('\u2029', '\n')

    for sp in ('\t', '\xa0', '\u2000', '\u2001', '\u2002', '\u2003', '\u2004',
               '\u2005', '\u2006', '\u2007', '\u2008', '\u2009', '\u200a',
               '\u202f', '\u205f', '\u3000'):
        text = text.replace(sp, ' ')

    text = re.sub(r'\n{2,}', '\n', text)
    if collapse_spaces:
        text = re.sub(r' {2,}', ' ', text)
    return unicodedata.normalize('NFC', text).strip()


def _get_ooxml_metadata_stats(zf: zipfile.ZipFile, ext: str) -> dict:
    """ Читаємо офіційну статистику з app.xml для DOCX та PPTX """
    try:
        if 'docProps/app.xml' in zf.namelist():
            tree = ET.fromstring(zf.read('docProps/app.xml'))

            # Видаляємо простори імен для зручного пошуку
            for elem in tree.iter():
                if '}' in elem.tag:
                    elem.tag = elem.tag.split('}', 1)[1]

            cws = tree.find('.//CharactersWithSpaces')
            cns = tree.find('.//Characters')
            w = tree.find('.//Words')
            pages_tag = tree.find('.//Pages')
            slides_tag = tree.find('.//Slides')

            stats = {}
            if cws is not None and int(cws.text) > 0:
                stats["chars_with_spaces"] = int(cws.text)
            if cns is not None:
                stats["chars_no_spaces"] = int(cns.text)
            if w is not None:
                stats["words"] = int(w.text)

            # Дістаємо фізичні сторінки/слайди
            if ext in ['.pptx', '.ppsx', '.potx'] and slides_tag is not None:
                stats["physical_pages"] = int(slides_tag.text)
            elif pages_tag is not None:
                stats["physical_pages"] = int(pages_tag.text)

            # Повертаємо лише якщо хоч якісь символи чи слова знайшлися
            if stats.get("chars_with_spaces", 0) > 0 or stats.get("words", 0) > 0:
                return stats

    except Exception as e:
        logger.warning(f"Не вдалося прочитати метадані OOXML: {e}")
    return None


def _extract_xliff_text(data: bytes) -> list[str]:
    parts = []
    try:
        text = data.decode('utf-8', errors='replace')
        for tag in ('target', 'seg-source', 'source'):
            for match in re.finditer(rf'<{tag}[^>]*>(.*?)</{tag}>', text, re.DOTALL):
                clean = re.sub(r'<[^>]+>', '', match.group(1)).strip()
                if clean: parts.append(clean)
            if parts: break
    except:
        pass
    return parts


def _extract_tmx_text(data: bytes) -> list[str]:
    parts = []
    try:
        text = _safe_decode(data)
        for match in re.finditer(r'<seg[^>]*>(.*?)</seg>', text, re.IGNORECASE | re.DOTALL):
            clean = re.sub(r'<[^>]+>', '', match.group(1)).strip()
            if clean: parts.append(clean)
    except:
        pass
    return parts


def _extract_ttx_text(data: bytes) -> list[str]:
    parts = []
    try:
        text = data.decode('utf-8', errors='replace')
        for match in re.finditer(r'<Tu\b[^>]*>(.*?)</Tu>', text, re.DOTALL):
            clean = re.sub(r'<[^>]+>', '', match.group(1)).strip()
            if clean: parts.append(clean)
    except:
        pass
    return parts


def _extract_sdltm(file) -> tuple[list[str], int]:
    parts, pages, tmp_path = [], 0, None
    try:
        file.seek(0)
        raw_data = file.read()
        if not raw_data: return [], 0
        fd, tmp_path = tempfile.mkstemp(suffix='.sdltm')
        with os.fdopen(fd, 'wb') as tmp:
            tmp.write(raw_data)
        import sqlite3
        conn = sqlite3.connect(tmp_path)
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT COUNT(*) FROM translation_units")
            pages = max(1, cursor.fetchone()[0] // 250)
        except:
            pages = 1
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [t[0] for t in cursor.fetchall()]
        for table in tables:
            try:
                cursor.execute(f"SELECT * FROM {table}")
                for row in cursor.fetchall():
                    for item in row:
                        val = item if isinstance(item, str) else (
                            item.decode('utf-8', errors='ignore') if isinstance(item, bytes) else "")
                        if val and len(val) > 2:
                            clean = re.sub(r'<[^>]+>', ' ', val).strip()
                            if clean and len(clean) > 2 and not clean.isnumeric():
                                parts.append(clean)
            except:
                continue
        conn.close()
    except:
        pass
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except:
                pass
    return parts, pages


def analyze_docx_advanced(zf: zipfile.ZipFile) -> list[str]:
    """Точний парсер Word документів, що враховує параграфи, написи та колонтитули."""
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    text_parts = []

    target_xmls = [
        info.filename for info in zf.infolist()
        if info.filename.startswith('word/') and info.filename.endswith('.xml')
           and any(x in info.filename for x in ['document', 'header', 'footer', 'footnotes', 'endnotes'])
    ]

    for xml_file in target_xmls:
        try:
            tree = ET.fromstring(zf.read(xml_file))

            # Знаходимо всі параграфи
            for p in tree.findall('.//w:p', ns):
                p_text = []
                for t in p.findall('.//w:t', ns):
                    if t.text:
                        p_text.append(t.text)

                if p_text:
                    text_parts.append("".join(p_text))

        except Exception as e:
            logger.warning(f"Помилка парсингу {xml_file} всередині docx: {e}")
            continue

    return text_parts


def analyze_file_content(file) -> dict:
    stats = {"chars_with_spaces": 0, "chars_no_spaces": 0, "pages": 0, "images": 0, "words": 0}
    file_name = getattr(file, 'name', 'unknown_file').lower()
    file_ext = os.path.splitext(file_name)[1]
    text_parts = []
    stats_done = False

    try:
        file.seek(0)

        # -------------------------------------------------------- #
        # MICROSOFT WORD (Спочатку метадані, потім точний XML парсинг)
        # -------------------------------------------------------- #
        if file_ext in ['.docx', '.docm', '.dotx', '.dotm']:
            with zipfile.ZipFile(file) as zf:
                stats["images"] += sum(1 for n in zf.namelist() if n.startswith('word/media/'))

                meta_stats = _get_ooxml_metadata_stats(zf, file_ext)

                if meta_stats:
                    # Беремо правильний ключ "physical_pages"
                    stats["chars_with_spaces"] = meta_stats.get("chars_with_spaces", 0)
                    stats["chars_no_spaces"] = meta_stats.get("chars_no_spaces", 0)
                    stats["words"] = meta_stats.get("words", 0)
                    stats["pages"] = meta_stats.get("physical_pages", 0)
                    stats_done = True
                else:
                    text_parts = analyze_docx_advanced(zf)

        # -------------------------------------------------------- #
        # MICROSOFT POWERPOINT (Спочатку метадані, потім XML парсинг)
        # -------------------------------------------------------- #
        elif file_ext in ['.pptx', '.ppsx', '.potx']:
            with zipfile.ZipFile(file) as zf:
                stats["images"] += sum(1 for n in zf.namelist() if n.startswith('ppt/media/'))

                meta_stats = _get_ooxml_metadata_stats(zf, file_ext)
                if meta_stats and "chars_with_spaces" in meta_stats:
                    stats["chars_with_spaces"] = meta_stats.get("chars_with_spaces", 0)
                    stats["chars_no_spaces"] = meta_stats.get("chars_no_spaces", 0)
                    stats["words"] = meta_stats.get("words", 0)
                    stats["pages"] = meta_stats.get("physical_pages", 0)
                    stats_done = True
                else:
                    for info in zf.infolist():
                        if info.filename.startswith('ppt/slides/') and info.filename.endswith('.xml'):
                            tree = ET.fromstring(zf.read(info.filename))
                            for node in tree.iter():
                                if node.tag.endswith('}t') and node.text:
                                    text_parts.append(node.text)

        # -------------------------------------------------------- #
        # MICROSOFT EXCEL (Без COM-об'єктів)
        # -------------------------------------------------------- #
        elif file_ext in ['.xlsx', '.xlsm', '.xltx', '.xltm']:
            with zipfile.ZipFile(file) as zf:
                # В Excel весь унікальний текст зберігається в одному файлі
                if 'xl/sharedStrings.xml' in zf.namelist():
                    tree = ET.fromstring(zf.read('xl/sharedStrings.xml'))
                    for node in tree.iter():
                        if node.tag.endswith('}t') and node.text:
                            text_parts.append(node.text)

        elif file_ext in ['.doc', '.xls', '.ppt']:
            logger.warning(f"Старі бінарні формати ({file_name}) не підтримуються прямим парсингом.")

        # -------------------------------------------------------- #
        # PDF (pdfplumber - Висока точність)
        # -------------------------------------------------------- #
        elif file_ext == '.pdf':
            import pdfplumber
            file.seek(0)

            try:
                with pdfplumber.open(file) as pdf:
                    pdf_text_parts = []

                    for page in pdf.pages:
                        # x_tolerance та y_tolerance допомагають ідеально вловлювати пробіли
                        text = page.extract_text(x_tolerance=2, y_tolerance=3)
                        if text:
                            lines = [re.sub(r' {2,}', ' ', line.strip()) for line in text.split('\n') if line.strip()]
                            pdf_text_parts.append("\n".join(lines))

                        # Рахуємо картинки
                        stats["images"] += len(page.images)

            except Exception as e:
                logger.error(f"pdfplumber error: {e}")

            if pdf_text_parts:
                text_parts.append("\n".join(pdf_text_parts))

        # -------------------------------------------------------- #
        # SDLTM ТА ІНШІ ПЕРЕКЛАДАЦЬКІ ФОРМАТИ
        # -------------------------------------------------------- #
        elif file_ext == '.sdltm':
            parts, pages = _extract_sdltm(file)
            text_parts.extend(parts)
            if pages > 0: stats["pages"] = pages

        elif file_ext in ['.sdlxliff', '.mqxliff', '.xliff', '.xlf']:
            file.seek(0)
            text_parts.extend(_extract_xliff_text(file.read()))
            stats["pages"] = 1

        elif file_ext in ['.sdlppx', '.sdlproj', '.wsxz']:
            file.seek(0)
            if zipfile.is_zipfile(file):
                file.seek(0)
                with zipfile.ZipFile(file) as zf:
                    xliff_files = [n for n in zf.namelist() if n.endswith(('.sdlxliff', '.xliff', '.xlf'))]
                    xlz_files = [n for n in zf.namelist() if n.endswith('.xlz')]
                    stats["pages"] = (len(xliff_files) + len(xlz_files)) or 1
                    for name in xliff_files:
                        text_parts.extend(_extract_xliff_text(zf.read(name)))
                    for name in xlz_files:
                        with zipfile.ZipFile(BytesIO(zf.read(name))) as inner:
                            for iname in [n for n in inner.namelist() if n.endswith(('.xlf', '.xliff'))]:
                                text_parts.extend(_extract_xliff_text(inner.read(iname)))

        elif file_ext == '.ttx':
            file.seek(0)
            text_parts.extend(_extract_ttx_text(file.read()))
            stats["pages"] = 1

        elif file_ext == '.tmx':
            file.seek(0)
            raw = file.read()
            text_parts.extend(_extract_tmx_text(raw))
            tu_count = len(re.findall(r'<tu\b', _safe_decode(raw), re.IGNORECASE))
            stats["pages"] = max(1, tu_count // 250)

        # -------------------------------------------------------- #
        # ФІНАЛЬНИЙ ПІДРАХУНОК СИМВОЛІВ ТА СЛІВ (Якщо не було метаданих)
        # -------------------------------------------------------- #
        if not stats_done and text_parts:
            # З'єднуємо всі знайдені абзаци через перенос рядка
            full_text = "\n".join(p for p in text_parts if p)
            full_text_clean = normalize_text(full_text, collapse_spaces=False)

            # Символи без пробілів: видаляємо всі видимі й невидимі пробіли/переноси
            chars_no_spaces = len(re.sub(r'\s', '', full_text_clean))

            # Пробіли: рахуємо тільки фізичні пробіли ' '
            space_count = full_text_clean.count(' ')
            chars_with_spaces = chars_no_spaces + space_count

            # Рахуємо слова
            words = len(re.findall(r'\b\w+\b', full_text_clean, re.UNICODE))

            stats["chars_with_spaces"] = chars_with_spaces
            stats["chars_no_spaces"] = chars_no_spaces
            stats["words"] = words

        # Розраховуємо облікові (перекладацькі) сторінки за стандартом (1 сторінка = 1800 символів з пробілами)
        if stats["pages"] == 0 and stats["chars_with_spaces"] > 0:
            stats["pages"] = max(1, round(stats["chars_with_spaces"] / 1800))

    except Exception as e:
        logger.error(f"analyze_file_content error [{file_name}]: {e}")

    finally:
        file.seek(0)

    return stats
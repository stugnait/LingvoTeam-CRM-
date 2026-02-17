import re
import zipfile
import docx
import pypdf
import os
from io import BytesIO


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
        # --- DOCX ---
        if file_name.endswith('.docx'):
            try:
                doc = docx.Document(file)
                text_parts.extend([p.text for p in doc.paragraphs])
                for table in doc.tables:
                    text_parts.extend([cell.text for row in table.rows for cell in row.cells])
                # Headers/Footers
                for section in doc.sections:
                    text_parts.extend([p.text for p in section.header.paragraphs])
                    text_parts.extend([p.text for p in section.footer.paragraphs])
            except Exception:
                pass

                # ZIP analysis for pages/images inside docx
            file.seek(0)
            try:
                if zipfile.is_zipfile(file):
                    with zipfile.ZipFile(file) as archive:
                        namelist = archive.namelist()
                        stats["images"] = sum(1 for name in namelist if name.startswith('word/media/'))
                        if 'docProps/app.xml' in namelist:
                            app_xml = archive.read('docProps/app.xml').decode('utf-8')
                            pages_match = re.search(r'<Pages>(\d+)</Pages>', app_xml)
                            if pages_match:
                                stats["pages"] = int(pages_match.group(1))
            except Exception:
                pass

        # --- PDF ---
        elif file_name.endswith('.pdf'):
            try:
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

        # --- Рахуємо символи ---
        full_text = "\n".join(text_parts)
        # Видаляємо невидимі символи
        cleaned_display = re.sub(r'[\ufeff\u200b]', '', full_text)
        stats["chars_with_spaces"] = len(cleaned_display)

        clean_text = re.sub(r'[\s\ufeff\u200b]+', '', full_text)
        stats["chars_no_spaces"] = len(clean_text)

    except Exception as e:
        print(f"Error analyzing file {file_name}: {e}")

    # Повертаємо курсор на початок для подальшого використання (upload)
    file.seek(0)

    return stats
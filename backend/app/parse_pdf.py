"""
OCR-enabled PDF question parser with PyMuPDF and Tesseract
STABLE VERSION - Handles duplicate question numbers, precise question detection
"""
import fitz  # PyMuPDF
import re
import base64
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import io
import platform
from pathlib import Path
from PIL import Image

# Try to import pytesseract for OCR support
try:
    import pytesseract

    # Windows: Set Tesseract path explicitly
    if platform.system() == 'Windows':
        tesseract_paths = [
            Path(r'C:\Program Files\Tesseract-OCR\tesseract.exe'),
            Path(r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe'),
        ]

        for path in tesseract_paths:
            if path.exists():
                pytesseract.pytesseract.tesseract_cmd = str(path)
                print(f"✅ Tesseract found at: {path}")
                break
        else:
            print("⚠️  Tesseract executable not found in standard paths")

    OCR_AVAILABLE = True
    print("✅ pytesseract imported successfully")
except ImportError as e:
    OCR_AVAILABLE = False
    print(f"⚠️  pytesseract not available - OCR disabled: {e}")


@dataclass
class QuestionBlock:
    """Raw question block detected in PDF"""
    pdf_number: int  # Original number from PDF (can repeat)
    unique_id: int   # Globally unique ID
    page_num: int
    y0: float
    y1: float
    x0: float
    x1: float
    text_content: str


@dataclass
class Question:
    """Final question data structure"""
    id: int
    text: str
    options: List[Dict[str, str]]  # [{"label": "A", "value": "..."}, ...]
    answer: Optional[str]
    image_base64: Optional[str]


def fix_turkish_encoding(text: str) -> str:
    """Fix common Turkish character encoding issues"""
    replacements = {
        '˙I': 'İ', '˙i': 'İ', 'ˆI': 'İ',
        '¸s': 'ş', '¸S': 'Ş',
        '˘g': 'ğ', '˘G': 'Ğ',
        'ˆı': 'ı', 'ö': 'ö', 'ü': 'ü', 'ç': 'ç',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text


def extract_text_with_ocr(pix: fitz.Pixmap) -> str:
    """Extract text from pixmap using Tesseract OCR"""
    if not OCR_AVAILABLE:
        return ""

    try:
        img_data = pix.tobytes("png")
        img = Image.open(io.BytesIO(img_data))
        text = pytesseract.image_to_string(img, lang='tur+eng')
        return fix_turkish_encoding(text)
    except Exception as e:
        print(f"⚠️  OCR failed: {e}")
        return ""


def is_valid_question_start(line: str) -> Optional[int]:
    """
    Detect ONLY valid question starts - filters out tables, formulas, etc.

    Valid formats:
    - "Soru 1", "SORU 1.", "Soru 1)"
    - "1. Soru", "1) Soru"
    - "1)" followed by uppercase or question text
    - "1." followed by uppercase or question text

    Invalid (will be rejected):
    - "1. enerji", "1) birim", "1. grafik"
    - Table cells, formula numbers, list items

    Returns: question number if valid, None otherwise
    """
    line = line.strip()

    # Pattern 1: "Soru 12" or "SORU 12)" or "Soru 12."
    match = re.match(r'^(?:Soru|SORU)\s+(\d+)[.)]*\s*$', line, re.IGNORECASE)
    if match:
        return int(match.group(1))

    # Pattern 2: "12. Soru" or "12) Soru"
    match = re.match(r'^(\d+)[.)]\s+(?:Soru|SORU)\s*$', line, re.IGNORECASE)
    if match:
        return int(match.group(1))

    # Pattern 3: "12)" or "12." ONLY if followed by uppercase letter or long text
    # This prevents "1. enerji" or "1) birim" from being detected
    match = re.match(r'^(\d+)[.)]\s*([A-ZİĞÜŞÖÇ].*)?$', line)
    if match:
        num = int(match.group(1))
        after_text = match.group(2) or ""

        # Accept if:
        # - Line is just "12)" or "12."
        # - Or followed by uppercase letter
        # - Or followed by question-like words
        if not after_text or \
           after_text[0].isupper() or \
           any(word in after_text.lower() for word in ['hangi', 'nasıl', 'kaç', 'ne ', 'neden', 'niçin', 'kim', 'nerede']):
            return num

    return None


def find_all_question_blocks(pdf_document: fitz.Document) -> List[QuestionBlock]:
    """
    Find all question blocks across ALL pages
    Automatically handles duplicate question numbers by assigning unique IDs
    """
    all_blocks = []
    unique_id = 1  # Global unique ID counter

    for page_num in range(len(pdf_document)):
        page = pdf_document[page_num]
        text_blocks = sorted(page.get_text("blocks"), key=lambda b: (b[1], b[0]))

        page_rect = page.rect
        page_height = page_rect.height
        page_width = page_rect.width

        # Find question starts on this page
        question_markers = []

        for block in text_blocks:
            x0, y0, x1, y1, text, *_ = block
            text = fix_turkish_encoding(text.strip())

            # Check each line separately
            lines = text.split('\n')
            for line in lines:
                q_num = is_valid_question_start(line)
                if q_num:
                    question_markers.append({
                        'pdf_num': q_num,
                        'y0': y0,
                        'x0': x0,
                    })
                    break  # Only check first line of block

        # Sort by position (not number!)
        question_markers.sort(key=lambda q: (q['y0'], q['x0']))

        # Create question blocks with boundaries
        for i, marker in enumerate(question_markers):
            start_y = marker['y0']
            start_x = marker['x0']

            # Determine end Y (next question or page end)
            if i + 1 < len(question_markers):
                next_marker = question_markers[i + 1]
                end_y = next_marker['y0'] - 10  # Leave gap

                # Multi-column detection: if next question is at similar Y but different X
                if abs(next_marker['y0'] - start_y) < 100 and abs(next_marker['x0'] - start_x) > 100:
                    # Side-by-side: limit X to column
                    crop_x0 = 0
                    crop_x1 = (start_x + next_marker['x0']) / 2
                    end_y = page_height
                else:
                    # Single column
                    crop_x0 = 0
                    crop_x1 = page_width
            else:
                # Last question on page
                crop_x0 = 0
                crop_x1 = page_width
                end_y = page_height

            # Add padding
            crop_y0 = max(0, start_y - 5)
            crop_y1 = min(page_height, end_y)

            # Ensure minimum size
            if crop_y1 - crop_y0 < 50:
                crop_y1 = min(page_height, crop_y0 + 100)

            # Extract text content for this block
            text_content = extract_block_text(text_blocks, crop_y0, crop_y1)

            block = QuestionBlock(
                pdf_number=marker['pdf_num'],
                unique_id=unique_id,
                page_num=page_num + 1,
                y0=crop_y0,
                y1=crop_y1,
                x0=crop_x0,
                x1=crop_x1,
                text_content=text_content,
            )

            all_blocks.append(block)
            unique_id += 1  # Increment for next question

            print(f"📍 Detected Q{marker['pdf_num']} → ID={unique_id-1} "
                  f"(Page {page_num + 1}, Y={crop_y0:.0f}-{crop_y1:.0f})")

    return all_blocks


def extract_block_text(text_blocks: List[Tuple], y0: float, y1: float) -> str:
    """Extract text within Y boundaries"""
    text_parts = []

    for block in text_blocks:
        bx0, by0, bx1, by1, text, *_ = block

        # Include if block center is within range
        block_center_y = (by0 + by1) / 2
        if y0 <= block_center_y <= y1:
            text = fix_turkish_encoding(text.strip())

            # Skip headers/footers
            if text and not any(skip in text.lower() for skip in
                              ['sayfa', 'page', '©', 'www.', 'http', 'telif']):
                text_parts.append(text)

    return '\n'.join(text_parts)


def parse_options_from_text(text: str) -> Tuple[List[Dict[str, str]], Optional[str]]:
    """
    Extract options (A-E) and answer from text
    IMPORTANT: Filters out answer key lines to prevent them from appearing in options

    Returns: (options_list, answer_letter)
    """
    options = []
    answer = None

    lines = text.split('\n')

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # First, check if this is an answer key line (skip it for options)
        if re.search(r'(?:cevap|doğru|yanıt|answer|key|anahtar)', line, re.IGNORECASE):
            # Extract answer but don't add to options
            answer_match = re.search(r'\b([A-E])\b', line, re.IGNORECASE)
            if answer_match and not answer:
                answer = answer_match.group(1).upper()
            continue  # Skip this line for options

        # Parse option: "A) text" or "A. text" or "A text"
        option_match = re.match(r'^([A-E])[.):\s]\s*(.+)', line, re.IGNORECASE)
        if option_match:
            label = option_match.group(1).upper()
            value = option_match.group(2).strip()

            if value and len(value) > 2:  # Avoid junk
                # Check if option already exists (prevent duplicates)
                if not any(opt['label'] == label for opt in options):
                    options.append({
                        "label": label,
                        "value": value
                    })

    # Ensure options are in A-E order
    options.sort(key=lambda x: x['label'])

    # Only keep valid option sets (should be 4-5 options)
    if len(options) < 2 or len(options) > 5:
        print(f"⚠️  Unusual option count: {len(options)}")

    return options, answer


def crop_question_image(page: fitz.Page, block: QuestionBlock) -> Optional[str]:
    """Crop question area and return base64 PNG"""
    try:
        crop_rect = fitz.Rect(block.x0, block.y0, block.x1, block.y1)

        if not crop_rect.is_valid or crop_rect.is_empty:
            return None

        # Render at 2x for quality
        mat = fitz.Matrix(2.0, 2.0)
        pix = page.get_pixmap(matrix=mat, clip=crop_rect)

        # Convert to base64
        img_bytes = pix.tobytes("png")
        img_base64 = base64.b64encode(img_bytes).decode('utf-8')

        return f"data:image/png;base64,{img_base64}"

    except Exception as e:
        print(f"❌ Crop failed for ID={block.unique_id}: {e}")
        return None


def extract_clean_question_text(text_content: str) -> str:
    """
    Extract just the question text (remove choices, answer key, etc.)
    """
    lines = text_content.split('\n')
    question_lines = []

    for line in lines:
        line = line.strip()

        # Stop if we hit choices
        if re.match(r'^[A-E][.):]', line, re.IGNORECASE):
            break

        # Stop if we hit answer key
        if re.search(r'(?:cevap|doğru|yanıt|answer)', line, re.IGNORECASE):
            break

        # Add to question text
        if line and not re.match(r'^\d+[.)]?\s*$', line):  # Skip lone numbers
            question_lines.append(line)

    return ' '.join(question_lines)


def parse_pdf_with_ocr(pdf_bytes: bytes) -> List[Question]:
    """
    Main PDF parser - extracts questions with unique IDs
    Handles duplicate question numbers automatically
    """
    pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")

    # Step 1: Find all question blocks (with unique IDs)
    question_blocks = find_all_question_blocks(pdf_document)

    print(f"\n📊 Found {len(question_blocks)} total questions across {len(pdf_document)} pages")

    # Step 2: Process each block
    questions = []

    for block in question_blocks:
        try:
            page = pdf_document[block.page_num - 1]

            # Get text (use OCR if empty)
            text_content = block.text_content

            if not text_content.strip() and OCR_AVAILABLE:
                print(f"🔍 No text for ID={block.unique_id}, trying OCR...")
                crop_rect = fitz.Rect(block.x0, block.y0, block.x1, block.y1)
                mat = fitz.Matrix(2.0, 2.0)
                pix = page.get_pixmap(matrix=mat, clip=crop_rect)
                text_content = extract_text_with_ocr(pix)

                if text_content:
                    print(f"✅ OCR extracted {len(text_content)} chars")

            # Parse options and answer
            options, answer = parse_options_from_text(text_content)

            # Extract clean question text (without options)
            question_text = extract_clean_question_text(text_content)

            # Crop image
            image_base64 = crop_question_image(page, block)

            # Create question object
            question = Question(
                id=block.unique_id,
                text=question_text,
                options=options,
                answer=answer,
                image_base64=image_base64,
            )

            questions.append(question)

            print(f"✅ ID={block.unique_id} (PDF Q{block.pdf_number}): "
                  f"Text={len(question_text)} chars, "
                  f"Options={len(options)}, "
                  f"Answer={answer or 'None'}")

        except Exception as e:
            print(f"❌ Failed to process ID={block.unique_id}: {e}")
            continue

    pdf_document.close()

    print(f"\n✅ Successfully parsed {len(questions)}/{len(question_blocks)} questions")
    return questions


def questions_to_json(questions: List[Question]) -> Dict[str, Any]:
    """Convert questions to JSON format for API response"""
    return {
        "success": True,
        "total_questions": len(questions),
        "questions": [
            {
                "id": q.id,
                "text": q.text,
                "options": q.options,
                "answer": q.answer,
                "image_base64": q.image_base64,
            }
            for q in questions
        ]
    }

"""
OCR-enabled PDF question parser with PyMuPDF and Tesseract
Extracts questions with text, choices, answers, and images
"""
import fitz  # PyMuPDF
import re
import base64
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import io
from PIL import Image

# Try to import pytesseract for OCR support
try:
    import pytesseract
    import platform

    # Windows: Set Tesseract path explicitly
    if platform.system() == 'Windows':
        # Try common installation paths
        tesseract_paths = [
            r'C:\Program Files\Tesseract-OCR\tesseract.exe',
            r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
        ]
        for path in tesseract_paths:
            import os
            if os.path.exists(path):
                pytesseract.pytesseract.tesseract_cmd = path
                print(f"✅ Tesseract found at: {path}")
                break

    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    print("⚠️  pytesseract not available - OCR disabled")


@dataclass
class Question:
    """Question data structure"""
    question_number: int
    page_number: int
    text: str
    choices: List[str]
    answer: Optional[str]
    image_base64: Optional[str]
    crop_info: Dict[str, Any]


def fix_turkish_encoding(text: str) -> str:
    """Fix common Turkish character encoding issues in PDFs"""
    replacements = {
        '˙I': 'İ', '˙i': 'İ', 'ˆI': 'İ',
        '¸s': 'ş', '¸S': 'Ş',
        '˘g': 'ğ', '˘G': 'Ğ',
        'ˆı': 'ı',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text


def extract_text_with_ocr(pix: fitz.Pixmap) -> str:
    """
    Extract text from pixmap using OCR (Tesseract)
    Falls back to empty string if OCR not available
    """
    if not OCR_AVAILABLE:
        return ""

    try:
        # Convert pixmap to PIL Image
        img_data = pix.tobytes("png")
        img = Image.open(io.BytesIO(img_data))

        # Run OCR with Turkish language support
        text = pytesseract.image_to_string(img, lang='tur+eng')
        return fix_turkish_encoding(text)
    except Exception as e:
        print(f"⚠️  OCR failed: {e}")
        return ""


def find_question_numbers(text_blocks: List[Tuple]) -> Dict[int, Dict[str, float]]:
    """
    Find all question numbers and their positions in text blocks
    Returns: {question_number: {'x0': x, 'y0': y, 'x1': x, 'y1': y}}
    """
    question_positions = {}

    for block in text_blocks:
        x0, y0, x1, y1, text, *_ = block
        text = fix_turkish_encoding(text.strip())

        # Match "Soru 1)" or "1)" or "1."
        match = re.match(r'^(?:Soru\s+)?(\d+)[.)]', text)
        if match:
            q_num = int(match.group(1))
            if q_num not in question_positions:
                question_positions[q_num] = {
                    'x0': x0, 'y0': y0, 'x1': x1, 'y1': y1
                }

    return question_positions


def extract_question_text(text_blocks: List[Tuple], start_y: float, end_y: float) -> str:
    """
    Extract all text within Y range and clean it
    """
    text_parts = []

    for block in text_blocks:
        x0, y0, x1, y1, text, *_ = block

        # Check if block is within question range
        if y0 >= start_y and y0 < end_y:
            text = fix_turkish_encoding(text.strip())
            if text and not any(skip in text.lower() for skip in ['sayfa', 'page', '©', 'www.', 'http']):
                text_parts.append(text)

    return '\n'.join(text_parts)


def parse_choices_and_answer(text: str) -> Tuple[List[str], Optional[str]]:
    """
    Parse choices (A, B, C, D, E) and answer from text
    Returns: (choices_list, answer_letter)
    """
    choices = []
    answer = None

    lines = text.split('\n')

    for line in lines:
        line = line.strip()

        # Check for choice (A), B), C), etc.
        choice_match = re.match(r'^([A-E])[.)]?\s*(.+)', line, re.IGNORECASE)
        if choice_match:
            label = choice_match.group(1).upper()
            value = choice_match.group(2).strip()
            if value:
                choices.append(f"{label}) {value}")

        # Check for answer key
        if not answer and re.search(r'(?:cevap|doğru|yanıt|answer)', line, re.IGNORECASE):
            answer_match = re.search(r'\b([A-E])\b', line, re.IGNORECASE)
            if answer_match:
                answer = answer_match.group(1).upper()

    return choices, answer


def crop_question_image(page: fitz.Page, crop_y0: float, crop_y1: float,
                       crop_x0: float = 0, crop_x1: Optional[float] = None) -> Optional[str]:
    """
    Crop question area and return base64 encoded PNG
    """
    try:
        page_rect = page.rect
        if crop_x1 is None:
            crop_x1 = page_rect.width

        # Create crop rectangle
        crop_rect = fitz.Rect(crop_x0, crop_y0, crop_x1, crop_y1)

        # Validate
        if not crop_rect.is_valid or crop_rect.is_empty:
            return None

        # Render at 1.5x scale for quality
        mat = fitz.Matrix(1.5, 1.5)
        pix = page.get_pixmap(matrix=mat, clip=crop_rect)

        # Convert to base64
        img_bytes = pix.tobytes("png")
        img_base64 = base64.b64encode(img_bytes).decode('utf-8')

        return f"data:image/png;base64,{img_base64}"

    except Exception as e:
        print(f"❌ Crop failed: {e}")
        return None


def parse_pdf_with_ocr(pdf_bytes: bytes) -> List[Question]:
    """
    Main PDF parsing function with OCR support

    Returns list of Question objects with:
    - question_number
    - page_number
    - text (from PDF or OCR)
    - choices (A, B, C, D, E)
    - answer (correct choice)
    - image_base64 (cropped question image)
    """
    pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
    questions = []

    for page_num in range(len(pdf_document)):
        page = pdf_document[page_num]

        # Get text blocks sorted by position (Y, then X)
        text_blocks = sorted(page.get_text("blocks"), key=lambda b: (b[1], b[0]))

        # Find question positions
        question_positions = find_question_numbers(text_blocks)

        if not question_positions:
            continue

        # Sort questions by position (not number)
        sorted_questions = sorted(
            question_positions.items(),
            key=lambda item: (item[1]['y0'], item[1]['x0'])
        )

        page_rect = page.rect
        page_width = page_rect.width
        page_height = page_rect.height

        # Process each question
        for i, (q_num, q_pos) in enumerate(sorted_questions):
            try:
                start_y = q_pos['y0']
                start_x = q_pos['x0']

                # Determine end Y (next question or page end)
                if i + 1 < len(sorted_questions):
                    next_q_pos = sorted_questions[i + 1][1]
                    next_y = next_q_pos['y0']
                    next_x = next_q_pos['x0']

                    # Multi-column detection
                    if abs(next_y - start_y) < 50:
                        # Side-by-side layout
                        crop_x0 = 0
                        crop_x1 = next_x - 10
                        end_y = page_height
                    else:
                        # Single column
                        crop_x0 = 0
                        crop_x1 = page_width
                        end_y = next_y
                else:
                    # Last question
                    crop_x0 = 0
                    crop_x1 = page_width
                    end_y = page_height

                # Add padding
                crop_y0 = max(0, start_y - 10)
                crop_y1 = min(page_height, end_y + 10)

                # Ensure no overlap with next question
                if i + 1 < len(sorted_questions) and abs(sorted_questions[i + 1][1]['y0'] - start_y) >= 50:
                    crop_y1 = min(crop_y1, sorted_questions[i + 1][1]['y0'] - 5)

                # Validate dimensions
                if crop_y1 - crop_y0 < 10 or crop_x1 - crop_x0 < 10:
                    continue

                # Extract text from PDF
                question_text = extract_question_text(text_blocks, start_y, end_y)

                # Crop image
                image_base64 = crop_question_image(page, crop_y0, crop_y1, crop_x0, crop_x1)

                # If no text found, try OCR on cropped image
                if not question_text.strip() and image_base64 and OCR_AVAILABLE:
                    print(f"🔍 No text found for Q{q_num}, trying OCR...")
                    crop_rect = fitz.Rect(crop_x0, crop_y0, crop_x1, crop_y1)
                    mat = fitz.Matrix(1.5, 1.5)
                    pix = page.get_pixmap(matrix=mat, clip=crop_rect)
                    question_text = extract_text_with_ocr(pix)
                    if question_text:
                        print(f"✅ OCR extracted {len(question_text)} chars for Q{q_num}")

                # Parse choices and answer
                choices, answer = parse_choices_and_answer(question_text)

                # Create question object
                question = Question(
                    question_number=q_num,
                    page_number=page_num + 1,
                    text=question_text.strip(),
                    choices=choices,
                    answer=answer,
                    image_base64=image_base64,
                    crop_info={
                        'x0': crop_x0, 'y0': crop_y0,
                        'x1': crop_x1, 'y1': crop_y1,
                        'width': crop_x1 - crop_x0,
                        'height': crop_y1 - crop_y0,
                    }
                )

                questions.append(question)

                print(f"✅ Q{q_num} (Page {page_num + 1}): "
                      f"Text={len(question_text)} chars, "
                      f"Choices={len(choices)}, "
                      f"Answer={answer or 'None'}")

            except Exception as e:
                print(f"❌ Question {q_num} failed: {e}")
                continue

    pdf_document.close()
    return questions


def questions_to_json(questions: List[Question]) -> Dict[str, Any]:
    """
    Convert questions to JSON format for API response
    """
    return {
        "success": True,
        "total_questions": len(questions),
        "questions": [
            {
                "question_number": q.question_number,
                "page_number": q.page_number,
                "text": q.text,
                "choices": q.choices,
                "answer": q.answer,
                "image_base64": q.image_base64,
                "crop_info": q.crop_info,
            }
            for q in questions
        ]
    }

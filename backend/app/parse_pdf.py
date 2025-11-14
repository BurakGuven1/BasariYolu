"""
STABLE PDF Question Parser v2.0
Uses PyMuPDF geometric analysis + OCR hybrid system
Handles multi-column, complex layouts, multi-line options
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
from collections import defaultdict

# Tesseract OCR setup
try:
    import pytesseract

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

    OCR_AVAILABLE = True
    print("✅ pytesseract available")
except ImportError as e:
    OCR_AVAILABLE = False
    print(f"⚠️  OCR disabled: {e}")


@dataclass
class TextBlock:
    """Enhanced text block with geometric properties"""
    x0: float
    y0: float
    x1: float
    y1: float
    text: str
    font_size: float
    font_name: str
    is_bold: bool
    page_num: int

    @property
    def width(self) -> float:
        return self.x1 - self.x0

    @property
    def height(self) -> float:
        return self.y1 - self.y0

    @property
    def center_x(self) -> float:
        return (self.x0 + self.x1) / 2

    @property
    def center_y(self) -> float:
        return (self.y0 + self.y1) / 2


@dataclass
class QuestionBlock:
    """Question boundary with all text blocks"""
    unique_id: int
    pdf_number: Optional[int]
    page_num: int
    x0: float
    y0: float
    x1: float
    y1: float
    text_blocks: List[TextBlock]
    column_index: int = 0


@dataclass
class Question:
    """Final question structure"""
    id: int
    text: str
    stem: str  # Bold question root/core
    options: List[Dict[str, str]]
    answer: Optional[str]
    image_base64: Optional[str]
    subject: Optional[str] = None  # Will be filled by OpenAI
    topic: Optional[str] = None
    subtopic: Optional[str] = None
    difficulty: Optional[str] = None


def fix_turkish_encoding(text: str) -> str:
    """
    Fix Turkish character encoding issues - COMPREHENSIVE version
    Handles all common PDF encoding problems with Turkish characters
    """
    replacements = {
        # İ variations
        '˙I': 'İ', '˙i': 'İ', 'ˆI': 'İ', 'I˙': 'İ', 'i˙': 'İ',
        '¨I': 'İ', '´I': 'İ', 'Ì': 'İ', 'Í': 'İ',

        # ı variations
        'ˆı': 'ı', '±': 'ı', 'ı': 'ı',

        # ş variations
        '¸s': 'ş', '¸S': 'Ş', 'ș': 'ş', 'Ș': 'Ş',
        's¸': 'ş', 'S¸': 'Ş', 'ş': 'ş', 'Ş': 'Ş',

        # ğ variations
        '˘g': 'ğ', '˘G': 'Ğ', 'ǧ': 'ğ', 'Ǧ': 'Ğ',
        'g˘': 'ğ', 'G˘': 'Ğ', 'ğ': 'ğ', 'Ğ': 'Ğ',

        # ç variations
        '¸c': 'ç', '¸C': 'Ç', 'ć': 'ç', 'Ć': 'Ç',
        'c¸': 'ç', 'C¸': 'Ç', 'ç': 'ç', 'Ç': 'Ç',

        # ö variations
        '¨o': 'ö', '¨O': 'Ö', 'ó': 'ö', 'Ó': 'Ö',
        'o¨': 'ö', 'O¨': 'Ö', 'ö': 'ö', 'Ö': 'Ö',

        # ü variations
        '¨u': 'ü', '¨U': 'Ü', 'ú': 'ü', 'Ú': 'Ü',
        'u¨': 'ü', 'U¨': 'Ü', 'ü': 'ü', 'Ü': 'Ü',

        # Common ligatures
        'ﬁ': 'fi', 'ﬂ': 'fl', 'ﬀ': 'ff',

        # Unicode combining characters
        '\u0307': '',  # Combining dot above
        '\u0306': '',  # Combining breve
        '\u0327': '',  # Combining cedilla
        '\u0308': '',  # Combining diaeresis

        # Sinhala/other strange replacements (common in broken PDFs)
        'ඈ': 'i',  # This is what causes "Şekඈl"
        'ල': 'l',
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    # Normalize whitespace
    text = ' '.join(text.split())

    return text


def extract_text_blocks_with_fonts(page: fitz.Page) -> List[TextBlock]:
    """
    Extract text blocks with font information using PyMuPDF's dict mode
    This gives us accurate font size, style, and positioning
    """
    blocks = []
    text_dict = page.get_text("dict")
    page_num = page.number + 1

    for block in text_dict.get("blocks", []):
        if block.get("type") != 0:  # Skip image blocks
            continue

        for line in block.get("lines", []):
            line_text = ""
            line_bbox = line.get("bbox", (0, 0, 0, 0))

            # Aggregate spans (font segments) in this line
            font_sizes = []
            font_names = []

            for span in line.get("spans", []):
                span_text = span.get("text", "")
                line_text += span_text

                font_size = span.get("size", 12)
                font_name = span.get("font", "")

                font_sizes.append(font_size)
                font_names.append(font_name)

            line_text = fix_turkish_encoding(line_text.strip())

            if not line_text:
                continue

            # Use average font size
            avg_font_size = sum(font_sizes) / len(font_sizes) if font_sizes else 12
            primary_font = font_names[0] if font_names else ""
            is_bold = "bold" in primary_font.lower() or "black" in primary_font.lower()

            text_block = TextBlock(
                x0=line_bbox[0],
                y0=line_bbox[1],
                x1=line_bbox[2],
                y1=line_bbox[3],
                text=line_text,
                font_size=avg_font_size,
                font_name=primary_font,
                is_bold=is_bold,
                page_num=page_num,
            )

            blocks.append(text_block)

    return blocks


def detect_columns(blocks: List[TextBlock], page_width: float) -> List[Tuple[float, float]]:
    """
    Detect columns in page using X-axis clustering - ENHANCED
    Returns: list of (x_start, x_end) for each column
    Uses improved gap detection to handle multi-column layouts
    """
    if not blocks:
        return [(0, page_width)]

    # Get unique X positions (left edges) of blocks
    x_positions = sorted(set(b.x0 for b in blocks))

    if len(x_positions) < 2:
        return [(0, page_width)]

    # Find significant gaps (potential column separators)
    # Use larger threshold for better separation: 80pt (about 1 inch)
    gaps = []
    for i in range(1, len(x_positions)):
        gap_size = x_positions[i] - x_positions[i-1]
        if gap_size > 80:  # Increased from 50pt to 80pt
            gaps.append({
                'position': (x_positions[i-1] + x_positions[i]) / 2,
                'size': gap_size,
                'before': x_positions[i-1],
                'after': x_positions[i],
            })

    # If no significant gaps, it's a single column
    if not gaps:
        return [(0, page_width)]

    # Build columns based on gaps
    columns = []
    col_start = 0

    for gap in gaps:
        col_end = gap['position']
        # Ensure column has minimum width (100pt)
        if col_end - col_start > 100:
            columns.append((col_start, col_end))
            col_start = col_end

    # Last column
    if page_width - col_start > 100:
        columns.append((col_start, page_width))

    # If no valid columns, return full width
    if len(columns) == 0:
        columns = [(0, page_width)]

    print(f"   🔲 Detected {len(columns)} column(s): {[(f'{c[0]:.0f}-{c[1]:.0f}') for c in columns]}")
    return columns


def is_question_start_block(block: TextBlock) -> Optional[int]:
    """
    Detect if block is a question start using multiple signals - ENHANCED
    1. Regex pattern (multiple formats)
    2. Font size (usually larger)
    3. Bold style
    4. Position (usually left-aligned)
    """
    text = block.text.strip()

    # Skip very long text (likely not a question number)
    if len(text) > 100:
        return None

    # Pattern 1: "Soru 12" or "SORU 12"
    match = re.match(r'^(?:Soru|SORU|Question)\s+(\d+)', text, re.IGNORECASE)
    if match:
        return int(match.group(1))

    # Pattern 2: "12. Soru"
    match = re.match(r'^(\d+)[.)]\s+(?:Soru|SORU|Question)', text, re.IGNORECASE)
    if match:
        return int(match.group(1))

    # Pattern 3: Just "12)" or "12." at line start
    # More lenient: accept if it's a reasonable question number (1-200)
    match = re.match(r'^(\d+)[.)]\s*(.*)$', text)
    if match:
        num = int(match.group(1))
        after = match.group(2).strip()

        # Only accept question numbers in reasonable range (1-200)
        if num < 1 or num > 200:
            return None

        # Accept if:
        # - Just number (e.g., "12)")
        # - Followed by uppercase letter
        # - Followed by question words
        # - Block is bold (question numbers are often bold)
        # - Font size larger than average (>= 11pt)
        if not after or \
           (after and len(after) > 0 and after[0].isupper()) or \
           any(word in after.lower() for word in ['hangi', 'nasıl', 'kaç', 'ne ', 'neden', 'kim', 'nerede', 'aşağıdaki', 'yukarıdaki']) or \
           block.is_bold or \
           block.font_size >= 11:
            return num

    # Pattern 4: "12-" or "12 -" (less common but sometimes used)
    match = re.match(r'^(\d+)\s*[-–—]\s*(.*)$', text)
    if match:
        num = int(match.group(1))
        if 1 <= num <= 200:
            return num

    return None


def group_blocks_by_column(blocks: List[TextBlock], columns: List[Tuple[float, float]]) -> Dict[int, List[TextBlock]]:
    """Group text blocks by column"""
    column_blocks = defaultdict(list)

    for block in blocks:
        # Find which column this block belongs to
        for col_idx, (col_start, col_end) in enumerate(columns):
            if col_start <= block.center_x < col_end:
                column_blocks[col_idx].append(block)
                break

    return column_blocks


def find_question_blocks(page: fitz.Page, page_num: int, unique_id_start: int) -> List[QuestionBlock]:
    """
    Find all question blocks on a page using:
    - Column detection
    - Font-based segmentation
    - Geometric clustering
    """
    blocks = extract_text_blocks_with_fonts(page)

    if not blocks:
        return []

    page_rect = page.rect
    page_width = page_rect.width
    page_height = page_rect.height

    # Detect columns
    columns = detect_columns(blocks, page_width)

    # Group blocks by column
    column_groups = group_blocks_by_column(blocks, columns)

    question_blocks = []
    unique_id = unique_id_start

    # Process each column separately
    for col_idx, col_blocks in sorted(column_groups.items()):
        # Sort by Y position within column
        col_blocks.sort(key=lambda b: b.y0)

        # Find question starts in this column
        question_starts = []
        for block in col_blocks:
            q_num = is_question_start_block(block)
            if q_num is not None:
                question_starts.append({
                    'block': block,
                    'pdf_num': q_num,
                    'y0': block.y0,
                })

        if not question_starts:
            continue

        print(f"   📍 Column {col_idx}: Found {len(question_starts)} questions")

        # Create question blocks with boundaries
        col_x_start, col_x_end = columns[col_idx]

        for i, q_start in enumerate(question_starts):
            start_y = q_start['y0']

            # End Y is STRICTLY next question start (not bottom of next question)
            # This ensures each crop contains ONLY one question
            if i + 1 < len(question_starts):
                end_y = question_starts[i + 1]['y0'] - 3  # Small gap to prevent overlap
            else:
                end_y = page_height

            # Collect all blocks in this Y range STRICTLY
            # CRITICAL: Use STRICT inequality to prevent including next question's first line
            q_text_blocks = [
                b for b in col_blocks
                if start_y <= b.y0 < end_y  # Strict < instead of <=
            ]

            if not q_text_blocks:
                continue

            # Calculate TIGHT bounding box using ONLY this question's blocks
            # This prevents capturing adjacent questions in crop
            min_x = min(b.x0 for b in q_text_blocks)
            max_x = max(b.x1 for b in q_text_blocks)
            min_y = min(b.y0 for b in q_text_blocks)
            max_y = max(b.y1 for b in q_text_blocks)

            # Add minimal padding (5pt) to avoid cutting text
            # Keep padding small to prevent capturing adjacent questions
            crop_x0 = max(0, min_x - 5)
            crop_x1 = min(page_width, max_x + 5)
            crop_y0 = max(0, min_y - 5)
            crop_y1 = min(page_height, max_y + 5)

            # ADDITIONAL CHECK: Ensure crop doesn't extend into column boundaries
            # This prevents horizontal bleed into adjacent columns
            col_x_min, col_x_max = columns[col_idx]
            crop_x0 = max(crop_x0, col_x_min)
            crop_x1 = min(crop_x1, col_x_max)

            question_block = QuestionBlock(
                unique_id=unique_id,
                pdf_number=q_start['pdf_num'],
                page_num=page_num,
                x0=crop_x0,
                y0=crop_y0,
                x1=crop_x1,
                y1=crop_y1,
                text_blocks=q_text_blocks,
                column_index=col_idx,
            )

            question_blocks.append(question_block)
            unique_id += 1

            print(f"      ✅ Q{q_start['pdf_num']} → ID={question_block.unique_id} "
                  f"(Y={crop_y0:.0f}-{crop_y1:.0f}, blocks={len(q_text_blocks)})")

    return question_blocks


def extract_options_with_clustering(text_blocks: List[TextBlock]) -> List[Dict[str, str]]:
    """
    Extract options using X-axis alignment clustering - ENHANCED
    Handles ALL option formats: A) A. A: A- and multi-line options
    FILTERS OUT placeholder text like "ŞIK A", "ŞIK B"
    """
    if not text_blocks:
        return []

    # Step 1: Find option start markers (A-E) with STRICT pattern
    option_starts = []

    for block in text_blocks:
        text = block.text.strip()

        # STRICT pattern: Must have A-E followed by delimiter
        # Matches: "A)" "A." "A:" "A-" "A )" (with space)
        match = re.match(r'^([A-E])\s*([.):\-])\s*(.*)$', text, re.IGNORECASE)
        if match:
            label = match.group(1).upper()
            delimiter = match.group(2)
            content = match.group(3).strip()

            # FILTER OUT placeholder text
            # Skip if content is just "ŞIK X", "Şık X", "X şıkkı", etc.
            content_lower = content.lower()
            is_placeholder = (
                not content or  # Empty
                content_lower.startswith('şık') or  # "Şık A"
                content_lower.endswith('şıkkı') or  # "A şıkkı"
                content_lower.startswith('sik') or  # Encoding issue "SIK A"
                content_lower == label.lower() or  # Just "a" or "A"
                re.match(r'^(şık|sik|seçenek|option)\s*[a-e]?$', content_lower)  # "Şık", "Seçenek A"
            )

            if is_placeholder:
                continue  # Skip this option start

            # Accept if it has a delimiter and real content
            option_starts.append({
                'label': label,
                'block': block,
                'x0': block.x0,
                'y0': block.y0,
                'has_content': len(content) > 0,
            })

    if not option_starts:
        return []

    # Step 2: Remove duplicate labels (keep first occurrence)
    seen_labels = set()
    unique_option_starts = []
    for opt in option_starts:
        if opt['label'] not in seen_labels:
            seen_labels.add(opt['label'])
            unique_option_starts.append(opt)

    option_starts = unique_option_starts

    # If we have less than 4 options, it's likely incomplete - be more aggressive
    if len(option_starts) < 4:
        print(f"      ⚠️  Only {len(option_starts)} option starts found - searching more broadly")

        # Second pass: look for ANY line starting with A-E (even without delimiter)
        for block in text_blocks:
            text = block.text.strip()
            if len(text) > 0 and text[0].upper() in 'ABCDE':
                label = text[0].upper()
                if label not in seen_labels:
                    # Check if this looks like an option
                    # (not part of regular text like "Aşağıdaki")
                    if len(text) < 50 and not any(word in text.lower() for word in ['aşağıdaki', 'yukarıdaki']):
                        option_starts.append({
                            'label': label,
                            'block': block,
                            'x0': block.x0,
                            'y0': block.y0,
                            'has_content': True,
                        })
                        seen_labels.add(label)

    # Step 3: Calculate average X position for option alignment
    option_x_positions = [opt['x0'] for opt in option_starts]
    avg_option_x = sum(option_x_positions) / len(option_x_positions) if option_x_positions else 0

    # Step 4: Sort by Y position
    option_starts.sort(key=lambda opt: opt['y0'])

    # Step 5: For each option, collect ALL text blocks in its Y range
    options = []

    for i, opt_start in enumerate(option_starts):
        label = opt_start['label']
        start_y = opt_start['y0']

        # Determine end Y (next option's Y or end of all blocks)
        if i + 1 < len(option_starts):
            end_y = option_starts[i + 1]['y0'] - 2  # Small gap
        else:
            end_y = max(b.y1 for b in text_blocks) + 10

        # Collect all blocks in this Y range with X alignment ±30pt (increased tolerance)
        option_lines = []

        for block in text_blocks:
            # Check if block is in Y range
            if start_y <= block.y0 < end_y:
                # Check X alignment (±30pt tolerance)
                x_diff = abs(block.x0 - avg_option_x)
                if x_diff <= 30:
                    option_lines.append((block.y0, block.text))

        # Sort by Y to maintain reading order
        option_lines.sort(key=lambda x: x[0])
        option_text_parts = [text for _, text in option_lines]

        # Join with space
        full_text = ' '.join(option_text_parts)

        # Clean: Remove option label prefix (A) A.) etc.)
        full_text = re.sub(r'^[A-E]\s*[.):\-]?\s*', '', full_text, flags=re.IGNORECASE).strip()

        # Apply Turkish encoding fixes
        full_text = fix_turkish_encoding(full_text)

        # CRITICAL: Filter out placeholder/meaningless text
        full_text_lower = full_text.lower()
        is_meaningless = (
            len(full_text) < 3 or  # Too short
            full_text_lower.startswith('şık') or  # "Şık A", "Şık B"
            full_text_lower.startswith('sik') or  # Encoding issue
            full_text_lower.endswith('şıkkı') or  # "A şıkkı"
            re.match(r'^(şık|sik|seçenek|option)\s*[a-e]?$', full_text_lower) or  # Just "Şık"
            full_text_lower == label.lower()  # Just the label itself
        )

        # Only add if has meaningful content
        if full_text and not is_meaningless:
            options.append({
                'label': label,
                'value': full_text,
            })

    # Step 6: Ensure A-E order
    options.sort(key=lambda x: x['label'])

    # Step 7: Log results
    print(f"      📋 Extracted {len(options)} options: {[o['label'] for o in options]}")

    return options


def extract_answer_key_from_pdf(pdf_document: fitz.Document) -> Dict[str, Dict[int, str]]:
    """
    Extract answer key from last pages of PDF
    Format: CEVAP ANAHTARI or answer key sections
    Returns: {"TÜRKÇE": {1: "B", 2: "A", ...}, "MATEMATİK": {...}}
    """
    answer_keys = {}
    current_subject = None

    # Check last 3 pages for answer key
    total_pages = len(pdf_document)
    start_page = max(0, total_pages - 3)

    for page_num in range(start_page, total_pages):
        page = pdf_document[page_num]
        text = page.get_text("text")
        text = fix_turkish_encoding(text)

        # Check if this page contains answer key
        if not re.search(r'(?:CEVAP|ANAHTAR|ANSWER|KEY)', text, re.IGNORECASE):
            continue

        print(f"   📝 Found answer key on page {page_num + 1}")

        # Split into lines
        lines = text.split('\n')

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Check if this is a subject header
            # Common subjects: TÜRKÇE, MATEMATİK, FEN, SOSYAL, İNGİLİZCE
            if re.match(r'^(TÜRKÇE|MATEMATİK|FEN|SOSYAL|İNGİLİZCE|TURKISH|MATH|SCIENCE)', line, re.IGNORECASE):
                current_subject = line.upper()
                if current_subject not in answer_keys:
                    answer_keys[current_subject] = {}
                print(f"      📚 Subject: {current_subject}")
                continue

            # Parse answer lines: "1. B  2. A  3. C  4. D  5. E"
            # Pattern: number dot/paren followed by letter
            matches = re.findall(r'(\d+)\s*[.)]\s*([A-E])', line, re.IGNORECASE)

            if matches and current_subject:
                for q_num_str, answer_letter in matches:
                    q_num = int(q_num_str)
                    answer_keys[current_subject][q_num] = answer_letter.upper()

    # Log what we found
    for subject, answers in answer_keys.items():
        print(f"      ✅ {subject}: {len(answers)} answers")

    return answer_keys


def extract_question_stem(text_blocks: List[TextBlock]) -> Tuple[str, str]:
    """
    Extract question text and separate the bold "stem" (question root)
    Returns: (full_text, bold_stem)
    Bold text is typically the core question being asked
    """
    regular_parts = []
    bold_parts = []

    for block in text_blocks:
        if block.is_bold:
            bold_parts.append(block.text)
        else:
            regular_parts.append(block.text)

    full_text = ' '.join(regular_parts + bold_parts)
    bold_stem = ' '.join(bold_parts)

    full_text = fix_turkish_encoding(full_text)
    bold_stem = fix_turkish_encoding(bold_stem)

    return full_text.strip(), bold_stem.strip()


def extract_question_text(text_blocks: List[TextBlock], options: List[Dict[str, str]]) -> str:
    """
    Extract clean question text (before options start) - IMPROVED
    IMPORTANT: Don't cut off at "Aşağıdakilerden hangisi A)" - that's part of question!
    Only stop at REAL option starts with substantial content
    """
    if not text_blocks:
        return ""

    # Step 1: Find where options REALLY start
    # We need to be very careful not to mistake question text for options
    option_start_y = None

    # If we already extracted options, use their labels to find start
    if options:
        # Find first option label in blocks
        first_option_label = options[0]['label']

        for block in text_blocks:
            text = block.text.strip()

            # Look for this specific option label with content
            # Pattern: "A) some text" or "A. some text" with real content
            pattern = f'^{first_option_label}\\s*[.):\\-]\\s+(.{{5,}})'
            match = re.match(pattern, text, re.IGNORECASE)

            if match:
                content = match.group(1).strip()
                # Must have substantial content (not just "doğru", "yanlış", single word)
                words = content.split()
                if len(words) >= 2 or len(content) > 10:
                    option_start_y = block.y0
                    break

    # Step 2: If we didn't find option start, look for first clear option marker
    if option_start_y is None:
        for block in text_blocks:
            text = block.text.strip()

            # Check for clear option pattern with content
            match = re.match(r'^([A-E])\s*[.):\-]\s+(.+)$', text, re.IGNORECASE)
            if match:
                label = match.group(1).upper()
                content = match.group(2).strip()

                # Must be option A and have real content
                if label == 'A' and len(content) > 8:
                    # Double-check: not part of question like "Aşağıdakilerden A)"
                    # Real options usually don't have question words before them
                    prev_blocks = [b for b in text_blocks if b.y0 < block.y0]
                    if prev_blocks:
                        last_prev = prev_blocks[-1].text.lower()
                        # If previous block has question indicators, this might not be option
                        if any(word in last_prev for word in ['hangisi', 'aşağıdaki', 'hangi', 'which']):
                            continue

                    option_start_y = block.y0
                    break

    # Step 3: Collect question text (everything before options)
    question_parts = []

    for block in text_blocks:
        # Stop at option start
        if option_start_y and block.y0 >= option_start_y:
            break

        text = block.text.strip()

        # Skip empty
        if not text:
            continue

        # Skip answer key lines
        if re.search(r'(?:cevap|doğru\s+cevap|yanıt|answer\s*key)', text, re.IGNORECASE):
            continue

        # Skip lone question numbers
        if re.match(r'^\d+[.)]?\s*$', text):
            continue

        # Skip page numbers, footers
        if re.match(r'^(sayfa|page)\s*\d+', text, re.IGNORECASE):
            continue

        # Add to question
        question_parts.append(text)

    # Step 4: Join and clean
    question_text = ' '.join(question_parts)

    # Apply Turkish encoding fixes
    question_text = fix_turkish_encoding(question_text)

    # Normalize whitespace
    question_text = ' '.join(question_text.split())

    return question_text.strip()


def extract_with_ocr_hybrid(page: fitz.Page, crop_rect: fitz.Rect, text_blocks: List[TextBlock]) -> str:
    """
    Hybrid text extraction: PyMuPDF + OCR merge
    Only use OCR when PyMuPDF text is insufficient
    """
    # First: Use PyMuPDF text
    pymupdf_text = ' '.join(b.text for b in text_blocks)

    # Check if text is good enough
    if len(pymupdf_text.strip()) > 20:
        return pymupdf_text

    # Text is too short/empty - try OCR
    if not OCR_AVAILABLE:
        return pymupdf_text

    try:
        mat = fitz.Matrix(2.0, 2.0)
        pix = page.get_pixmap(matrix=mat, clip=crop_rect)

        img_data = pix.tobytes("png")
        img = Image.open(io.BytesIO(img_data))

        ocr_text = pytesseract.image_to_string(img, lang='tur+eng')
        ocr_text = fix_turkish_encoding(ocr_text)

        # Merge: if OCR gives more text, use it
        if len(ocr_text.strip()) > len(pymupdf_text.strip()):
            print(f"      🔍 OCR extracted {len(ocr_text)} chars (PyMuPDF: {len(pymupdf_text)})")
            return ocr_text

    except Exception as e:
        print(f"      ⚠️  OCR failed: {e}")

    return pymupdf_text


def crop_question_image(page: fitz.Page, question_block: QuestionBlock) -> Optional[str]:
    """Crop question area with high quality"""
    try:
        crop_rect = fitz.Rect(
            question_block.x0,
            question_block.y0,
            question_block.x1,
            question_block.y1,
        )

        if not crop_rect.is_valid or crop_rect.is_empty:
            return None

        # Render at 2x for quality
        mat = fitz.Matrix(2.0, 2.0)
        pix = page.get_pixmap(matrix=mat, clip=crop_rect)

        img_bytes = pix.tobytes("png")
        img_base64 = base64.b64encode(img_bytes).decode('utf-8')

        return f"data:image/png;base64,{img_base64}"

    except Exception as e:
        print(f"      ❌ Crop failed: {e}")
        return None


def parse_pdf_with_ocr(pdf_bytes: bytes) -> List[Question]:
    """
    Main parser with advanced segmentation + answer key matching
    """
    pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
    all_question_blocks = []
    unique_id = 1

    print(f"\n📄 Processing {len(pdf_document)} pages...")

    # Step 0: Extract answer key from last pages
    print(f"\n🔑 Extracting answer key...")
    answer_keys = extract_answer_key_from_pdf(pdf_document)

    # Step 1: Find all question blocks across pages (excluding answer key pages)
    total_pages = len(pdf_document)
    # Don't process last 2 pages if they contain answer keys
    end_page = total_pages - 2 if answer_keys else total_pages

    for page_num in range(end_page):
        page = pdf_document[page_num]
        print(f"\n📄 Page {page_num + 1}:")

        page_question_blocks = find_question_blocks(page, page_num + 1, unique_id)
        all_question_blocks.extend(page_question_blocks)
        unique_id += len(page_question_blocks)

    print(f"\n📊 Total questions found: {len(all_question_blocks)}")

    # Step 2: Group questions by subject (based on PDF numbering)
    # Assumption: questions are ordered by subject (TÜRKÇE 1-20, MATEMATİK 1-20, etc.)
    questions_by_pdf_num = {}
    for q_block in all_question_blocks:
        if q_block.pdf_number:
            if q_block.pdf_number not in questions_by_pdf_num:
                questions_by_pdf_num[q_block.pdf_number] = []
            questions_by_pdf_num[q_block.pdf_number].append(q_block)

    # Step 3: Process each question block
    questions = []
    current_subject = None
    subject_question_count = 0

    # Try to determine subject from answer keys
    subject_list = list(answer_keys.keys()) if answer_keys else []
    subject_index = 0

    for q_block in all_question_blocks:
        try:
            page = pdf_document[q_block.page_num - 1]

            # Determine subject (simple heuristic: reset counter when PDF number repeats)
            if q_block.pdf_number == 1 and subject_question_count > 0:
                # New subject started
                subject_index = min(subject_index + 1, len(subject_list) - 1)

            if subject_list and subject_index < len(subject_list):
                current_subject = subject_list[subject_index]
            subject_question_count += 1

            # Extract options using clustering
            options = extract_options_with_clustering(q_block.text_blocks)

            # Extract question text with BOLD stem separation
            question_text, question_stem = extract_question_stem(q_block.text_blocks)

            # Fallback to old method if stem extraction didn't work
            if not question_text.strip():
                question_text = extract_question_text(q_block.text_blocks, options)

            # If text still empty, use hybrid OCR
            if not question_text.strip():
                crop_rect = fitz.Rect(q_block.x0, q_block.y0, q_block.x1, q_block.y1)
                question_text = extract_with_ocr_hybrid(page, crop_rect, q_block.text_blocks)

            # Crop image
            image_base64 = crop_question_image(page, q_block)

            # Match answer from answer key
            answer = None
            if current_subject and answer_keys.get(current_subject):
                answer = answer_keys[current_subject].get(q_block.pdf_number)

            # Create question
            question = Question(
                id=q_block.unique_id,
                text=question_text,
                stem=question_stem,
                options=options,
                answer=answer,
                image_base64=image_base64,
                subject=current_subject,
            )

            questions.append(question)

            print(f"   ✅ ID={q_block.unique_id} (PDF#{q_block.pdf_number}): "
                  f"subject={current_subject}, "
                  f"text={len(question_text)} chars, "
                  f"stem={len(question_stem)} chars, "
                  f"options={len(options)}, "
                  f"answer={answer}")

        except Exception as e:
            print(f"   ❌ ID={q_block.unique_id} failed: {e}")
            import traceback
            traceback.print_exc()
            continue

    pdf_document.close()

    print(f"\n✅ Successfully parsed {len(questions)} questions")
    return questions


def questions_to_json(questions: List[Question]) -> Dict[str, Any]:
    """
    Convert to API response format - ENHANCED
    Matches PostgreSQL JSONB structure for questions table
    """
    return {
        "success": True,
        "total_questions": len(questions),
        "questions": [
            {
                "id": q.id,
                # Metadata fields (from answer key + OpenAI)
                "subject": q.subject,  # From answer key: TÜRKÇE, MATEMATİK, etc.
                "topic": q.topic,  # TODO: From OpenAI
                "subtopic": q.subtopic,  # TODO: From OpenAI
                "difficulty": q.difficulty,  # TODO: From OpenAI ("easy", "medium", "hard")
                "format": "multiple_choice",
                "tags": [],

                # Content structure
                "content": {
                    "text": q.text,  # Full question text
                    "stem": q.stem,  # BOLD question root/core
                    "options": q.options,  # [{"label": "A", "value": "..."}, ...]
                    "image": q.image_base64,  # Base64 image
                },

                # Answer and solution
                "answer_key": {
                    "correct": q.answer,  # "A", "B", etc. (from PDF answer key)
                    "explanation": None,
                } if q.answer else None,

                "solution": None,  # Can add step-by-step solution later

                # Ownership and visibility (for database compatibility)
                "owner_type": None,  # Can be: "user", "admin", "system"
                "visibility": None,  # Can be: "public", "private", "shared"
            }
            for q in questions
        ]
    }

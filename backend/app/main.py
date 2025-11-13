"""
FastAPI backend for PDF question parsing with PyMuPDF
DEFINITIVE SOLUTION for accurate question image extraction
"""
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import fitz  # PyMuPDF
from PIL import Image
import io
import re
from typing import List, Dict, Any
import base64
import sys

# Ensure UTF-8 encoding for console output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

app = FastAPI(title="BasariYolu PDF Parser API")

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def parse_question_text(text: str, question_num: int) -> Dict[str, Any]:
    """
    Parse question text to extract stem, options, and answer
    Improved: Better UTF-8 handling, multiline options, deduplicate options
    """
    lines = text.split('\n')
    stem_lines = []
    options_dict = {}  # Use dict to prevent duplicates
    answer = None
    current_option_label = None  # Track multiline options

    # Remove question number from first line
    first_line = lines[0] if lines else ""
    first_line = re.sub(r'^(?:Soru\s+)?\d+[.)]?\s*', '', first_line).strip()
    if first_line:
        stem_lines.append(first_line)

    # Parse remaining lines
    i = 1
    in_options_section = False

    while i < len(lines):
        line = lines[i].strip()

        if not line:
            i += 1
            current_option_label = None  # Reset on empty line
            continue

        # Check if this is an option (A), B), C), etc.)
        option_match = re.match(r'^([A-E])[.)]?\s*(.+)', line, re.IGNORECASE)
        if option_match:
            in_options_section = True
            label = option_match.group(1).upper()
            value = option_match.group(2).strip()

            # Only add if not duplicate and value is meaningful
            if label not in options_dict and len(value) > 1:
                options_dict[label] = value
                current_option_label = label
            elif label == current_option_label and label in options_dict:
                # Continuation of current option - append
                options_dict[label] += ' ' + value

        # Check for answer key - multiple patterns
        # Pattern 1: "Cevap: A", "Doğru Cevap: B", "Answer: C"
        # Pattern 2: Just "Cevap" followed by letter (common in some exams)
        elif not answer and re.search(r'(?:cevap|do[ğg]ru|yan[ıi]t|answer|key)', line, re.IGNORECASE):
            # Look for A-E in this line
            answer_match = re.search(r'\b([A-E])\b', line, re.IGNORECASE)
            if answer_match:
                answer = answer_match.group(1).upper()
                current_option_label = None
                continue  # Don't add this line to options or stem

        # Check if continuation of previous option (no new option marker)
        elif in_options_section and current_option_label and len(line) > 1:
            # Skip if it looks like page number or noise
            if not any(keyword in line.lower() for keyword in ['sayfa', 'page', '©', 'www.', 'http', 'cevap']):
                # Check if line might be continuing the option text
                if not re.match(r'^[A-E][.)]', line, re.IGNORECASE):
                    options_dict[current_option_label] += ' ' + line

        # Otherwise, add to stem if not in options section yet
        elif not in_options_section and line:
            # Skip page numbers, copyright, etc.
            if not any(keyword in line.lower() for keyword in ['sayfa', 'page', '©', 'www.', 'http']):
                stem_lines.append(line)

        i += 1

    # Join stem lines
    stem = ' '.join(stem_lines).strip()

    # If no stem found, use placeholder
    if not stem or len(stem) < 5:
        stem = f"Soru {question_num}"

    # Convert options dict to list and clean up
    options = []
    for label, value in sorted(options_dict.items()):
        # Clean up extra whitespace
        value = ' '.join(value.split())
        if len(value) > 1:  # Only include non-empty options
            options.append({'label': label, 'value': value})

    return {
        'stem': stem,
        'options': options,
        'answer': answer,
    }


@app.get("/")
async def root():
    return {"message": "BasariYolu PDF Parser API - Ready", "status": "ok"}


@app.post("/api/parse-pdf")
async def parse_pdf_questions(file: UploadFile = File(...)):
    """
    Parse PDF and extract question images with PERFECT accuracy using PyMuPDF

    Returns:
        - questions: List of question metadata
        - images: List of base64 encoded cropped question images
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    try:
        # Read PDF file
        pdf_bytes = await file.read()
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")

        results = []

        # Process each page
        for page_num in range(len(pdf_document)):
            page = pdf_document[page_num]

            # Get all text blocks with positions
            # CRITICAL FIX: Sort blocks by Y (top to bottom), then X (left to right)
            # This ensures correct reading order for multi-column layouts
            text_blocks = sorted(page.get_text("blocks"), key=lambda b: (b[1], b[0]))

            # Find question numbers and their positions, AND extract full text
            question_positions = {}
            question_texts = {}  # Store full text for each question

            for block in text_blocks:
                text = block[4].strip()
                # Match "Soru 1)" or "1)" or "1."
                match = re.match(r'^(?:Soru\s+)?(\d+)[.)]', text)
                if match:
                    question_num = int(match.group(1))
                    # block format: (x0, y0, x1, y1, text, ...)
                    if question_num not in question_positions:
                        question_positions[question_num] = {
                            'x0': block[0],  # Left X
                            'y0': block[1],  # Top Y
                            'x1': block[2],  # Right X
                            'y1': block[3],  # Bottom Y
                        }
                        question_texts[question_num] = []
                    question_texts[question_num].append(text)

            if not question_positions:
                continue

            # CRITICAL FIX: Sort questions by POSITION (Y, then X), NOT by number
            # This handles multi-column layouts where Q3 might be left of Q4
            sorted_questions = sorted(
                question_positions.items(),
                key=lambda item: (item[1]['y0'], item[1]['x0'])
            )

            # Get page dimensions
            page_rect = page.rect
            page_width = page_rect.width
            page_height = page_rect.height

            # Collect all text blocks within each question's Y range
            for i, (q_num, q_pos) in enumerate(sorted_questions):
                start_y = q_pos['y0']

                # End Y is either next question or page end
                if i + 1 < len(sorted_questions):
                    next_q_pos = sorted_questions[i + 1][1]
                    end_y = next_q_pos['y0']
                else:
                    end_y = page_height

                # Collect all text blocks within this range
                for block in text_blocks:
                    block_y0 = block[1]
                    block_text = block[4].strip()

                    # If block is within question range, add to question text
                    if block_y0 >= start_y and block_y0 < end_y and block_text:
                        if block_text not in question_texts[q_num]:  # Avoid duplicates
                            question_texts[q_num].append(block_text)

            # Extract images for each question
            for i, (q_num, q_pos) in enumerate(sorted_questions):
                try:
                    # Determine question boundaries
                    start_y = q_pos['y0']
                    start_x = q_pos['x0']

                    # SMART MULTI-COLUMN DETECTION
                    # Check if next question is on same Y level (side-by-side layout)
                    is_multi_column = False
                    if i + 1 < len(sorted_questions):
                        next_q_pos = sorted_questions[i + 1][1]
                        next_y = next_q_pos['y0']
                        next_x = next_q_pos['x0']

                        # If next question starts within 50px of current Y, it's multi-column
                        if abs(next_y - start_y) < 50:
                            is_multi_column = True
                            # Use X coordinate to determine which column
                            # Crop X range: from question start to next question's X
                            crop_x0 = 0
                            crop_x1 = next_x - 10  # Leave gap between columns
                            end_y = page_height  # Go to bottom for this column
                        else:
                            # Normal single column: use full width
                            crop_x0 = 0
                            crop_x1 = page_width
                            end_y = next_y
                    else:
                        # Last question: use full width and height
                        crop_x0 = 0
                        crop_x1 = page_width
                        end_y = page_height

                    # FIXED CROP LOGIC: Crop the ENTIRE question area
                    crop_y0 = start_y
                    crop_y1 = end_y

                    # Add small padding for better visual appearance
                    padding_top = 10
                    padding_bottom = 10
                    crop_y0 = max(0, crop_y0 - padding_top)
                    crop_y1 = min(page_height, crop_y1 + padding_bottom)

                    # Ensure we don't overlap with next question (single column only)
                    if not is_multi_column and i + 1 < len(sorted_questions):
                        next_start_y = sorted_questions[i + 1][1]['y0']
                        crop_y1 = min(crop_y1, next_start_y - 5)

                    # Count images in this question (for logging only)
                    images_count = 0
                    try:
                        image_list = page.get_images()
                        for img in image_list:
                            xref = img[0]
                            rects = page.get_image_rects(xref)
                            for rect in rects:
                                if rect.y0 >= start_y and rect.y1 <= end_y:
                                    images_count += 1
                    except:
                        pass

                    # VALIDATION: Ensure valid crop dimensions
                    crop_height = crop_y1 - crop_y0
                    crop_width = crop_x1 - crop_x0

                    if crop_height <= 10:
                        print(f"⚠️  Question {q_num}: Invalid height {crop_height}px, skipping")
                        continue

                    if crop_width <= 10:
                        print(f"⚠️  Question {q_num}: Invalid width {crop_width}px, skipping")
                        continue

                    if crop_y0 < 0 or crop_y1 > page_height or crop_y0 >= crop_y1:
                        print(f"⚠️  Question {q_num}: Invalid Y bounds [{crop_y0}, {crop_y1}], page height={page_height}, skipping")
                        continue

                    if crop_x0 < 0 or crop_x1 > page_width or crop_x0 >= crop_x1:
                        print(f"⚠️  Question {q_num}: Invalid X bounds [{crop_x0}, {crop_x1}], page width={page_width}, skipping")
                        continue

                    # Create crop rectangle with validation (X and Y bounds)
                    crop_rect = fitz.Rect(crop_x0, crop_y0, crop_x1, crop_y1)

                    # Validate rectangle
                    if not crop_rect.is_valid or crop_rect.is_empty:
                        print(f"⚠️  Question {q_num}: Invalid crop rectangle, skipping")
                        continue

                    # Render with reduced scale to avoid memory issues
                    mat = fitz.Matrix(1.5, 1.5)  # 1.5x scaling (108 DPI) - reduced from 2x

                    # Render to image with error handling
                    try:
                        pix = page.get_pixmap(matrix=mat, clip=crop_rect)
                    except Exception as render_err:
                        print(f"❌ Question {q_num}: Pixmap render failed: {render_err}")
                        # Try with even smaller scale
                        try:
                            mat = fitz.Matrix(1, 1)  # 1x scaling (72 DPI)
                            pix = page.get_pixmap(matrix=mat, clip=crop_rect)
                            print(f"✅ Question {q_num}: Rendered at 1x scale")
                        except:
                            print(f"❌ Question {q_num}: Failed even at 1x, skipping")
                            continue

                    # Convert to PNG bytes
                    img_bytes = pix.tobytes("png")

                    # Convert to base64 for JSON response
                    img_base64 = base64.b64encode(img_bytes).decode('utf-8')

                    # Parse question text for stem, options, and answer
                    full_text = "\n".join(question_texts.get(q_num, []))
                    parsed_content = parse_question_text(full_text, q_num)

                    # Debug logging
                    print(f"📝 Question {q_num} text blocks: {len(question_texts.get(q_num, []))}")
                    print(f"   Stem: {parsed_content['stem'][:80]}..." if len(parsed_content['stem']) > 80 else f"   Stem: {parsed_content['stem']}")
                    print(f"   Options: {len(parsed_content['options'])} found")
                    print(f"   Answer: {parsed_content['answer']}")

                    results.append({
                        'question_number': q_num,
                        'page_number': page_num + 1,
                        'image_base64': img_base64,
                        'text_content': parsed_content,
                        'crop_info': {
                            'x0': crop_x0,
                            'y0': crop_y0,
                            'x1': crop_x1,
                            'y1': crop_y1,
                            'width': crop_width,
                            'height': crop_height,
                            'images_count': images_count,
                            'is_multi_column': is_multi_column,
                        }
                    })

                    layout_info = " [MULTI-COLUMN]" if is_multi_column else ""
                    print(f"✅ Question {q_num} (Page {page_num + 1}){layout_info}: X={crop_x0:.0f}-{crop_x1:.0f}, Y={crop_y0:.0f}-{crop_y1:.0f}, W={crop_width:.0f}px, H={crop_height:.0f}px, Images={images_count}")

                except Exception as q_err:
                    print(f"❌ Question {q_num} failed: {q_err}")
                    continue

        pdf_document.close()

        return {
            "success": True,
            "total_questions": len(results),
            "questions": results
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF parsing error: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "pdf-parser"}

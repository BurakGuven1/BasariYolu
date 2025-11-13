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
    """
    lines = text.split('\n')
    stem_lines = []
    options = []
    answer = None

    # Remove question number from first line
    first_line = lines[0] if lines else ""
    first_line = re.sub(r'^(?:Soru\s+)?\d+[.)]?\s*', '', first_line).strip()
    if first_line:
        stem_lines.append(first_line)

    # Parse remaining lines
    i = 1
    while i < len(lines):
        line = lines[i].strip()

        # Check if this is an option (A), B), C), etc.)
        option_match = re.match(r'^([A-E])[.)]?\s*(.+)', line, re.IGNORECASE)
        if option_match:
            label = option_match.group(1).upper()
            value = option_match.group(2).strip()
            options.append({'label': label, 'value': value})
        # Check for answer key (Cevap: A, Doğru Cevap: B, etc.)
        elif re.search(r'(?:cevap|doğru|answer|key)[\s:]+([A-E])', line, re.IGNORECASE):
            answer_match = re.search(r'([A-E])', line, re.IGNORECASE)
            if answer_match:
                answer = answer_match.group(1).upper()
        # Otherwise, add to stem
        elif line and not any(keyword in line.lower() for keyword in ['sayfa', 'page', '©']):
            # Don't add if it's already part of options
            if not any(opt['value'] in line for opt in options):
                stem_lines.append(line)

        i += 1

    # Join stem lines
    stem = ' '.join(stem_lines).strip()

    # If no stem found, use placeholder
    if not stem:
        stem = f"Soru {question_num} (Metin okunamadı - görsel kullanın)"

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
            text_blocks = page.get_text("blocks")

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
                            'y0': block[1],  # Top Y
                            'y1': block[3],  # Bottom Y
                        }
                        question_texts[question_num] = []
                    question_texts[question_num].append(text)

            if not question_positions:
                continue

            # Sort questions by position
            sorted_questions = sorted(question_positions.items())

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

                    # End Y is either next question or page end
                    if i + 1 < len(sorted_questions):
                        next_q_pos = sorted_questions[i + 1][1]
                        end_y = next_q_pos['y0']
                    else:
                        end_y = page_height

                    # CRITICAL: Find all images within this question range
                    image_list = page.get_images()
                    images_in_question = []

                    for img_index, img in enumerate(image_list):
                        try:
                            # Get image position using get_image_rects
                            xref = img[0]
                            rects = page.get_image_rects(xref)

                            for rect in rects:
                                img_y0 = rect.y0
                                img_y1 = rect.y1

                                # Check if image is within question boundaries
                                if img_y0 >= start_y and img_y1 <= end_y:
                                    images_in_question.append({
                                        'rect': rect,
                                        'y0': img_y0,
                                        'y1': img_y1,
                                    })
                        except Exception as img_err:
                            print(f"⚠️  Image extraction error: {img_err}")
                            pass

                    # Extend boundaries to include all images
                    crop_y0 = start_y
                    crop_y1 = end_y

                    for img_info in images_in_question:
                        crop_y0 = min(crop_y0, img_info['y0'])
                        crop_y1 = max(crop_y1, img_info['y1'])

                    # Add padding
                    padding_top = 30
                    padding_bottom = 50
                    crop_y0 = max(0, crop_y0 - padding_top)
                    crop_y1 = min(page_height, crop_y1 + padding_bottom)

                    # Don't overlap with next question
                    if i + 1 < len(sorted_questions):
                        next_start_y = sorted_questions[i + 1][1]['y0']
                        crop_y1 = min(crop_y1, next_start_y - 5)

                    # VALIDATION: Ensure valid crop dimensions
                    crop_height = crop_y1 - crop_y0

                    if crop_height <= 10:
                        print(f"⚠️  Question {q_num}: Invalid height {crop_height}px, skipping")
                        continue

                    if crop_y0 < 0 or crop_y1 > page_height or crop_y0 >= crop_y1:
                        print(f"⚠️  Question {q_num}: Invalid Y bounds [{crop_y0}, {crop_y1}], page height={page_height}, skipping")
                        continue

                    # Create crop rectangle with validation
                    crop_rect = fitz.Rect(0, crop_y0, page_width, crop_y1)

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

                    results.append({
                        'question_number': q_num,
                        'page_number': page_num + 1,
                        'image_base64': img_base64,
                        'text_content': parsed_content,  # NEW: Add parsed text
                        'crop_info': {
                            'y0': crop_y0,
                            'y1': crop_y1,
                            'height': crop_height,
                            'images_count': len(images_in_question),
                        }
                    })

                    print(f"✅ Question {q_num} (Page {page_num + 1}): Cropped {len(images_in_question)} images, Y={crop_y0:.0f}-{crop_y1:.0f}, H={crop_height:.0f}px")

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

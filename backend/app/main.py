"""
FastAPI backend for PDF question parsing with OCR support
DEFINITIVE SOLUTION: PyMuPDF + Tesseract OCR
"""
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sys

# Ensure UTF-8 encoding for console output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

from .parse_pdf import parse_pdf_with_ocr, questions_to_json

app = FastAPI(title="BasariYolu PDF Parser API with OCR")

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "message": "BasariYolu PDF Parser API - OCR Enabled",
        "status": "ok",
        "features": ["PyMuPDF", "Tesseract OCR", "Multi-column support"]
    }


@app.post("/api/parse-pdf")
async def parse_pdf(file: UploadFile = File(...)):
    """
    Parse PDF and extract questions with OCR support

    Returns:
        {
          "success": true,
          "total_questions": 21,
          "questions": [
            {
              "question_number": 1,
              "page_number": 2,
              "text": "Soru metni...",
              "choices": ["A) ...", "B) ..."],
              "answer": "A",
              "image_base64": "data:image/png;base64,...",
              "crop_info": {...}
            }
          ]
        }
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    try:
        # Read PDF file
        pdf_bytes = await file.read()

        print(f"\n📄 Processing PDF: {file.filename}")
        print(f"   Size: {len(pdf_bytes)} bytes")

        # Parse with OCR support
        questions = parse_pdf_with_ocr(pdf_bytes)

        print(f"\n✅ Successfully parsed {len(questions)} questions")

        # Convert to JSON format
        result = questions_to_json(questions)

        return result

    except Exception as e:
        print(f"\n❌ PDF parsing error: {e}")
        raise HTTPException(status_code=500, detail=f"PDF parsing error: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        import pytesseract
        ocr_status = "available"
    except ImportError:
        ocr_status = "unavailable"

    return {
        "status": "healthy",
        "service": "pdf-parser-ocr",
        "ocr": ocr_status
    }

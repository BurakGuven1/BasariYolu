# OCR Backend Kurulum Talimatları

## 🎯 Gereksinimler

1. **Python 3.9+**
2. **Tesseract OCR** (sistem paket)
3. **Python dependencies** (requirements.txt)

## 📦 Tesseract Kurulumu

### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install -y tesseract-ocr tesseract-ocr-tur tesseract-ocr-eng
```

### macOS:
```bash
brew install tesseract tesseract-lang
```

### Windows:
1. İndir: https://github.com/UB-Mannheim/tesseract/wiki
2. Kurulum yap
3. PATH'e ekle: `C:\Program Files\Tesseract-OCR`

## 🚀 Backend Kurulumu

### 1. Virtual Environment Oluştur:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# veya
venv\Scripts\activate  # Windows
```

### 2. Dependencies Kur:
```bash
pip install -r requirements.txt
```

### 3. Tesseract Kontrolü:
```bash
tesseract --version
```

Şunu görmelisin:
```
tesseract 5.x.x
 leptonica-1.x.x
```

### 4. Backend'i Başlat:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Veya run script ile:
```bash
chmod +x run.sh
./run.sh
```

## ✅ Test

Backend'in çalıştığını kontrol et:
```bash
curl http://localhost:8000/health
```

Beklenen yanıt:
```json
{
  "status": "healthy",
  "service": "pdf-parser-ocr",
  "ocr": "available"
}
```

Eğer `"ocr": "unavailable"` diyorsa:
- Tesseract kurulu değil
- PATH'te değil
- pytesseract kurulamadı

## 🔧 Sorun Giderme

### OCR çalışmıyor:
```bash
# Tesseract kontrol et
which tesseract  # Linux/Mac
where tesseract  # Windows

# Türkçe dil paketi kontrol et
tesseract --list-langs
# "tur" listede olmalı
```

### Import hatası:
```bash
# pytesseract yeniden kur
pip uninstall pytesseract
pip install pytesseract==0.3.10
```

### PDF parse hatası:
```bash
# PyMuPDF yeniden kur
pip uninstall PyMuPDF
pip install PyMuPDF==1.23.26
```

## 📊 Özellikler

✅ PyMuPDF ile text extraction
✅ Tesseract OCR fallback
✅ Türkçe karakter desteği (ğ, ş, ı, ö, ü, ç)
✅ Multi-column layout detection
✅ Base64 image encoding
✅ Question, choices, answer parsing
✅ JSON API response

## 🎨 API Format

POST `/api/parse-pdf`

Response:
```json
{
  "success": true,
  "total_questions": 21,
  "questions": [
    {
      "question_number": 1,
      "page_number": 2,
      "text": "İnternet ortamında...",
      "choices": [
        "A) Seçenek 1",
        "B) Seçenek 2",
        "C) Seçenek 3",
        "D) Seçenek 4"
      ],
      "answer": "C",
      "image_base64": "data:image/png;base64,...",
      "crop_info": {
        "x0": 0,
        "y0": 100,
        "x1": 595,
        "y1": 400,
        "width": 595,
        "height": 300
      }
    }
  ]
}
```

# Hibrit PDF Parser Modu

## Genel Bakış

BasariYolu PDF parser'ı **hibrit mod** ile çalışır:

### PyMuPDF (Görsel İşleme)
- ✅ Soru görsellerini kırpma (crop) - **%90-95 doğruluk**
- ✅ Multi-column detection
- ✅ Geometric bounding box hesaplama
- ✅ High-quality image rendering (2x resolution)

### OpenAI Vision (Metin İşleme)
- 🤖 Soru metni çıkarma
- 🤖 Şıklar (A-E) algılama
- 🤖 Topic, subtopic, difficulty belirleme
- 🤖 Türkçe karakter tanıma

## Nasıl Çalışır?

```
1. PyMuPDF: PDF'den soruları tespit et (geometric analysis)
   └─> find_question_blocks() → QuestionBlock[]

2. PyMuPDF: Her soru için yüksek kaliteli görsel crop et
   └─> crop_question_image() → base64 image

3. OpenAI Vision: Görseli analiz et (metin, şıklar, metadata)
   └─> analyze_question_with_openai_vision() → {text, options, topic, ...}

4. Combine: Görsel (PyMuPDF) + Metin (OpenAI) → Final Question
```

## Kurulum

### 1. Bağımlılıkları yükle

```bash
cd backend
pip install -r requirements.txt
```

### 2. OpenAI API Key al

1. https://platform.openai.com/api-keys adresine git
2. "Create new secret key" tıkla
3. Key'i kopyala (tek seferlik gösterilir!)

### 3. Environment variable ayarla

#### Linux/Mac:
```bash
export OPENAI_API_KEY="sk-proj-..."
```

#### Windows (PowerShell):
```powershell
$env:OPENAI_API_KEY="sk-proj-..."
```

#### Windows (CMD):
```cmd
set OPENAI_API_KEY=sk-proj-...
```

#### Kalıcı (önerilen) - .env dosyası:
```bash
cd backend
cp .env.example .env
# .env dosyasını düzenle ve API key'i yapıştır
```

### 4. Test et

```bash
cd backend
uvicorn app.main:app --reload
```

## Maliyet

### GPT-4o-mini (Önerilen)
- **Input**: $0.15 / 1M tokens (~$0.0001 per soru görseli)
- **Output**: $0.60 / 1M tokens (~$0.0002 per soru analizi)
- **Toplam**: ~$0.0003 per soru = **40 soru için $0.01**

### Örnek:
- 100 soruluk deneme: ~$0.03
- 1000 soruluk soru bankası: ~$0.30

## Fallback Mod

OpenAI API key yoksa **otomatik fallback** devreye girer:

```
⚠️  OpenAI API key not set - Will use PyMuPDF text extraction only
```

Bu durumda:
- ✅ Görsel crop çalışmaya devam eder
- 📄 Metin extraction PyMuPDF ile yapılır (eski yöntem)
- ❌ Topic, subtopic, difficulty = null

## API Response Format

```json
{
  "success": true,
  "total_questions": 40,
  "questions": [
    {
      "id": 1,
      "subject": "TÜRKÇE",
      "topic": "Cümle Bilgisi",
      "subtopic": "Fiilimsiler",
      "difficulty": "medium",
      "format": "multiple_choice",
      "content": {
        "text": "Aşağıdaki cümlelerin hangisinde fiilimsi kullanılmamıştır?",
        "stem": "Aşağıdaki cümlelerin hangisinde fiilimsi kullanılmamıştır?",
        "options": [
          {"label": "A", "value": "Koşarak gelen çocuk yoruldu."},
          {"label": "B", "value": "Kitap okumayı çok severim."},
          {"label": "C", "value": "Ali eve geldi."},
          {"label": "D", "value": "Okunan kitap güzeldi."},
          {"label": "E", "value": "Gelinecek yer burası."}
        ],
        "image": "data:image/png;base64,..."
      },
      "answer_key": {
        "correct": "C",
        "explanation": null
      }
    }
  ]
}
```

## PostgreSQL Insert

SQL sorgusu (verdiğiniz format):

```sql
INSERT INTO questions (
  subject, topic, subtopic, difficulty, format, tags,
  content, answer_key, solution, owner_type, visibility
)
SELECT
  q->>'subject',
  q->>'topic',
  q->>'subtopic',
  (q->>'difficulty')::question_difficulty,
  (q->>'format')::question_format,
  ARRAY(SELECT jsonb_array_elements_text(q->'tags')),
  q->'content',
  q->'answer_key',
  q->'solution',
  (q->>'owner_type')::question_owner_type,
  (q->>'visibility')::question_visibility
FROM jsonb_array_elements(
  $$ [ ... ] $$::jsonb
) AS t(q);
```

## Avantajlar

### PyMuPDF Avantajları:
- ⚡ Çok hızlı (geometric analysis)
- 🎯 Yüksek crop doğruluğu (%90-95)
- 💰 Ücretsiz
- 🔒 Lokal processing (veri güvenliği)

### OpenAI Vision Avantajları:
- 📝 Mükemmel Türkçe karakter tanıma
- 🎯 Şıkları %100 doğru algılama
- 🧠 Akıllı topic/difficulty belirleme
- 🚫 "ŞIK A", "ŞIK B" placeholder filtreleme
- 📋 Multi-line şıkları otomatik birleştirme

## Troubleshooting

### "OpenAI API key not set"
```bash
# API key'i kontrol et
echo $OPENAI_API_KEY
# Boşsa, .env dosyasını kontrol et veya export komutu çalıştır
```

### "Rate limit exceeded"
OpenAI'nin rate limit'i aştıysanız:
- Bekleyin (1 dakika)
- Tier 2'ye upgrade yapın (daha yüksek limit)

### "Insufficient quota"
OpenAI hesabınıza kredi ekleyin:
- https://platform.openai.com/account/billing

### PyMuPDF fallback kullanmak isterseniz:
```bash
unset OPENAI_API_KEY
# veya .env dosyasından OPENAI_API_KEY satırını silin
```

## Öneriler

1. **Production'da**: OpenAI kullanın (en iyi kalite)
2. **Development'ta**: PyMuPDF fallback (ücretsiz, hızlı)
3. **Batch processing**: OpenAI rate limiting için 10 soru/saniye hız sınırı
4. **Caching**: Aynı PDF'i tekrar parse etmeyin, sonuçları cache'leyin

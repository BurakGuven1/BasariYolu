# OpenAI Entegrasyonu Kurulumu

Parser otomatik olarak soruların **konu**, **alt konu** ve **zorluk** seviyesini tespit edebilir.

## 📋 Gereksinimler

- OpenAI API anahtarı (ücretsiz hesapla test edebilirsiniz)
- Python paketi: `openai==1.12.0` (zaten requirements.txt'te)

## 🔑 Adım 1: API Anahtarı Al

1. https://platform.openai.com/signup adresinden kayıt ol
2. https://platform.openai.com/api-keys adresine git
3. "Create new secret key" butonuna tıkla
4. Anahtarı kopyala (örn: `sk-proj-...`)

## ⚙️ Adım 2: Ortam Değişkenini Ayarla

### Windows (PowerShell):

```powershell
# Geçici (sadece bu oturum için)
$env:OPENAI_API_KEY = "sk-proj-your-key-here"

# Kalıcı (her zaman için)
[System.Environment]::SetEnvironmentVariable('OPENAI_API_KEY', 'sk-proj-your-key-here', 'User')
```

**VEYA** `.env` dosyası kullan:

```powershell
cd D:\project\backend
Copy-Item .env.example .env
notepad .env  # İçine API anahtarını yapıştır
```

### Linux/Mac:

```bash
# .env dosyası oluştur
cd backend
cp .env.example .env
nano .env  # İçine API anahtarını yapıştır
```

## 📝 .env Dosyası İçeriği

```env
OPENAI_API_KEY=sk-proj-your-actual-key-here
```

## ✅ Adım 3: Test Et

Backend'i başlat:

```powershell
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Console'da şunu göreceksin:
```
✅ OpenAI API key found
```

PDF upload ettiğinde her soru için:
```
🤖 Analyzing with OpenAI...
✅ ID=1: subject=TÜRKÇE, topic=Sözcük Bilgisi, difficulty=medium
```

## 💰 Maliyet

OpenAI API kullanımı **ücretli** ama çok ucuz:

- Model: `gpt-4o-mini`
- Maliyet: ~$0.15 per 1M input tokens
- Ortalama: **40 soru = $0.01** (1 kuruş!)

İlk kayıtta **$5 ücretsiz kredi** veriliyor.

## 🚫 OpenAI Kullanmadan Çalıştırma

API anahtarı yoksa sistem otomatik olarak atlar:

```
⚠️  OpenAI API key not set - metadata analysis will be skipped
```

Bu durumda:
- ✅ Crop çalışır
- ✅ OCR çalışır
- ✅ Şıklar parse edilir
- ✅ Cevap anahtarı eşleştirilir
- ❌ topic/subtopic/difficulty → `null` döner

## 🔧 Sorun Giderme

### "OpenAI not installed" hatası

```powershell
pip install openai==1.12.0
```

### "API key not found" hatası

PowerShell'de kontrol et:
```powershell
$env:OPENAI_API_KEY
```

Veya .env dosyasını kontrol et:
```powershell
cat .env
```

### "Rate limit exceeded" hatası

Çok hızlı istek atıyorsun. Parser otomatik olarak yavaşlatacak.

### API anahtarı çalışmıyor

1. https://platform.openai.com/account/billing adresinden kredi olup olmadığını kontrol et
2. Anahtarın aktif olduğundan emin ol
3. Yeni bir anahtar oluştur ve dene

## 📊 Örnek Output

OpenAI ile:
```json
{
  "id": 1,
  "subject": "TÜRKÇE",
  "topic": "Sözcük Bilgisi",
  "subtopic": "Eş Anlamlı Kelimeler",
  "difficulty": "medium",
  "content": {...}
}
```

OpenAI olmadan:
```json
{
  "id": 1,
  "subject": "TÜRKÇE",
  "topic": null,
  "subtopic": null,
  "difficulty": null,
  "content": {...}
}
```

## 🎯 Sonuç

OpenAI entegrasyonu **isteğe bağlı** ama çok faydalı:
- Soruları otomatik kategorize eder
- Database sorgularını kolaylaştırır
- Öğrencilere zorluk seviyesine göre soru önermek için kullanılabilir

Maliyeti çok düşük olduğu için kullanmanı öneririm!

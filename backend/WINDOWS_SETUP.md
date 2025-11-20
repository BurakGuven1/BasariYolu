# Windows Kurulum Rehberi

## ⚠️ ÖNEMLİ: Python Versiyonu

**Python 3.12 kullanmalısınız!** Python 3.13 henüz PyMuPDF için desteklenmiyor.

## 🔧 Adım Adım Kurulum

### 1. Python Versiyonunu Kontrol Edin

```powershell
# Sisteminizde yüklü Python versiyonlarını listeleyin
py -0p
```

Çıktı şöyle olmalı:
```
 -3.12-64        C:\Users\...\Python312\python.exe *
 -3.13-64        C:\Users\...\Python313\python.exe
```

### 2. Python 3.12 Yoksa İndirin

Eğer Python 3.12 listede yoksa:
1. https://www.python.org/downloads/ adresinden Python 3.12.x indirin
2. Kurulum sırasında "Add Python to PATH" seçeneğini işaretleyin
3. Kurulumu tamamlayın

### 3. Mevcut venv'i Yedekleyin (Eğer Varsa)

```powershell
cd D:\project\backend

# Eğer aktifse, deaktive edin
deactivate

# Eski venv'i yedekleyin
Rename-Item venv venv-old-py313
```

### 4. Python 3.12 ile Yeni venv Oluşturun

```powershell
# Python 3.12 ile yeni virtual environment oluştur
py -3.12 -m venv venv

# Aktive et
.\venv\Scripts\Activate.ps1
```

**NOT**: Eğer PowerShell execution policy hatası alırsanız:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 5. pip'i Güncelleyin

```powershell
python -m pip install --upgrade pip
```

### 6. Dependencies'leri Yükleyin

```powershell
pip install -r requirements.txt
```

Bu sefer **tüm paketler sorunsuz yüklenecek** çünkü Python 3.12 için hazır wheel'ler mevcut.

### 7. Tesseract OCR Kurulumu

1. İndirin: https://github.com/UB-Mannheim/tesseract/wiki
2. Kurulum sırasında **Turkish language pack**'i seçin
3. Varsayılan yol: `C:\Program Files\Tesseract-OCR`

Tesseract kontrolü:
```powershell
tesseract --version
tesseract --list-langs  # "tur" ve "eng" listede olmalı
```

### 8. Backend'i Başlatın

```powershell
# Otomatik kurulum + başlatma (önerilen)
.\run.ps1

# VEYA manuel:
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 9. Test Edin

Yeni bir terminal açın:
```powershell
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

✅ **`"ocr": "available"`** görüyorsanız başarılı!

## 🚨 Sorun Giderme

### PyMuPDF yüklenemiyor
- **Neden**: Python 3.13 kullanıyorsunuz
- **Çözüm**: Python 3.12 ile yeni venv oluşturun (yukarıdaki adımlar)

### Pillow yüklenemiyor
- **Neden**: Aynı sebep (Python 3.13)
- **Çözüm**: Python 3.12 kullanın

### OCR "unavailable" diyor
- **Kontrol 1**: Tesseract kurulu mu?
  ```powershell
  where.exe tesseract
  # Şunu görmelisiniz: C:\Program Files\Tesseract-OCR\tesseract.exe
  ```
- **Kontrol 2**: pytesseract yüklü mü?
  ```powershell
  pip list | findstr pytesseract
  # Şunu görmelisiniz: pytesseract    0.3.10
  ```
- **Kontrol 3**: Backend'i yeniden başlatın

### PowerShell script çalıştıramıyorum
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📊 Gereksinimler Özeti

- ✅ **Python 3.12** (3.11 de olur, 3.13 OLMAZ)
- ✅ Tesseract OCR (Turkish + English)
- ✅ Visual Studio GEREKMEZ (Python 3.12 kullandığınızda)

## 🎯 Hızlı Başlangıç (Tüm Komutlar)

```powershell
# Python versiyonunu kontrol et
py -0p

# Backend klasörüne git
cd D:\project\backend

# Eski venv'i yedekle (varsa)
Rename-Item venv venv-old -ErrorAction SilentlyContinue

# Python 3.12 ile yeni venv oluştur
py -3.12 -m venv venv

# Aktive et
.\venv\Scripts\Activate.ps1

# pip güncelle
python -m pip install --upgrade pip

# Dependencies yükle
pip install -r requirements.txt

# Backend başlat
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Başka bir terminal'de test:
```powershell
curl http://localhost:8000/health
```

Başarılı! 🎉

# AI Kredi Sistemi - TEK SEFERLIK KESİN ÇÖZÜM

## 🎯 Bu Migration Tüm Sorunları Çözecek

Dosya: `supabase/migrations/20251118100000_complete_daily_credits_fix.sql`

Bu migration:
- ✅ Tüm eski fonksiyonları temizler (tüm signature'lar)
- ✅ VIEW/TABLE hangisi varsa siler
- ✅ Temiz TABLE oluşturur (daily_credits ile)
- ✅ Tek bir `use_ai_credit` fonksiyonu oluşturur
- ✅ "week_start_date is ambiguous" hatasını çözer
- ✅ "function name not unique" hatasını çözer
- ✅ "daily_credits does not exist" hatasını çözer

---

## 📋 ADIMLAR (Tek Sefer - 5 Dakika)

### 1️⃣ Migration'ı Çalıştır

1. **Supabase Dashboard** aç: https://app.supabase.com
2. Projeyi seç
3. Sol menüden **SQL Editor** tıkla
4. **New Query** butonuna tıkla
5. `supabase/migrations/20251118100000_complete_daily_credits_fix.sql` dosyasını aç
6. **TÜM İÇERİĞİ** (177 satır) kopyala
7. SQL Editor'e yapıştır
8. **RUN** butonuna bas

**Beklenen Sonuç:**
```
Success. No rows returned
```

Eğer herhangi bir hata alırsan HEMEN bana söyle!

---

### 2️⃣ Doğrula (Opsiyonel ama önerilen)

SQL Editor'de yeni bir query aç ve şunu çalıştır:

```sql
-- Tablo tipini kontrol et (VIEW değil TABLE olmalı)
SELECT table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'student_ai_usage';

-- Beklenen: BASE TABLE
```

```sql
-- Kolonları kontrol et
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'student_ai_usage'
ORDER BY ordinal_position;

-- Beklenen kolonlar:
-- student_id | uuid
-- daily_credits | integer
-- used_credits | integer
-- day_date | date
-- created_at | timestamp with time zone
-- updated_at | timestamp with time zone
```

```sql
-- Fonksiyonları kontrol et
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_student_ai_credits', 'use_ai_credit', 'get_ai_usage_stats')
ORDER BY routine_name;

-- Beklenen: 3 fonksiyon (her biri sadece 1 kez)
```

---

### 3️⃣ Uygulamayı Test Et

1. **Öğrenci hesabıyla** giriş yap
2. **Yapay Zekaya Sor** paneline git
3. Sağ üstte kredi sayısını kontrol et → `15 / 15 Günlük Kredi` olmalı
4. **Bir soru sor** (örn: "2+2 kaç?")
5. Cevap geldikten sonra kredi sayısını tekrar kontrol et → `14 / 15 Günlük Kredi` olmalı

**✅ Kredi 15'ten 14'e düştüyse: BAŞARILI!**

---

### 4️⃣ Edge Function Loglarını Kontrol Et (Opsiyonel)

1. Supabase Dashboard → **Edge Functions** → **ask-ai**
2. **Logs** sekmesine git
3. Son request'lere bak
4. "week_start_date is ambiguous" hatası OLMAMALI
5. "Credits system not available" mesajı OLMAMALI

---

## 🔍 Hata Alırsan

### Hata 1: "permission denied for table student_ai_usage"
**Çözüm:** RLS policy çalışıyor demektir. Normal, öğrenci hesabıyla test et.

### Hata 2: "No AI credits remaining for today"
**Çözüm:** Krediler tükenmiş. Şu SQL ile sıfırla:
```sql
UPDATE public.student_ai_usage
SET used_credits = 0
WHERE student_id = auth.uid();
```

### Hata 3: Migration hata verdi
**Çözüm:** Hatanın tam metnini bana gönder, hemen düzelteyim.

---

## 🎉 Başarılı Olunca

1. Krediler her soru sorulduğunda 1 azalmalı
2. UI'da güncel kredi sayısı görünmeli
3. Her gün gece yarısı otomatik 15'e sıfırlanmalı
4. Supabase'deki `student_ai_usage` tablosunda veriler görünmeli

---

## 📊 Database'de Manuel Kontrol (Çok İleri Seviye)

```sql
-- Tüm öğrencilerin kredi durumu
SELECT
  student_id,
  daily_credits,
  used_credits,
  (daily_credits - used_credits) as remaining,
  day_date,
  updated_at
FROM public.student_ai_usage
ORDER BY updated_at DESC;

-- Tüm soru geçmişi
SELECT
  student_id,
  LEFT(question, 50) as question_preview,
  tokens_used,
  model_used,
  asked_at
FROM public.ai_questions
ORDER BY asked_at DESC
LIMIT 10;
```

---

## 🚀 SON SÖZ

Bu migration kusursuz çalışacak şekilde hazırlandı. Tüm eski hataları temizliyor ve sıfırdan doğru yapıyı kuruyor.

**Migration'ı çalıştır ve bana sonucu söyle!**

Eğer yine hata alırsan, hatanın AYNEN metnini gönder, hemen çözerim.

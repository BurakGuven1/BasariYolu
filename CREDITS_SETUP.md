# AI Kredi Sistemi Kurulum Rehberi

## Sorun
Günlük AI kredileri UI'da ve backend'de azalmıyor. Krediler Supabase'deki `student_ai_usage` tablosunda tutulmalı ve her soruda 1 azalmalı.

## Çözüm: Migration'ı Supabase'de Çalıştır

### Adım 1: Migration Durumunu Kontrol Et

1. **Supabase Dashboard**'u aç: https://app.supabase.com
2. Projeyi seç
3. Sol menüden **SQL Editor** seç
4. **New Query** butonuna tıkla
5. `test-credits-migration.sql` dosyasının içeriğini kopyala ve SQL Editor'e yapıştır
6. **RUN** butonuna bas

**Sonuç:**
- Tüm değerler `TRUE` ise ✅ Migration zaten uygulanmış (Adım 3'e geç)
- Herhangi biri `FALSE` ise ❌ Migration'ı çalıştırman gerekiyor (Adım 2'ye geç)

### Adım 2: Migration'ı Çalıştır (Sadece gerekirse)

1. Supabase **SQL Editor**'de yeni bir query aç
2. `supabase/migrations/20251118070000_ai_credits_system.sql` dosyasının **TÜM İÇERİĞİNİ** kopyala
3. SQL Editor'e yapıştır
4. **RUN** butonuna bas
5. Hata almazsan ✅ Migration başarılı!

### Adım 3: Sistemi Test Et

1. Öğrenci hesabıyla giriş yap
2. **Yapay Zekaya Sor** paneline git
3. Bir soru sor
4. Kredi sayısının **15/15**'ten **14/15**'e düştüğünü kontrol et

### Adım 4: Database'de Kontrol (Opsiyonel)

Supabase SQL Editor'de şunu çalıştır:

```sql
-- Tüm öğrencilerin kredi durumunu göster
SELECT
  student_id,
  daily_credits,
  used_credits,
  (daily_credits - used_credits) as remaining,
  day_date,
  updated_at
FROM public.student_ai_usage
ORDER BY updated_at DESC;

-- Tüm AI sorularını göster
SELECT
  student_id,
  question,
  tokens_used,
  model_used,
  asked_at
FROM public.ai_questions
ORDER BY asked_at DESC
LIMIT 10;
```

## Migration Ne Yapar?

1. **student_ai_usage** tablosu oluşturur
   - Her öğrenci için günlük kredi durumunu tutar
   - Günlük 15 kredi limiti
   - Her gün otomatik sıfırlanır

2. **ai_questions** tablosu oluşturur
   - Tüm AI soru geçmişini kaydeder
   - Token kullanımı ve model bilgisi

3. **RPC Fonksiyonları** oluşturur
   - `get_student_ai_credits(student_id)` - Kredi durumunu getir
   - `use_ai_credit(...)` - 1 kredi kullan ve soruyu kaydet
   - `get_ai_usage_stats(student_id)` - İstatistikleri getir

4. **RLS Policies** ekler
   - Öğrenciler sadece kendi kredilerini görebilir
   - Güvenli veri erişimi

## Sorun Devam Ederse

1. Browser Console'u aç (F12)
2. Network sekmesine git
3. Bir soru sor
4. `ask-ai` isteğine tıkla
5. Response'u incele - hata varsa bana göster

## Teknik Detaylar

- **Backend:** `supabase/functions/ask-ai/index.ts` - Her soruda `use_ai_credit()` fonksiyonu çağrılıyor
- **Frontend:** `src/components/AIChatPanel.tsx` - UI'da kredi sayısı gösteriliyor
- **Migration:** `supabase/migrations/20251118070000_ai_credits_system.sql` - Database yapısı

# Topic Recommendations & Exam Weak Topics RLS Fix

## Sorun
Deneme kaydedilirken `topic_recommendations` ve `exam_weak_topics` tablolarına yazma izni yoktu (RLS policy hatası):

```
Error: new row violates row-level security policy for table "topic_recommendations"
```

## Çözüm
Yeni migration dosyası oluşturuldu: `supabase/migrations/20251118150000_fix_topic_recommendations_rls.sql`

Bu migration:
- ✅ `topic_recommendations` tablosunu oluşturur (yoksa)
- ✅ `exam_weak_topics` tablosunu oluşturur (yoksa)
- ✅ RLS policy'lerini düzeltir (öğrenciler kendi kayıtlarını ekleyebilir)
- ✅ İndeksleri oluşturur
- ✅ `updated_at` trigger'ını ekler
- ✅ Gerekli izinleri (GRANT) verir

## Nasıl Uygulanır?

### Yöntem 1: Supabase CLI (Önerilen)
```bash
cd /home/user/BasariYolu
npx supabase db push
```

### Yöntem 2: Supabase Dashboard (Manuel)
1. [Supabase Dashboard](https://supabase.com/dashboard) > Projen > SQL Editor
2. `supabase/migrations/20251118150000_fix_topic_recommendations_rls.sql` dosyasını aç
3. İçeriği kopyala ve SQL Editor'e yapıştır
4. "Run" butonuna tıkla

### Yöntem 3: SQL Direct Execute
```bash
# Supabase DB URL'ini al
SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres"

# Migration'ı uygula
psql $SUPABASE_DB_URL -f supabase/migrations/20251118150000_fix_topic_recommendations_rls.sql
```

## Test Etme

Migration uygulandıktan sonra:

1. Bir deneme sonucu ekle (ExamForm'dan)
2. Zayıf konuları seç (3 konu)
3. Console'da şu hatayı görmemelisin:
   - ❌ `Error saving recommendations`
   - ✅ `✅ Recommendations saved successfully`

4. "AI Analiz & Akıllı Plan" sekmesine git
5. Öncelikli konuların göründüğünü kontrol et

## Tablo Yapıları

### topic_recommendations
| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | UUID | Primary Key |
| student_id | UUID | Foreign Key (profiles) |
| subject | TEXT | Ders adı |
| topic | TEXT | Konu adı |
| weakness_score | NUMERIC | Zayıflık skoru (0-100) |
| frequency_score | NUMERIC | Sınav sıklığı (0-100) |
| priority_score | NUMERIC | Öncelik skoru (weakness × frequency) |
| recommendation_text | TEXT | Kişiselleştirilmiş öneri |
| study_hours_needed | NUMERIC | Tahmini çalışma saati |
| resources | JSONB | Önerilen kaynaklar |
| status | TEXT | active/completed/archived |
| created_at | TIMESTAMPTZ | Oluşturulma tarihi |
| updated_at | TIMESTAMPTZ | Güncellenme tarihi |

### exam_weak_topics
| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | UUID | Primary Key |
| exam_result_id | UUID | Foreign Key (exam_results) |
| student_id | UUID | Foreign Key (profiles) |
| subject | TEXT | Ders adı |
| topic | TEXT | Konu adı |
| wrong_count | INTEGER | Yanlış sayısı |
| total_count | INTEGER | Toplam soru |
| percentage_wrong | NUMERIC | Yanlış yüzdesi |
| created_at | TIMESTAMPTZ | Oluşturulma tarihi |

## RLS Policies

Her iki tablo için de:
- ✅ SELECT: Öğrenci kendi kayıtlarını görebilir
- ✅ INSERT: Öğrenci kendi kayıtlarını ekleyebilir
- ✅ UPDATE: Öğrenci kendi kayıtlarını güncelleyebilir
- ✅ DELETE: Öğrenci kendi kayıtlarını silebilir

Policy koşulu: `auth.uid() = student_id`

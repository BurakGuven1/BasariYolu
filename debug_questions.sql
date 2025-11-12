-- ===================================
-- SORU BANKASI TANI SORGULAMASI
-- ===================================

-- 1. Veritabanında hangi subject isimleri var?
SELECT
  subject,
  COUNT(*) as soru_sayisi,
  array_agg(DISTINCT tags) as etiketler
FROM questions
GROUP BY subject
ORDER BY soru_sayisi DESC;

-- 2. TYT etiketli sorular hangi derslerden?
SELECT
  subject,
  COUNT(*) as soru_sayisi,
  array_agg(DISTINCT topic) as konular
FROM questions
WHERE 'tyt' = ANY(tags)
GROUP BY subject
ORDER BY soru_sayisi DESC;

-- 3. Tüm subject ve tag kombinasyonları
SELECT
  subject,
  unnest(tags) as tag,
  COUNT(*) as soru_sayisi
FROM questions
GROUP BY subject, tag
ORDER BY subject, soru_sayisi DESC;

-- 4. Türkçe benzeri isimler (case insensitive)
SELECT
  subject,
  COUNT(*) as soru_sayisi
FROM questions
WHERE LOWER(subject) LIKE '%turk%'
   OR LOWER(subject) LIKE '%türk%'
GROUP BY subject;

-- 5. Sosyal benzeri isimler
SELECT
  subject,
  COUNT(*) as soru_sayisi
FROM questions
WHERE LOWER(subject) LIKE '%sosyal%'
GROUP BY subject;

-- 6. Fen benzeri isimler
SELECT
  subject,
  COUNT(*) as soru_sayisi
FROM questions
WHERE LOWER(subject) LIKE '%fen%'
GROUP BY subject;

-- 7. Matematik sorular kontrol
SELECT
  subject,
  COUNT(*) as soru_sayisi,
  array_agg(DISTINCT tags) as etiketler
FROM questions
WHERE LOWER(subject) LIKE '%mat%'
GROUP BY subject;

-- 8. Son 10 soru örneği (hangi formatlarla kaydedilmiş görmek için)
SELECT
  id,
  subject,
  topic,
  tags,
  difficulty,
  owner_type,
  created_at
FROM questions
ORDER BY created_at DESC
LIMIT 10;

-- 9. Toplam soru sayısı ve dağılım özeti
SELECT
  COUNT(*) as toplam_soru,
  COUNT(DISTINCT subject) as farkli_ders_sayisi,
  COUNT(DISTINCT topic) as farkli_konu_sayisi
FROM questions;

-- ===================================
-- ÇÖZÜM ÖNERİSİ: Eğer subject isimleri farklıysa güncelleme
-- ===================================

-- Örnek: Eğer "Türkçe" olarak kaydedilmişse "Turkce" yapma
-- UPDATE questions SET subject = 'Turkce' WHERE subject = 'Türkçe';
-- UPDATE questions SET subject = 'Matematik' WHERE subject IN ('matematik', 'Mat', 'MAT');
-- UPDATE questions SET subject = 'Fen' WHERE subject IN ('Fen Bilimleri', 'fen', 'FEN');
-- UPDATE questions SET subject = 'Sosyal' WHERE subject IN ('Sosyal Bilgiler', 'Sosyal Bilimler', 'sosyal');

-- ===================================
-- NOT: Yukarıdaki sorguları Supabase SQL Editor'de tek tek çalıştır
-- ===================================

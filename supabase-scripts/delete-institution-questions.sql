-- ============================================
-- SUPABASE SQL SCRIPTS FOR QUESTION MANAGEMENT
-- ============================================

-- Script 1: TÜM SORULARI SİL (DİKKATLİ KULLAN!)
-- ============================================
-- Bu script questions tablosundaki TÜM soruları siler
-- UYARI: Bu işlem geri alınamaz!

-- ÇALIŞTIRMADAN ÖNCE YEDEK ALIN:
-- 1. Supabase Dashboard -> Table Editor -> questions
-- 2. "Export as CSV" ile yedek alın

DELETE FROM questions;

-- İşlem sonucu kontrol et
SELECT COUNT(*) as kalan_soru_sayisi FROM questions;


-- Script 2: SADECE KURUM SORULARINI SİL
-- ============================================
-- Sadece belirli bir kurumun sorularını silmek için

-- Önce kurumunuzun ID'sini bulun:
SELECT id, name FROM institutions;

-- Sonra kurumun sorularını silin (KURUM_ID'yi değiştirin):
-- DELETE FROM questions
-- WHERE owner_type = 'institution'
--   AND owner_id = 'KURUM_ID_BURAYA';


-- Script 3: SADECE PLATFORM SORULARINI KORUYUP KURUMLARINKILERI SİL
-- ============================================
-- Platform sorularını korur, sadece kurum ve teacher sorularını siler

DELETE FROM questions
WHERE owner_type IN ('institution', 'teacher');

-- İşlem sonucu kontrol et
SELECT
  owner_type,
  COUNT(*) as soru_sayisi
FROM questions
GROUP BY owner_type;


-- Script 4: BELİRLİ TARİHTEN ÖNCEKİ SORULARI SİL
-- ============================================
-- Belirli bir tarihten önceki soruları silmek için

-- DELETE FROM questions
-- WHERE created_at < '2025-01-01'::timestamp;


-- Script 5: SORU İSTATİSTİKLERİNİ GÖRÜNTÜLE (Silmeden önce)
-- ============================================
-- Silme işleminden önce mevcut durumu görmek için

SELECT
  owner_type,
  subject,
  COUNT(*) as soru_sayisi,
  MIN(created_at) as ilk_soru_tarihi,
  MAX(created_at) as son_soru_tarihi
FROM questions
GROUP BY owner_type, subject
ORDER BY owner_type, subject;


-- Script 6: YEDEK TABLOSU OLUŞTUR (Opsiyonel)
-- ============================================
-- Silmeden önce yedek almak için

-- CREATE TABLE questions_backup AS
-- SELECT * FROM questions;

-- Yedekten geri yüklemek için:
-- TRUNCATE questions;
-- INSERT INTO questions SELECT * FROM questions_backup;


-- Script 7: AUTO INCREMENT SIFIRLA (Eğer varsa)
-- ============================================
-- Tüm soruları sildikten sonra ID sırasını sıfırlamak için
-- Not: Supabase UUID kullanıyorsa bu gerekli değildir

-- ALTER SEQUENCE questions_id_seq RESTART WITH 1;

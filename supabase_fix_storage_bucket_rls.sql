-- Supabase SQL Editor'da çalıştır
-- student-exam-artifacts bucket'ına upload izni ver

-- 1. Bucket'ın mevcut policy'lerini kontrol et
SELECT *
FROM storage.policies
WHERE bucket_id = 'student-exam-artifacts';

-- 2. Tüm eski policy'leri sil (varsa)
DELETE FROM storage.policies
WHERE bucket_id = 'student-exam-artifacts';

-- 3. Yeni policy'ler ekle - authenticated kullanıcılar her şeyi yapabilir

-- SELECT (Download/View) - Herkes görebilir
INSERT INTO storage.policies (bucket_id, name, definition, check)
VALUES (
  'student-exam-artifacts',
  'Authenticated users can view files',
  'bucket_id = ''student-exam-artifacts''',
  '(SELECT auth.role() = ''authenticated'')'::text
);

-- INSERT (Upload) - Authenticated kullanıcılar yükleyebilir
INSERT INTO storage.policies (bucket_id, name, definition, check)
VALUES (
  'student-exam-artifacts',
  'Authenticated users can upload files',
  'bucket_id = ''student-exam-artifacts''',
  '(SELECT auth.role() = ''authenticated'')'::text
);

-- UPDATE - Authenticated kullanıcılar güncelleyebilir
INSERT INTO storage.policies (bucket_id, name, definition, check)
VALUES (
  'student-exam-artifacts',
  'Authenticated users can update files',
  'bucket_id = ''student-exam-artifacts''',
  '(SELECT auth.role() = ''authenticated'')'::text
);

-- DELETE - Authenticated kullanıcılar silebilir
INSERT INTO storage.policies (bucket_id, name, definition, check)
VALUES (
  'student-exam-artifacts',
  'Authenticated users can delete files',
  'bucket_id = ''student-exam-artifacts''',
  '(SELECT auth.role() = ''authenticated'')'::text
);

-- 4. Kontrol et
SELECT
  id,
  name,
  definition,
  check
FROM storage.policies
WHERE bucket_id = 'student-exam-artifacts';

-- Başarılı mesajı
SELECT 'SUCCESS! Artık fotoğraf yükleyebilirsin!' as message;

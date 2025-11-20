-- Supabase SQL Editor'da çalıştır
-- student-exam-artifacts bucket'ına upload izni ver (DÜZELTME)

-- 1. Önce mevcut policy'leri kontrol et
SELECT id, name, definition
FROM storage.policies
WHERE bucket_id = 'student-exam-artifacts';

-- 2. Eski policy'leri sil
DELETE FROM storage.policies
WHERE bucket_id = 'student-exam-artifacts';

-- 3. YENİ YÖNTEM: storage.objects tablosuna RLS policy ekle

-- Objects tablosunda RLS'i aktif et (zaten aktif olabilir)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Eski policy'leri sil (varsa)
DROP POLICY IF EXISTS "authenticated_select_student_artifacts" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_insert_student_artifacts" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_update_student_artifacts" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_delete_student_artifacts" ON storage.objects;

-- SELECT (Herkes okuyabilir)
CREATE POLICY "authenticated_select_student_artifacts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'student-exam-artifacts');

-- INSERT (Authenticated kullanıcılar yükleyebilir)
CREATE POLICY "authenticated_insert_student_artifacts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'student-exam-artifacts');

-- UPDATE (Authenticated kullanıcılar güncelleyebilir)
CREATE POLICY "authenticated_update_student_artifacts"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'student-exam-artifacts')
WITH CHECK (bucket_id = 'student-exam-artifacts');

-- DELETE (Authenticated kullanıcılar silebilir)
CREATE POLICY "authenticated_delete_student_artifacts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'student-exam-artifacts');

-- 4. Kontrol et
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects' AND policyname LIKE '%student_artifacts%';

SELECT 'SUCCESS! Storage bucket policy düzeltildi!' as message;

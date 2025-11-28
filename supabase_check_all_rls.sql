-- Supabase SQL Editor'da çalıştır
-- Proje genelinde tüm tabloların RLS durumunu kontrol et

-- 1. RLS aktif olan ve olmayan tabloları listele
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*)
   FROM pg_policies
   WHERE schemaname = t.schemaname
   AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
ORDER BY rls_enabled DESC, tablename;

-- 2. Kritik tabloları özel olarak kontrol et
SELECT
  t.tablename,
  t.rowsecurity as rls_enabled,
  COUNT(p.policyname) as policy_count,
  string_agg(p.policyname, ', ' ORDER BY p.policyname) as policies
FROM pg_tables t
LEFT JOIN pg_policies p ON p.schemaname = t.schemaname AND p.tablename = t.tablename
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'students',
    'teachers',
    'parents',
    'exam_results',
    'homeworks',
    'topic_scores',
    'classes',
    'class_students',
    'student_questions',
    'student_answers',
    'question_likes',
    'answer_likes',
    'institution_questions',
    'institution_question_bank',
    'institution_exams',
    'institution_students'
  )
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- 3. RLS olmayan ama olması gereken kritik tabloları bul
SELECT
  tablename,
  'RLS DİSABLED - Risk!' as warning
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
  AND tablename IN (
    'students',
    'teachers',
    'parents',
    'exam_results',
    'homeworks',
    'topic_scores',
    'classes',
    'class_students',
    'institution_students',
    'institution_questions',
    'institution_exams'
  )
ORDER BY tablename;

-- 4. Storage bucket'ların durumunu kontrol et
SELECT
  id as bucket_name,
  public as is_public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
ORDER BY id;

-- 5. Storage.objects RLS policy'leri
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;

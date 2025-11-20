-- RLS false olan ama policy'leri olan kritik tabloları detaylı kontrol et

-- 1. RLS disabled ama policy'leri var (sadece aktif etmemiz yeterli)
SELECT
  t.tablename,
  t.rowsecurity as rls_enabled,
  COUNT(p.policyname) as policy_count,
  string_agg(p.policyname || ' (' || p.cmd || ')', E'\n  ') as policies
FROM pg_tables t
LEFT JOIN pg_policies p ON p.schemaname = t.schemaname AND p.tablename = t.tablename
WHERE t.schemaname = 'public'
  AND t.rowsecurity = false
  AND t.tablename IN (
    'students',
    'teachers',
    'profiles',
    'classes',
    'class_students',
    'class_exams',
    'class_exam_results',
    'points_transactions',
    'study_schedules',
    'study_schedule_items',
    'institutions',
    'institution_members'
  )
GROUP BY t.tablename, t.rowsecurity
HAVING COUNT(p.policyname) > 0
ORDER BY policy_count DESC;

-- 2. RLS disabled ve policy YOK (hem policy hem RLS eklemeliyiz)
SELECT
  tablename,
  'NO POLICIES - Need to add' as status
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
  AND tablename IN (
    'students',
    'teachers',
    'profiles',
    'classes',
    'class_students',
    'class_exams',
    'class_exam_results',
    'payment_history',
    'institutions',
    'institution_members',
    'teacher_billing'
  )
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public'
    AND p.tablename = pg_tables.tablename
  )
ORDER BY tablename;

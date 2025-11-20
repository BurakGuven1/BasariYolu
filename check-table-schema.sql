-- Check current student_ai_usage table schema
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'student_ai_usage'
ORDER BY ordinal_position;

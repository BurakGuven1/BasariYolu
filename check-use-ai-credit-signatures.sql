-- Check all use_ai_credit function signatures
SELECT
    routine_name,
    routine_type,
    proargnames as parameter_names,
    pg_get_function_arguments(p.oid) as full_signature
FROM information_schema.routines r
JOIN pg_proc p ON p.proname = r.routine_name
WHERE routine_schema = 'public'
  AND routine_name = 'use_ai_credit'
ORDER BY full_signature;

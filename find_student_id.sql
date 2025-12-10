-- Find correct student ID for profesyonel@test.com

-- Check in profiles table
SELECT
  'PROFILES TABLE' as source,
  id,
  email,
  full_name,
  role
FROM public.profiles
WHERE email = 'profesyonel@test.com';

-- Check in auth.users table
SELECT
  'AUTH.USERS TABLE' as source,
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'profesyonel@test.com';

-- Check if there's a mismatch
SELECT
  'ID MISMATCH CHECK' as check_type,
  p.id as profile_id,
  au.id as auth_id,
  CASE
    WHEN p.id = au.id THEN 'IDs MATCH ✓'
    ELSE 'IDs DO NOT MATCH ✗'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON p.email = au.email
WHERE au.email = 'profesyonel@test.com';

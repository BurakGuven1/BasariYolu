-- Fix existing user roles
-- Run this in Supabase SQL Editor

-- 1. Fix institution owners who have wrong role
UPDATE profiles
SET role = 'institution'
WHERE id IN (
  SELECT DISTINCT user_id
  FROM institution_members
  WHERE role = 'owner'
)
AND role != 'institution';

-- 2. Fix teachers who have wrong role
UPDATE profiles
SET role = 'teacher'
WHERE id IN (
  SELECT DISTINCT user_id
  FROM teachers
  WHERE user_id IS NOT NULL
)
AND role != 'teacher';

-- 3. Verify institution users
SELECT
  p.id,
  p.email,
  p.full_name,
  p.role as profile_role,
  im.role as institution_role,
  i.name as institution_name
FROM profiles p
JOIN institution_members im ON p.id = im.user_id
JOIN institutions i ON im.institution_id = i.id
WHERE im.role = 'owner'
ORDER BY p.email;

-- 4. Verify teacher users
SELECT
  p.id,
  p.email,
  p.full_name,
  p.role as profile_role,
  t.full_name as teacher_name
FROM profiles p
JOIN teachers t ON p.id = t.user_id
ORDER BY p.email;

-- =====================================================
-- QUICK FIX: Update Minel Güven to be a coach
-- =====================================================
-- This script updates the teacher to become a coach

-- Update the profile to enable coaching
UPDATE profiles
SET
  is_coach = true,
  coach_bio = 'Bergama YKP''de deneyimli öğretmen. Öğrenci başarısı ve hedef odaklı çalışma konusunda uzmanım.',
  coach_specializations = ARRAY['Matematik', 'Fen Bilimleri', 'TYT', 'LGS'],
  coach_hourly_rate = 250.00
WHERE id = 'b7ccaee3-7b88-444a-bea1-e73ce059c234';

-- Verify the update
SELECT
  id,
  full_name,
  role,
  is_coach,
  coach_bio,
  coach_specializations,
  coach_hourly_rate
FROM profiles
WHERE id = 'b7ccaee3-7b88-444a-bea1-e73ce059c234';

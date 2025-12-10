-- =====================================================
-- COACHING TEST USERS SETUP
-- =====================================================

-- 1. Make muho@gmail.com a coach
UPDATE profiles
SET is_coach = true,
    coach_bio = 'Deneyimli eğitim koçu. 10 yıllık öğretmenlik ve koçluk deneyimi.',
    coach_specializations = ARRAY['Sınav Stratejileri', 'Motivasyon', 'Zaman Yönetimi', 'Kariyer Danışmanlığı'],
    coach_hourly_rate = 200,
    coach_availability_timezone = 'Europe/Istanbul'
WHERE email = 'muho@gmail.com';

-- 2. Get user IDs
DO $$
DECLARE
  v_student_id UUID;
  v_coach_id UUID;
  v_package_id UUID;
BEGIN
  -- Get student ID (demefa3309@roastic.com)
  SELECT id INTO v_student_id
  FROM profiles
  WHERE email = 'demefa3309@roastic.com'
  LIMIT 1;

  -- Get coach ID (muho@gmail.com)
  SELECT id INTO v_coach_id
  FROM profiles
  WHERE email = 'muho@gmail.com'
  LIMIT 1;

  -- Get Profesyonel package (48 sessions)
  SELECT id INTO v_package_id
  FROM coaching_packages
  WHERE name ILIKE '%profesyonel%'
     OR session_count = 48
  ORDER BY session_count DESC
  LIMIT 1;

  -- If no 48 session package exists, create it
  IF v_package_id IS NULL THEN
    INSERT INTO coaching_packages (
      name, description, session_count, duration_days, price, is_active, is_popular
    ) VALUES (
      'Profesyonel Paket',
      '48 seanslık kapsamlı koçluk programı. Üniversite hazırlık ve kariyer planlaması için ideal.',
      48,
      180,
      9600,
      true,
      true
    )
    RETURNING id INTO v_package_id;
  END IF;

  -- 3. Create active subscription for student
  INSERT INTO student_coaching_subscriptions (
    student_id,
    coach_id,
    package_id,
    start_date,
    end_date,
    remaining_sessions,
    total_sessions,
    status,
    purchase_price
  )
  SELECT
    v_student_id,
    v_coach_id,
    v_package_id,
    NOW(),
    NOW() + INTERVAL '180 days',
    cp.session_count,
    cp.session_count,
    'active',
    cp.price
  FROM coaching_packages cp
  WHERE cp.id = v_package_id
  ON CONFLICT (student_id, coach_id)
  DO UPDATE SET
    remaining_sessions = EXCLUDED.remaining_sessions,
    total_sessions = EXCLUDED.total_sessions,
    status = 'active',
    updated_at = NOW();

  -- 4. Add coach availability (example schedule)
  INSERT INTO coach_availability (coach_id, day_of_week, start_time, end_time, is_available)
  VALUES
    -- Monday
    (v_coach_id, 1, '09:00', '12:00', true),
    (v_coach_id, 1, '14:00', '17:00', true),
    -- Wednesday
    (v_coach_id, 3, '09:00', '12:00', true),
    (v_coach_id, 3, '14:00', '17:00', true),
    -- Friday
    (v_coach_id, 5, '09:00', '12:00', true),
    (v_coach_id, 5, '14:00', '17:00', true)
  ON CONFLICT (coach_id, day_of_week, start_time)
  DO UPDATE SET
    is_available = EXCLUDED.is_available,
    updated_at = NOW();

  RAISE NOTICE 'Setup complete!';
  RAISE NOTICE 'Student ID: %', v_student_id;
  RAISE NOTICE 'Coach ID: %', v_coach_id;
  RAISE NOTICE 'Package ID: %', v_package_id;
END $$;

-- 5. Verify setup
SELECT
  p.email,
  p.full_name,
  p.is_coach,
  p.coach_bio
FROM profiles p
WHERE p.email IN ('muho@gmail.com', 'demefa3309@roastic.com')
ORDER BY p.is_coach DESC;

-- Check subscription
SELECT
  scs.id,
  student.email as student_email,
  coach.email as coach_email,
  pkg.name as package_name,
  scs.remaining_sessions,
  scs.total_sessions,
  scs.status
FROM student_coaching_subscriptions scs
JOIN profiles student ON student.id = scs.student_id
JOIN profiles coach ON coach.id = scs.coach_id
JOIN coaching_packages pkg ON pkg.id = scs.package_id
WHERE student.email = 'demefa3309@roastic.com'
   OR coach.email = 'muho@gmail.com';

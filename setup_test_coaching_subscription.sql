-- Test Coaching Subscription Setup
-- Sets up profesyonel@test.com with a Standard coaching package

-- Step 1: Get the student's profile ID
DO $$
DECLARE
  v_student_id UUID;
  v_coach_id UUID;
  v_package_id UUID;
  v_subscription_id UUID;
BEGIN
  -- Find student profile
  SELECT id INTO v_student_id
  FROM public.profiles
  WHERE email = 'profesyonel@test.com'
  LIMIT 1;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Student with email profesyonel@test.com not found';
  END IF;

  RAISE NOTICE 'Student ID: %', v_student_id;

  -- Find or create a test coach
  -- First check if we have any approved coaches
  SELECT id INTO v_coach_id
  FROM public.profiles
  WHERE is_coach = TRUE
  AND role = 'teacher'
  LIMIT 1;

  -- If no coach exists, create a test coach
  IF v_coach_id IS NULL THEN
    RAISE NOTICE 'No existing coach found, creating test coach...';

    -- Create test coach profile if not exists
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'testcoach@basariyolum.com',
      crypt('TestCoach123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO v_coach_id;

    -- Create profile for test coach
    INSERT INTO public.profiles (id, email, full_name, role, is_coach, coach_bio, coach_specializations, coach_availability_timezone)
    VALUES (
      v_coach_id,
      'testcoach@basariyolum.com',
      'Test Koç',
      'teacher',
      TRUE,
      'Test amaçlı oluşturulmuş deneyimli koç. Motivasyon ve sınav stratejileri konusunda uzman.',
      ARRAY['Sınav Stratejileri', 'Motivasyon Koçluğu', 'Zaman Yönetimi'],
      'Europe/Istanbul'
    )
    ON CONFLICT (id) DO UPDATE
    SET is_coach = TRUE,
        coach_bio = EXCLUDED.coach_bio,
        coach_specializations = EXCLUDED.coach_specializations;

    -- Get the coach ID again
    SELECT id INTO v_coach_id
    FROM public.profiles
    WHERE email = 'testcoach@basariyolum.com';
  ELSE
    RAISE NOTICE 'Using existing coach ID: %', v_coach_id;
  END IF;

  -- Find Standard package
  SELECT id INTO v_package_id
  FROM public.coaching_packages
  WHERE name ILIKE '%standart%' OR name ILIKE '%standard%'
  AND is_active = TRUE
  LIMIT 1;

  -- If no Standard package, find any active package
  IF v_package_id IS NULL THEN
    SELECT id INTO v_package_id
    FROM public.coaching_packages
    WHERE is_active = TRUE
    ORDER BY session_count ASC
    LIMIT 1;
  END IF;

  IF v_package_id IS NULL THEN
    RAISE EXCEPTION 'No active coaching package found. Please create a package first.';
  END IF;

  RAISE NOTICE 'Package ID: %', v_package_id;

  -- Check if subscription already exists
  SELECT id INTO v_subscription_id
  FROM public.student_coaching_subscriptions
  WHERE student_id = v_student_id
  AND coach_id = v_coach_id
  AND status = 'active';

  IF v_subscription_id IS NOT NULL THEN
    RAISE NOTICE 'Active subscription already exists with ID: %', v_subscription_id;
    RAISE NOTICE 'Skipping creation.';
  ELSE
    -- Create coaching subscription
    INSERT INTO public.student_coaching_subscriptions (
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
      cp.id,
      NOW(),
      NOW() + (cp.duration_days || ' days')::INTERVAL,
      cp.session_count,
      cp.session_count,
      'active',
      cp.price
    FROM public.coaching_packages cp
    WHERE cp.id = v_package_id
    RETURNING id INTO v_subscription_id;

    RAISE NOTICE 'Created subscription ID: %', v_subscription_id;
    RAISE NOTICE 'Test coaching subscription setup completed successfully!';
    RAISE NOTICE 'Student profesyonel@test.com can now request appointments from the coach.';
  END IF;

END $$;

-- Verify the subscription
SELECT
  scs.id as subscription_id,
  sp.email as student_email,
  sp.full_name as student_name,
  cp_prof.email as coach_email,
  cp_prof.full_name as coach_name,
  pkg.name as package_name,
  scs.remaining_sessions || '/' || scs.total_sessions as sessions,
  scs.status,
  scs.start_date::DATE,
  scs.end_date::DATE
FROM public.student_coaching_subscriptions scs
JOIN public.profiles sp ON sp.id = scs.student_id
JOIN public.profiles cp_prof ON cp_prof.id = scs.coach_id
JOIN public.coaching_packages pkg ON pkg.id = scs.package_id
WHERE sp.email = 'profesyonel@test.com'
ORDER BY scs.created_at DESC
LIMIT 1;

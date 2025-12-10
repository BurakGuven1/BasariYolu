-- Fix Coaching Subscription for profesyonel@test.com
-- Delete old subscription and create new one with correct student_id

DO $$
DECLARE
  v_student_id UUID := '6e0c8ce2-e5bd-402b-8ad2-9dbc6f17da87';
  v_coach_id UUID;
  v_package_id UUID;
  v_subscription_id UUID;
BEGIN
  RAISE NOTICE 'Starting fix for student ID: %', v_student_id;

  -- Verify student exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_student_id) THEN
    RAISE EXCEPTION 'Student with ID % not found', v_student_id;
  END IF;

  -- Delete any existing subscriptions for this student
  DELETE FROM public.student_coaching_subscriptions
  WHERE student_id = v_student_id;

  RAISE NOTICE 'Deleted old subscriptions for student';

  -- Find or use existing approved coach
  SELECT id INTO v_coach_id
  FROM public.profiles
  WHERE is_coach = TRUE
  AND role = 'teacher'
  LIMIT 1;

  IF v_coach_id IS NULL THEN
    RAISE EXCEPTION 'No approved coach found. Please run setup_test_coaching_subscription.sql first to create a test coach.';
  END IF;

  RAISE NOTICE 'Using coach ID: %', v_coach_id;

  -- Find Standard package (or any active package)
  SELECT id INTO v_package_id
  FROM public.coaching_packages
  WHERE name ILIKE '%standart%' OR name ILIKE '%standard%'
  AND is_active = TRUE
  LIMIT 1;

  IF v_package_id IS NULL THEN
    SELECT id INTO v_package_id
    FROM public.coaching_packages
    WHERE is_active = TRUE
    ORDER BY session_count ASC
    LIMIT 1;
  END IF;

  IF v_package_id IS NULL THEN
    RAISE EXCEPTION 'No active coaching package found';
  END IF;

  RAISE NOTICE 'Using package ID: %', v_package_id;

  -- Create coaching subscription with correct student_id
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
  RAISE NOTICE 'SUCCESS! Subscription fixed for profesyonel@test.com';
  RAISE NOTICE 'Student can now see their active coaching subscription in the UI.';

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
WHERE scs.student_id = '6e0c8ce2-e5bd-402b-8ad2-9dbc6f17da87'
ORDER BY scs.created_at DESC
LIMIT 1;

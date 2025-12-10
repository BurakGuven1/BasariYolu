-- Create Coaching Subscription for profesyonel@test.com
-- Automatically finds correct student_id from profiles table

DO $$
DECLARE
  v_student_id UUID;
  v_coach_id UUID;
  v_package_id UUID;
  v_subscription_id UUID;
  v_student_email TEXT := 'profesyonel@test.com';
BEGIN
  RAISE NOTICE 'Looking for student with email: %', v_student_email;

  -- Find student by email in profiles table
  SELECT id INTO v_student_id
  FROM public.profiles
  WHERE email = v_student_email
  AND role = 'student'
  LIMIT 1;

  IF v_student_id IS NULL THEN
    -- Try without role filter
    SELECT id INTO v_student_id
    FROM public.profiles
    WHERE email = v_student_email
    LIMIT 1;
  END IF;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'No profile found for email: %. Please check if user exists in profiles table.', v_student_email;
  END IF;

  RAISE NOTICE 'Found student ID: %', v_student_id;

  -- Delete any existing subscriptions for this student
  DELETE FROM public.student_coaching_subscriptions
  WHERE student_id = v_student_id;

  RAISE NOTICE 'Deleted old subscriptions (if any)';

  -- Find an approved coach
  SELECT id INTO v_coach_id
  FROM public.profiles
  WHERE is_coach = TRUE
  AND role = 'teacher'
  LIMIT 1;

  IF v_coach_id IS NULL THEN
    RAISE EXCEPTION 'No approved coach found. Please ensure at least one teacher has is_coach = TRUE';
  END IF;

  RAISE NOTICE 'Using coach ID: %', v_coach_id;

  -- Find Standard package (or any active package)
  SELECT id INTO v_package_id
  FROM public.coaching_packages
  WHERE (name ILIKE '%standart%' OR name ILIKE '%standard%')
  AND is_active = TRUE
  LIMIT 1;

  IF v_package_id IS NULL THEN
    -- Get first active package
    SELECT id INTO v_package_id
    FROM public.coaching_packages
    WHERE is_active = TRUE
    ORDER BY session_count ASC
    LIMIT 1;
  END IF;

  IF v_package_id IS NULL THEN
    RAISE EXCEPTION 'No active coaching package found. Please create a package first.';
  END IF;

  RAISE NOTICE 'Using package ID: %', v_package_id;

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

  RAISE NOTICE '✅ SUCCESS! Created subscription ID: %', v_subscription_id;
  RAISE NOTICE '✅ Student % can now see their active coaching subscription', v_student_email;
  RAISE NOTICE '';
  RAISE NOTICE '👉 NEXT STEPS:';
  RAISE NOTICE '1. Hard refresh the browser (Ctrl+Shift+R)';
  RAISE NOTICE '2. Login as %', v_student_email;
  RAISE NOTICE '3. Go to Koçluk tab';
  RAISE NOTICE '4. "Paketler" tab should be HIDDEN';
  RAISE NOTICE '5. You should see active coaching package in "Koçluğum" tab';

END $$;

-- Verify the subscription
SELECT
  '✅ VERIFICATION' as status,
  scs.id as subscription_id,
  sp.email as student_email,
  sp.full_name as student_name,
  cp_prof.email as coach_email,
  cp_prof.full_name as coach_name,
  pkg.name as package_name,
  scs.remaining_sessions || '/' || scs.total_sessions as sessions,
  scs.status,
  scs.start_date::DATE as start_date,
  scs.end_date::DATE as end_date
FROM public.student_coaching_subscriptions scs
JOIN public.profiles sp ON sp.id = scs.student_id
JOIN public.profiles cp_prof ON cp_prof.id = scs.coach_id
JOIN public.coaching_packages pkg ON pkg.id = scs.package_id
WHERE sp.email = 'profesyonel@test.com'
ORDER BY scs.created_at DESC
LIMIT 1;

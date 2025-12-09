-- Add test coaching subscription for profesyonel@test.com
-- This allows testing the coaching appointment flow

-- First, let's find the student ID, coach ID, and premium package ID
DO $$
DECLARE
  v_student_id UUID;
  v_coach_id UUID;
  v_package_id UUID;
  v_start_date TIMESTAMPTZ := NOW();
  v_end_date TIMESTAMPTZ := NOW() + INTERVAL '90 days';
BEGIN
  -- Get student ID (profesyonel@test.com)
  SELECT id INTO v_student_id
  FROM profiles
  WHERE email = 'profesyonel@test.com'
  LIMIT 1;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Student profesyonel@test.com not found';
  END IF;

  -- Get a coach (any teacher with is_coach = true)
  SELECT id INTO v_coach_id
  FROM profiles
  WHERE role = 'teacher' AND is_coach = true
  LIMIT 1;

  IF v_coach_id IS NULL THEN
    RAISE NOTICE 'No coach found, creating one from existing teacher...';

    -- If no coach exists, make a teacher a coach
    UPDATE profiles
    SET is_coach = true
    WHERE role = 'teacher'
    AND id = (SELECT id FROM profiles WHERE role = 'teacher' LIMIT 1)
    RETURNING id INTO v_coach_id;
  END IF;

  -- Get Premium package (24 sessions or highest session count)
  SELECT id INTO v_package_id
  FROM coaching_packages
  WHERE is_active = true
  ORDER BY session_count DESC
  LIMIT 1;

  IF v_package_id IS NULL THEN
    RAISE EXCEPTION 'No active coaching packages found';
  END IF;

  -- Delete existing subscription if any (for clean test)
  DELETE FROM student_coaching_subscriptions
  WHERE student_id = v_student_id;

  -- Create the subscription
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
    v_start_date,
    v_end_date,
    cp.session_count,
    cp.session_count,
    'active',
    cp.price
  FROM coaching_packages cp
  WHERE cp.id = v_package_id;

  RAISE NOTICE 'Successfully created coaching subscription for profesyonel@test.com';
  RAISE NOTICE 'Student ID: %', v_student_id;
  RAISE NOTICE 'Coach ID: %', v_coach_id;
  RAISE NOTICE 'Package ID: %', v_package_id;
  RAISE NOTICE 'End Date: %', v_end_date;
END $$;

-- Verify the subscription was created
SELECT
  scs.id as subscription_id,
  p_student.email as student_email,
  p_student.full_name as student_name,
  p_coach.email as coach_email,
  p_coach.full_name as coach_name,
  cp.name as package_name,
  scs.remaining_sessions || '/' || scs.total_sessions as sessions,
  scs.status,
  scs.start_date,
  scs.end_date
FROM student_coaching_subscriptions scs
JOIN profiles p_student ON p_student.id = scs.student_id
JOIN profiles p_coach ON p_coach.id = scs.coach_id
JOIN coaching_packages cp ON cp.id = scs.package_id
WHERE p_student.email = 'profesyonel@test.com';

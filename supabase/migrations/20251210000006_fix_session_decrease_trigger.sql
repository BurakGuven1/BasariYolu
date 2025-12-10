-- Fix session decrease trigger with proper logging
-- This ensures sessions are decreased when coach approves appointment

-- Drop old trigger and function
DROP TRIGGER IF EXISTS trigger_decrease_sessions ON public.coaching_appointments;
DROP FUNCTION IF EXISTS decrease_subscription_sessions();

-- Create improved function with logging
CREATE OR REPLACE FUNCTION decrease_subscription_sessions()
RETURNS TRIGGER AS $$
DECLARE
  v_old_sessions INTEGER;
  v_new_sessions INTEGER;
BEGIN
  -- Only decrease sessions when status changes from 'pending' to 'approved'
  IF OLD.status = 'pending' AND NEW.status = 'approved' THEN

    -- Get current remaining sessions
    SELECT remaining_sessions INTO v_old_sessions
    FROM public.student_coaching_subscriptions
    WHERE id = NEW.subscription_id;

    -- Decrease remaining sessions by 1
    UPDATE public.student_coaching_subscriptions
    SET
      remaining_sessions = GREATEST(remaining_sessions - 1, 0),
      updated_at = NOW()
    WHERE id = NEW.subscription_id
    AND remaining_sessions > 0
    RETURNING remaining_sessions INTO v_new_sessions;

    RAISE NOTICE 'Session decreased for subscription %: % -> %', NEW.subscription_id, v_old_sessions, v_new_sessions;

    -- If remaining sessions reach 0, mark subscription as completed
    IF v_new_sessions = 0 THEN
      UPDATE public.student_coaching_subscriptions
      SET
        status = 'completed',
        updated_at = NOW()
      WHERE id = NEW.subscription_id;

      RAISE NOTICE 'Subscription % marked as completed (0 sessions remaining)', NEW.subscription_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires AFTER update
CREATE TRIGGER trigger_decrease_sessions
  AFTER UPDATE OF status ON public.coaching_appointments
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'approved')
  EXECUTE FUNCTION decrease_subscription_sessions();

-- Add comment
COMMENT ON FUNCTION decrease_subscription_sessions IS 'Automatically decreases remaining sessions when appointment status changes from pending to approved. Marks subscription as completed when sessions reach 0.';

-- Test: Show current subscriptions
SELECT
  id,
  student_id,
  coach_id,
  remaining_sessions,
  total_sessions,
  status
FROM public.student_coaching_subscriptions
WHERE status = 'active'
ORDER BY created_at DESC;

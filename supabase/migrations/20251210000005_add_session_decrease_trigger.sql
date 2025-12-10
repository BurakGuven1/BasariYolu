-- Decrease remaining sessions when coach approves appointment
-- This trigger automatically updates the subscription when an appointment is approved

CREATE OR REPLACE FUNCTION decrease_subscription_sessions()
RETURNS TRIGGER AS $$
BEGIN
  -- Only decrease sessions when status changes from 'pending' to 'approved'
  IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
    -- Decrease remaining sessions
    UPDATE public.student_coaching_subscriptions
    SET remaining_sessions = remaining_sessions - 1,
        updated_at = NOW()
    WHERE id = NEW.subscription_id
    AND remaining_sessions > 0;

    -- If remaining sessions reach 0, mark subscription as completed
    UPDATE public.student_coaching_subscriptions
    SET status = 'completed',
        updated_at = NOW()
    WHERE id = NEW.subscription_id
    AND remaining_sessions = 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_decrease_sessions ON public.coaching_appointments;

CREATE TRIGGER trigger_decrease_sessions
  AFTER UPDATE ON public.coaching_appointments
  FOR EACH ROW
  EXECUTE FUNCTION decrease_subscription_sessions();

COMMENT ON FUNCTION decrease_subscription_sessions IS 'Automatically decreases remaining sessions when appointment is approved';

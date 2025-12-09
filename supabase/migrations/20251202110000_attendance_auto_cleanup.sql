-- Attendance Auto-Cleanup System
-- Automatically delete attendance records older than 23 hours

-- ==============================================================
-- FUNCTION: Clean up old attendance records
-- ==============================================================

CREATE OR REPLACE FUNCTION cleanup_old_attendance()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete attendance records older than 23 hours
  DELETE FROM attendance
  WHERE created_at < NOW() - INTERVAL '23 hours';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Log the cleanup operation
  RAISE NOTICE 'Cleaned up % old attendance records', deleted_count;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================
-- SCHEDULED CLEANUP (using pg_cron if available)
-- ==============================================================

-- Note: pg_cron extension needs to be enabled by Supabase admin
-- If pg_cron is not available, you can call this function manually
-- or set up a Supabase Edge Function to call it periodically

-- Uncomment the following lines if pg_cron is enabled:
-- SELECT cron.schedule(
--   'cleanup-old-attendance',
--   '0 * * * *', -- Run every hour
--   $$SELECT cleanup_old_attendance()$$
-- );

-- ==============================================================
-- MANUAL CLEANUP FUNCTION (for application use)
-- ==============================================================

-- Create a more flexible version that accepts hours parameter
CREATE OR REPLACE FUNCTION cleanup_attendance_older_than(hours INTEGER DEFAULT 23)
RETURNS TABLE(deleted_count INTEGER, cleanup_date TIMESTAMPTZ) AS $$
DECLARE
  count_deleted INTEGER;
BEGIN
  -- Delete attendance records older than specified hours
  DELETE FROM attendance
  WHERE created_at < NOW() - (hours || ' hours')::INTERVAL;

  GET DIAGNOSTICS count_deleted = ROW_COUNT;

  RETURN QUERY SELECT count_deleted, NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================
-- TRIGGER-BASED CLEANUP (Alternative approach)
-- ==============================================================

-- This trigger runs cleanup automatically when new attendance is inserted
-- Useful if pg_cron is not available

CREATE OR REPLACE FUNCTION trigger_cleanup_old_attendance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run cleanup occasionally (randomly 1% of the time to avoid overhead)
  IF random() < 0.01 THEN
    PERFORM cleanup_old_attendance();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to attendance table
DROP TRIGGER IF EXISTS trigger_auto_cleanup_attendance ON attendance;

CREATE TRIGGER trigger_auto_cleanup_attendance
  AFTER INSERT ON attendance
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_cleanup_old_attendance();

-- ==============================================================
-- COMMENTS
-- ==============================================================

COMMENT ON FUNCTION cleanup_old_attendance() IS 'Deletes attendance records older than 23 hours';
COMMENT ON FUNCTION cleanup_attendance_older_than(INTEGER) IS 'Deletes attendance records older than specified hours';
COMMENT ON FUNCTION trigger_cleanup_old_attendance() IS 'Trigger function that occasionally runs cleanup to prevent table bloat';

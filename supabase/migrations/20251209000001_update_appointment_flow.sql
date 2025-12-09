-- =====================================================
-- COACHING APPOINTMENT FLOW UPDATE
-- =====================================================
-- Updates appointment flow: Student requests -> Coach approves -> Email sent

-- 1. Update appointment status enum to include pending and approved
ALTER TABLE public.coaching_appointments
DROP CONSTRAINT IF EXISTS coaching_appointments_status_check;

ALTER TABLE public.coaching_appointments
ADD CONSTRAINT coaching_appointments_status_check
CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled', 'no_show'));

-- Update existing 'scheduled' status to 'approved'
UPDATE public.coaching_appointments
SET status = 'approved'
WHERE status = 'scheduled';

-- 2. Add coach_notes column for approval/rejection reasons
ALTER TABLE public.coaching_appointments
ADD COLUMN IF NOT EXISTS coach_notes TEXT;

-- 3. Add approved_at and rejected_at timestamps
ALTER TABLE public.coaching_appointments
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

-- 4. Update decrement_session_count to work with 'approved' status
DROP TRIGGER IF EXISTS decrement_session_on_completion ON public.coaching_appointments;
DROP FUNCTION IF EXISTS decrement_session_count();

CREATE OR REPLACE FUNCTION decrement_session_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Only decrement when status changes to completed from approved
    IF OLD.status IN ('pending', 'approved') AND NEW.status = 'completed' THEN
        UPDATE public.student_coaching_subscriptions
        SET remaining_sessions = remaining_sessions - 1
        WHERE id = NEW.subscription_id;

        -- Mark subscription as completed if no sessions remain
        UPDATE public.student_coaching_subscriptions
        SET status = 'completed'
        WHERE id = NEW.subscription_id
          AND remaining_sessions = 0
          AND status = 'active';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decrement_session_on_completion
    AFTER UPDATE ON public.coaching_appointments
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION decrement_session_count();

-- =====================================================
-- EMAIL NOTIFICATIONS
-- =====================================================

-- Function: Notify coach when student requests appointment
CREATE OR REPLACE FUNCTION notify_coach_appointment_request()
RETURNS TRIGGER AS $$
DECLARE
  coach_email TEXT;
  coach_name TEXT;
  student_name TEXT;
  appointment_time TEXT;
  email_subject TEXT;
  email_html TEXT;
  package_name TEXT;
  remaining_sessions INT;
BEGIN
  -- Only send email for new pending appointments
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    -- Get coach email and name
    SELECT
      p.email,
      p.full_name
    INTO
      coach_email,
      coach_name
    FROM profiles p
    WHERE p.id = NEW.coach_id;

    -- Get student name
    SELECT full_name INTO student_name
    FROM profiles
    WHERE id = NEW.student_id;

    -- Get package info
    SELECT
      cp.name,
      scs.remaining_sessions
    INTO
      package_name,
      remaining_sessions
    FROM student_coaching_subscriptions scs
    JOIN coaching_packages cp ON cp.id = scs.package_id
    WHERE scs.id = NEW.subscription_id;

    -- Format appointment time in Turkish
    appointment_time := to_char(NEW.appointment_date AT TIME ZONE 'Europe/Istanbul', 'DD Month YYYY, HH24:MI');

    -- Compose email
    email_subject := 'Yeni Randevu Talebi - BaşarıYolu';

    email_html := format(
      '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🎓 BaşarıYolu</h1>
          <p style="color: white; margin: 10px 0 0 0;">Koçluk Sistemi</p>
        </div>

        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Merhaba %s! 👋</h2>

          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Öğrenciniz <strong>%s</strong> sizinle bir randevu talebi oluşturdu.
          </p>

          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #333; margin-top: 0;">📅 Randevu Detayları</h3>
            <p style="margin: 10px 0;"><strong>Öğrenci:</strong> %s</p>
            <p style="margin: 10px 0;"><strong>Talep Edilen Tarih:</strong> %s</p>
            <p style="margin: 10px 0;"><strong>Süre:</strong> %s dakika</p>
            <p style="margin: 10px 0;"><strong>Paket:</strong> %s (Kalan: %s seans)</p>
            %s
            %s
          </div>

          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #1976d2; font-size: 14px;">
              ℹ️ Lütfen randevu talebini onaylamak veya reddetmek için dashboard''unuza giriş yapın.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://basariyolum.com/teacher-dashboard?tab=coaching" style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Randevu Taleplerini Görüntüle
            </a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              BaşarıYolu - Başarıya Giden Yolda<br>
              <a href="https://basariyolum.com" style="color: #667eea; text-decoration: none;">basariyolum.com</a>
            </p>
          </div>
        </div>
      </div>',
      coach_name,
      student_name,
      student_name,
      appointment_time,
      NEW.duration_minutes,
      package_name,
      remaining_sessions,
      CASE
        WHEN NEW.title IS NOT NULL THEN format('<p style="margin: 10px 0;"><strong>Konu:</strong> %s</p>', NEW.title)
        ELSE ''
      END,
      CASE
        WHEN NEW.description IS NOT NULL THEN format('<p style="margin: 10px 0;"><strong>Öğrenci Notu:</strong> %s</p>', NEW.description)
        ELSE ''
      END
    );

    -- Call Edge Function to send email (if configured)
    BEGIN
      PERFORM
        net.http_post(
          url := format('%s/functions/v1/send-email', current_setting('app.settings.supabase_url', true)),
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', format('Bearer %s', current_setting('app.settings.service_role_key', true))
          ),
          body := jsonb_build_object(
            'to', coach_email,
            'subject', email_subject,
            'html', email_html
          )
        );
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the appointment creation
      RAISE WARNING 'Failed to send email notification: %', SQLERRM;
    END;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Notify student when coach approves appointment
CREATE OR REPLACE FUNCTION notify_student_appointment_approval()
RETURNS TRIGGER AS $$
DECLARE
  student_email TEXT;
  student_name TEXT;
  coach_name TEXT;
  appointment_time TEXT;
  meet_link TEXT;
  email_subject TEXT;
  email_html TEXT;
BEGIN
  -- Only send email when status changes to approved
  IF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'approved' THEN
    -- Get student email and name
    SELECT
      p.email,
      p.full_name
    INTO
      student_email,
      student_name
    FROM profiles p
    WHERE p.id = NEW.student_id;

    -- Get coach name
    SELECT full_name INTO coach_name
    FROM profiles
    WHERE id = NEW.coach_id;

    -- Format appointment time in Turkish
    appointment_time := to_char(NEW.appointment_date AT TIME ZONE 'Europe/Istanbul', 'DD Month YYYY, HH24:MI');

    -- Get meet link
    meet_link := COALESCE(NEW.google_meet_link, '');

    -- Compose email
    email_subject := 'Randevunuz Onaylandı! - BaşarıYolu';

    email_html := format(
      '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%%, #059669 100%%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">✅ Randevunuz Onaylandı!</h1>
          <p style="color: white; margin: 10px 0 0 0;">BaşarıYolu Koçluk Sistemi</p>
        </div>

        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Merhaba %s! 🎉</h2>

          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Koçunuz <strong>%s</strong> randevu talebinizi onayladı!
          </p>

          <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="color: #333; margin-top: 0;">📅 Randevu Detayları</h3>
            <p style="margin: 10px 0;"><strong>Tarih ve Saat:</strong> %s</p>
            <p style="margin: 10px 0;"><strong>Süre:</strong> %s dakika</p>
            <p style="margin: 10px 0;"><strong>Koç:</strong> %s</p>
            %s
            %s
          </div>

          %s

          %s

          <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #0369a1; font-size: 14px;">
              💡 Randevu zamanı yaklaştığında size hatırlatma göndereceğiz.
            </p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              BaşarıYolu - Başarıya Giden Yolda<br>
              <a href="https://basariyolum.com" style="color: #10b981; text-decoration: none;">basariyolum.com</a>
            </p>
          </div>
        </div>
      </div>',
      student_name,
      coach_name,
      appointment_time,
      NEW.duration_minutes,
      coach_name,
      CASE
        WHEN NEW.title IS NOT NULL THEN format('<p style="margin: 10px 0;"><strong>Konu:</strong> %s</p>', NEW.title)
        ELSE ''
      END,
      CASE
        WHEN NEW.description IS NOT NULL THEN format('<p style="margin: 10px 0;"><strong>Notunuz:</strong> %s</p>', NEW.description)
        ELSE ''
      END,
      CASE
        WHEN meet_link != '' THEN
          format('<div style="text-align: center; margin: 20px 0;">
                    <a href="%s" style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                      🎥 Toplantıya Katıl
                    </a>
                  </div>', meet_link)
        ELSE ''
      END,
      CASE
        WHEN NEW.coach_notes IS NOT NULL THEN format('<div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;"><p style="margin: 0; color: #92400e; font-size: 14px;"><strong>Koç Notu:</strong> %s</p></div>', NEW.coach_notes)
        ELSE ''
      END
    );

    -- Call Edge Function to send email
    BEGIN
      PERFORM
        net.http_post(
          url := format('%s/functions/v1/send-email', current_setting('app.settings.supabase_url', true)),
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', format('Bearer %s', current_setting('app.settings.service_role_key', true))
          ),
          body := jsonb_build_object(
            'to', student_email,
            'subject', email_subject,
            'html', email_html
          )
        );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to send email notification: %', SQLERRM;
    END;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS send_appointment_request_email ON coaching_appointments;
CREATE TRIGGER send_appointment_request_email
  AFTER INSERT ON coaching_appointments
  FOR EACH ROW
  EXECUTE FUNCTION notify_coach_appointment_request();

DROP TRIGGER IF EXISTS send_appointment_approval_email ON coaching_appointments;
CREATE TRIGGER send_appointment_approval_email
  AFTER UPDATE ON coaching_appointments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_student_appointment_approval();

COMMENT ON FUNCTION notify_coach_appointment_request() IS 'Sends email to coach when student requests an appointment';
COMMENT ON FUNCTION notify_student_appointment_approval() IS 'Sends email to student when coach approves an appointment';

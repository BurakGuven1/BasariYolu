-- =====================================================
-- COACHING SYSTEM MIGRATION
-- =====================================================
-- This migration adds coaching functionality to the platform
-- Teachers can become coaches and provide 1-on-1 coaching sessions
-- Students can purchase coaching packages and book appointments

-- =====================================================
-- 1. Update profiles table to support coaching
-- =====================================================

-- Add is_coach flag to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_coach BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS coach_bio TEXT,
ADD COLUMN IF NOT EXISTS coach_specializations TEXT[], -- Array of specializations like ['Matematik', 'Fizik']
ADD COLUMN IF NOT EXISTS coach_hourly_rate DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS coach_availability_timezone TEXT DEFAULT 'Europe/Istanbul';

-- Create index for coaches
CREATE INDEX IF NOT EXISTS idx_profiles_is_coach ON public.profiles(is_coach) WHERE is_coach = true;

COMMENT ON COLUMN public.profiles.is_coach IS 'Whether this teacher profile is also a coach';
COMMENT ON COLUMN public.profiles.coach_bio IS 'Coach biography and introduction';
COMMENT ON COLUMN public.profiles.coach_specializations IS 'Array of subjects/topics coach specializes in';
COMMENT ON COLUMN public.profiles.coach_hourly_rate IS 'Hourly rate for coaching sessions';

-- =====================================================
-- 2. Coaching Packages Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.coaching_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    session_count INTEGER NOT NULL CHECK (session_count > 0),
    duration_days INTEGER NOT NULL CHECK (duration_days > 0), -- Package validity in days
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coaching_packages_active ON public.coaching_packages(is_active);

COMMENT ON TABLE public.coaching_packages IS 'Predefined coaching packages that students can purchase';
COMMENT ON COLUMN public.coaching_packages.session_count IS 'Number of 1-on-1 sessions included in package';
COMMENT ON COLUMN public.coaching_packages.duration_days IS 'How many days the package is valid after purchase';

-- Insert default coaching packages
INSERT INTO public.coaching_packages (name, description, session_count, duration_days, price) VALUES
('Deneme Paketi', 'Koçluk hizmetini denemek için ideal. 1 görüşme hakkı.', 1, 30, 500.00),
('Başlangıç Paketi', '4 hafta boyunca haftalık görüşme. Motivasyon ve hedef belirleme.', 4, 30, 1800.00),
('Standart Paket', '2 ay boyunca haftalık görüşme. Düzenli takip ve destek.', 8, 60, 3200.00),
('Premium Paket', '3 ay boyunca haftada 2 görüşme. Yoğun destek ve mentorluk.', 24, 90, 8500.00),
('Sınav Hazırlık', 'TYT/AYT/LGS hazırlık için özel paket. 12 hafta boyunca haftalık görüşme.', 12, 90, 5000.00);

-- =====================================================
-- 3. Student Coaching Subscriptions Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.student_coaching_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES public.coaching_packages(id) ON DELETE RESTRICT,
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL,
    remaining_sessions INTEGER NOT NULL,
    total_sessions INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'completed')),
    purchase_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_dates CHECK (end_date > start_date),
    CONSTRAINT check_remaining_sessions CHECK (remaining_sessions >= 0 AND remaining_sessions <= total_sessions)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_student ON public.student_coaching_subscriptions(student_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_coach ON public.student_coaching_subscriptions(coach_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.student_coaching_subscriptions(status);

COMMENT ON TABLE public.student_coaching_subscriptions IS 'Student coaching package subscriptions';
COMMENT ON COLUMN public.student_coaching_subscriptions.remaining_sessions IS 'Number of sessions left to use';
COMMENT ON COLUMN public.student_coaching_subscriptions.status IS 'active: can book, expired: time limit passed, cancelled: manually cancelled, completed: all sessions used';

-- =====================================================
-- 4. Coaching Appointments Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.coaching_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.student_coaching_subscriptions(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    appointment_date TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
    google_meet_link TEXT,
    title VARCHAR(200),
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    cancellation_reason TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_future_appointment CHECK (appointment_date > created_at)
);

CREATE INDEX IF NOT EXISTS idx_appointments_coach ON public.coaching_appointments(coach_id);
CREATE INDEX IF NOT EXISTS idx_appointments_student ON public.coaching_appointments(student_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.coaching_appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.coaching_appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_subscription ON public.coaching_appointments(subscription_id);

COMMENT ON TABLE public.coaching_appointments IS 'Individual coaching session appointments';
COMMENT ON COLUMN public.coaching_appointments.status IS 'scheduled: upcoming, completed: finished, cancelled: cancelled by either party, no_show: student did not attend';

-- =====================================================
-- 5. Coach Availability Table (Optional - for scheduling)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.coach_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_times CHECK (end_time > start_time),
    UNIQUE(coach_id, day_of_week, start_time, end_time)
);

CREATE INDEX IF NOT EXISTS idx_coach_availability ON public.coach_availability(coach_id, day_of_week);

COMMENT ON TABLE public.coach_availability IS 'Weekly recurring availability schedule for coaches';
COMMENT ON COLUMN public.coach_availability.day_of_week IS '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';

-- =====================================================
-- 6. Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.coaching_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_coaching_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_availability ENABLE ROW LEVEL SECURITY;

-- Coaching Packages: Everyone can view active packages
CREATE POLICY "Anyone can view active coaching packages"
    ON public.coaching_packages
    FOR SELECT
    USING (is_active = true);

-- Subscriptions: Students can view their own subscriptions
CREATE POLICY "Students can view own subscriptions"
    ON public.student_coaching_subscriptions
    FOR SELECT
    USING (auth.uid() = student_id);

-- Subscriptions: Coaches can view subscriptions for their students
CREATE POLICY "Coaches can view their student subscriptions"
    ON public.student_coaching_subscriptions
    FOR SELECT
    USING (auth.uid() = coach_id);

-- Subscriptions: Students can create new subscriptions (purchase packages)
CREATE POLICY "Students can create subscriptions"
    ON public.student_coaching_subscriptions
    FOR INSERT
    WITH CHECK (auth.uid() = student_id);

-- Appointments: Students can view their own appointments
CREATE POLICY "Students can view own appointments"
    ON public.coaching_appointments
    FOR SELECT
    USING (auth.uid() = student_id);

-- Appointments: Coaches can view their appointments
CREATE POLICY "Coaches can view their appointments"
    ON public.coaching_appointments
    FOR SELECT
    USING (auth.uid() = coach_id);

-- Appointments: Coaches can create appointments
CREATE POLICY "Coaches can create appointments"
    ON public.coaching_appointments
    FOR INSERT
    WITH CHECK (auth.uid() = coach_id);

-- Appointments: Coaches can update their appointments
CREATE POLICY "Coaches can update their appointments"
    ON public.coaching_appointments
    FOR UPDATE
    USING (auth.uid() = coach_id);

-- Appointments: Students can cancel their appointments
CREATE POLICY "Students can cancel appointments"
    ON public.coaching_appointments
    FOR UPDATE
    USING (auth.uid() = student_id AND status = 'scheduled');

-- Coach Availability: Coaches can manage their own availability
CREATE POLICY "Coaches can manage own availability"
    ON public.coach_availability
    FOR ALL
    USING (auth.uid() = coach_id);

-- Coach Availability: Anyone can view coach availability
CREATE POLICY "Anyone can view coach availability"
    ON public.coach_availability
    FOR SELECT
    USING (true);

-- =====================================================
-- 7. Functions and Triggers
-- =====================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_coaching_packages_updated_at
    BEFORE UPDATE ON public.coaching_packages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.student_coaching_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON public.coaching_appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_updated_at
    BEFORE UPDATE ON public.coach_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to decrement remaining sessions when appointment is completed
CREATE OR REPLACE FUNCTION decrement_session_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Only decrement when status changes from scheduled to completed
    IF OLD.status = 'scheduled' AND NEW.status = 'completed' THEN
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

-- Function to check and expire subscriptions
CREATE OR REPLACE FUNCTION check_subscription_expiry()
RETURNS void AS $$
BEGIN
    UPDATE public.student_coaching_subscriptions
    SET status = 'expired'
    WHERE status = 'active'
      AND end_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. Useful Views
-- =====================================================

-- View for coaches with their stats
CREATE OR REPLACE VIEW coach_stats AS
SELECT
    p.id as coach_id,
    p.full_name as coach_name,
    p.avatar_url,
    p.coach_bio,
    p.coach_specializations,
    p.coach_hourly_rate,
    COUNT(DISTINCT scs.id) as total_students,
    COUNT(DISTINCT ca.id) FILTER (WHERE ca.status = 'completed') as completed_sessions,
    COUNT(DISTINCT ca.id) FILTER (WHERE ca.status = 'scheduled') as upcoming_sessions,
    AVG(CASE WHEN ca.status = 'completed' THEN 5.0 ELSE NULL END) as avg_rating -- Placeholder for future rating system
FROM public.profiles p
LEFT JOIN public.student_coaching_subscriptions scs ON scs.coach_id = p.id AND scs.status = 'active'
LEFT JOIN public.coaching_appointments ca ON ca.coach_id = p.id
WHERE p.is_coach = true
GROUP BY p.id, p.full_name, p.avatar_url, p.coach_bio, p.coach_specializations, p.coach_hourly_rate;

COMMENT ON VIEW coach_stats IS 'Aggregated statistics for each coach';

-- =====================================================
-- Grant permissions
-- =====================================================

GRANT SELECT ON public.coaching_packages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.student_coaching_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.coaching_appointments TO authenticated;
GRANT ALL ON public.coach_availability TO authenticated;
GRANT SELECT ON coach_stats TO authenticated;

-- =====================================================
-- ADD COACHING TO FEATURES (FIXED)
-- =====================================================
-- Add coaching-related features to the features table
-- First check if table exists, if not skip this migration

-- Create features table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    feature_type VARCHAR(20) NOT NULL,
    is_premium BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;

-- Anyone can read features
CREATE POLICY IF NOT EXISTS "Anyone can view features"
    ON public.features FOR SELECT
    USING (true);

-- Only admins can modify (for future use)
-- CREATE POLICY "Admins can manage features"
--     ON public.features FOR ALL
--     USING (auth.jwt() ->> 'role' = 'admin');

-- Insert coaching features (use ON CONFLICT to avoid duplicates)

-- Student coaching features
INSERT INTO public.features (name, description, feature_type, is_premium) VALUES
(
  'coaching_access',
  'Kişisel koçluk desteği alabilme - 1-on-1 görüşmeler, düzenli denetim ve motivasyon',
  'student',
  true
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  feature_type = EXCLUDED.feature_type,
  is_premium = EXCLUDED.is_premium;

INSERT INTO public.features (name, description, feature_type, is_premium) VALUES
(
  'coaching_appointments',
  'Koç ile randevu oluşturma ve Google Meet görüşmeleri',
  'student',
  true
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  feature_type = EXCLUDED.feature_type,
  is_premium = EXCLUDED.is_premium;

INSERT INTO public.features (name, description, feature_type, is_premium) VALUES
(
  'coaching_progress_tracking',
  'Koçluk seanslarının takibi ve ilerleme raporları',
  'student',
  true
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  feature_type = EXCLUDED.feature_type,
  is_premium = EXCLUDED.is_premium;

INSERT INTO public.features (name, description, feature_type, is_premium) VALUES
(
  'daily_supervision',
  'Koç tarafından her gün düzenli denetim ve takip (Standart ve Premium paketlerde)',
  'student',
  true
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  feature_type = EXCLUDED.feature_type,
  is_premium = EXCLUDED.is_premium;

-- Teacher/Coach features
INSERT INTO public.features (name, description, feature_type, is_premium) VALUES
(
  'become_coach',
  'Koç olarak çalışabilme - Öğrencilere 1-on-1 koçluk hizmeti verebilme',
  'teacher',
  false
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  feature_type = EXCLUDED.feature_type,
  is_premium = EXCLUDED.is_premium;

INSERT INTO public.features (name, description, feature_type, is_premium) VALUES
(
  'coaching_dashboard',
  'Koçluk paneli - Randevular, öğrenciler ve kazanç takibi',
  'teacher',
  false
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  feature_type = EXCLUDED.feature_type,
  is_premium = EXCLUDED.is_premium;

INSERT INTO public.features (name, description, feature_type, is_premium) VALUES
(
  'coaching_calendar',
  'Koçluk takvimi ve müsaitlik yönetimi',
  'teacher',
  false
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  feature_type = EXCLUDED.feature_type,
  is_premium = EXCLUDED.is_premium;

INSERT INTO public.features (name, description, feature_type, is_premium) VALUES
(
  'coaching_earnings',
  'Koçluk kazançları ve ödeme yönetimi',
  'teacher',
  false
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  feature_type = EXCLUDED.feature_type,
  is_premium = EXCLUDED.is_premium;

COMMENT ON TABLE public.features IS 'Platform features for students and teachers';
COMMENT ON COLUMN public.features.feature_type IS 'Feature type: student, teacher, or general';

-- =====================================================
-- ADD COACHING TO FEATURES
-- =====================================================
-- Add coaching-related features to the features table

-- Student coaching features
INSERT INTO public.features (name, description, feature_type, is_premium) VALUES
(
  'coaching_access',
  'Kişisel koçluk desteği alabilme - 1-on-1 görüşmeler, düzenli denetim ve motivasyon',
  'student',
  true
),
(
  'coaching_appointments',
  'Koç ile randevu oluşturma ve Google Meet görüşmeleri',
  'student',
  true
),
(
  'coaching_progress_tracking',
  'Koçluk seanslarının takibi ve ilerleme raporları',
  'student',
  true
),
(
  'daily_supervision',
  'Koç tarafından her gün düzenli denetim ve takip (Standart ve Premium paketlerde)',
  'student',
  true
);

-- Teacher/Coach features
INSERT INTO public.features (name, description, feature_type, is_premium) VALUES
(
  'become_coach',
  'Koç olarak çalışabilme - Öğrencilere 1-on-1 koçluk hizmeti verebilme',
  'teacher',
  false
),
(
  'coaching_dashboard',
  'Koçluk paneli - Randevular, öğrenciler ve kazanç takibi',
  'teacher',
  false
),
(
  'coaching_calendar',
  'Koçluk takvimi ve müsaitlik yönetimi',
  'teacher',
  false
),
(
  'coaching_earnings',
  'Koçluk kazançları ve ödeme yönetimi',
  'teacher',
  false
);

-- Add coaching to existing premium package features if not already there
-- This assumes you have a package_features table
-- If not, this section can be skipped

COMMENT ON COLUMN public.features.feature_type IS 'Feature type: student, teacher, or general';

-- Achievements and Certificates System
-- Track student achievements and generate certificates

-- ============================================================================
-- ACHIEVEMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN (
    'questions_500',
    'questions_1000',
    'questions_2500',
    'questions_5000',
    'exam_perfect_score',
    'study_streak_7',
    'study_streak_30',
    'study_streak_100',
    'pomodoro_100',
    'pomodoro_500'
  )),
  achievement_title TEXT NOT NULL,
  achievement_description TEXT,
  icon TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  certificate_issued BOOLEAN DEFAULT FALSE,
  certificate_number TEXT UNIQUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_achievements_student ON public.achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON public.achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_achievements_earned_at ON public.achievements(earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_certificate_number ON public.achievements(certificate_number);

-- ============================================================================
-- CERTIFICATE SHARES TABLE (for social media tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.certificate_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'twitter', 'linkedin', 'facebook', 'whatsapp', 'other')),
  shared_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificate_shares_achievement ON public.certificate_shares(achievement_id);
CREATE INDEX IF NOT EXISTS idx_certificate_shares_platform ON public.certificate_shares(platform);

-- ============================================================================
-- FUNCTION: Generate Certificate Number
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  cert_number TEXT;
  year_code TEXT;
  random_part TEXT;
BEGIN
  -- Format: BSY-2024-XXXXX (BSY = BaşarıYolu)
  year_code := TO_CHAR(NOW(), 'YYYY');
  random_part := LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0');
  cert_number := 'BSY-' || year_code || '-' || random_part;

  -- Check if exists, regenerate if needed
  WHILE EXISTS (SELECT 1 FROM public.achievements WHERE certificate_number = cert_number) LOOP
    random_part := LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0');
    cert_number := 'BSY-' || year_code || '-' || random_part;
  END LOOP;

  RETURN cert_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Check and Award Achievements
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_question_achievements(p_student_id UUID)
RETURNS VOID AS $$
DECLARE
  total_questions INTEGER;
  achievement_exists BOOLEAN;
BEGIN
  -- Count total questions solved (from study sessions)
  SELECT COUNT(*)
  INTO total_questions
  FROM public.study_sessions
  WHERE student_id = p_student_id;

  -- 500 Questions Achievement
  IF total_questions >= 500 THEN
    SELECT EXISTS (
      SELECT 1 FROM public.achievements
      WHERE student_id = p_student_id AND achievement_type = 'questions_500'
    ) INTO achievement_exists;

    IF NOT achievement_exists THEN
      INSERT INTO public.achievements (
        student_id,
        achievement_type,
        achievement_title,
        achievement_description,
        icon,
        certificate_issued,
        certificate_number,
        metadata
      ) VALUES (
        p_student_id,
        'questions_500',
        '500 Soru Ustası 🏆',
        '500+ soru çözerek çalışkanlığını kanıtladın!',
        '🏆',
        TRUE,
        public.generate_certificate_number(),
        jsonb_build_object('total_questions', total_questions)
      );
    END IF;
  END IF;

  -- 1000 Questions Achievement
  IF total_questions >= 1000 THEN
    SELECT EXISTS (
      SELECT 1 FROM public.achievements
      WHERE student_id = p_student_id AND achievement_type = 'questions_1000'
    ) INTO achievement_exists;

    IF NOT achievement_exists THEN
      INSERT INTO public.achievements (
        student_id,
        achievement_type,
        achievement_title,
        achievement_description,
        icon,
        certificate_issued,
        certificate_number,
        metadata
      ) VALUES (
        p_student_id,
        'questions_1000',
        '1000 Soru Şampiyonu 🎖️',
        '1000+ soru çözerek olağanüstü bir başarıya imza attın!',
        '🎖️',
        TRUE,
        public.generate_certificate_number(),
        jsonb_build_object('total_questions', total_questions)
      );
    END IF;
  END IF;

  -- 2500 Questions Achievement
  IF total_questions >= 2500 THEN
    SELECT EXISTS (
      SELECT 1 FROM public.achievements
      WHERE student_id = p_student_id AND achievement_type = 'questions_2500'
    ) INTO achievement_exists;

    IF NOT achievement_exists THEN
      INSERT INTO public.achievements (
        student_id,
        achievement_type,
        achievement_title,
        achievement_description,
        icon,
        certificate_issued,
        certificate_number,
        metadata
      ) VALUES (
        p_student_id,
        'questions_2500',
        '2500 Soru Efsanesi 🌟',
        '2500+ soru ile efsane kategorisine yükseldin!',
        '🌟',
        TRUE,
        public.generate_certificate_number(),
        jsonb_build_object('total_questions', total_questions)
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Auto-check achievements after study session
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trigger_check_achievements()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.check_question_achievements(NEW.student_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_study_session_check_achievements ON public.study_sessions;
CREATE TRIGGER after_study_session_check_achievements
  AFTER INSERT ON public.study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_check_achievements();

-- ============================================================================
-- VIEW: Student Achievements Summary
-- ============================================================================

CREATE OR REPLACE VIEW public.student_achievements_summary AS
SELECT
  s.id as student_id,
  s.user_id,
  p.full_name as student_name,
  COUNT(a.id) as total_achievements,
  COUNT(CASE WHEN a.certificate_issued THEN 1 END) as certificates_earned,
  ARRAY_AGG(
    jsonb_build_object(
      'id', a.id,
      'type', a.achievement_type,
      'title', a.achievement_title,
      'icon', a.icon,
      'earned_at', a.earned_at,
      'certificate_number', a.certificate_number
    ) ORDER BY a.earned_at DESC
  ) FILTER (WHERE a.id IS NOT NULL) as achievements
FROM public.students s
JOIN public.profiles p ON s.profile_id = p.id
LEFT JOIN public.achievements a ON s.id = a.student_id
GROUP BY s.id, s.user_id, p.full_name;

-- Grant permissions
GRANT SELECT ON public.student_achievements_summary TO authenticated;
GRANT ALL ON public.achievements TO authenticated;
GRANT ALL ON public.certificate_shares TO authenticated;

-- ============================================================================
-- Sample Data (Optional - for testing)
-- ============================================================================

-- Uncomment to add sample achievements
/*
INSERT INTO public.achievements (student_id, achievement_type, achievement_title, achievement_description, icon, certificate_issued, certificate_number)
SELECT
  id,
  'questions_500',
  '500 Soru Ustası 🏆',
  '500+ soru çözerek çalışkanlığını kanıtladın!',
  '🏆',
  TRUE,
  public.generate_certificate_number()
FROM public.students
LIMIT 5;
*/

-- Student Question Solving Tracking System
-- Track which students solved which questions and update weekly goals

-- ============================================================================
-- STUDENT SOLVED QUESTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.student_solved_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.institution_questions(id) ON DELETE CASCADE,
  question_source TEXT NOT NULL CHECK (question_source IN ('institution', 'platform', 'external')),

  -- Question details (cached for performance)
  subject TEXT,
  topic TEXT,
  difficulty TEXT,

  -- Solving details
  is_correct BOOLEAN NOT NULL DEFAULT false,
  time_spent_seconds INTEGER,
  student_answer TEXT,

  -- Metadata
  solved_at TIMESTAMPTZ DEFAULT NOW(),
  attempt_number INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate solves (same question, same day)
  UNIQUE(student_id, question_id, DATE(solved_at))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_solved_questions_student ON public.student_solved_questions(student_id);
CREATE INDEX IF NOT EXISTS idx_student_solved_questions_subject ON public.student_solved_questions(student_id, subject);
CREATE INDEX IF NOT EXISTS idx_student_solved_questions_solved_at ON public.student_solved_questions(solved_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_solved_questions_week ON public.student_solved_questions(student_id, DATE_TRUNC('week', solved_at));

-- ============================================================================
-- FUNCTION: Update Weekly Question Count
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_weekly_question_count()
RETURNS TRIGGER AS $$
DECLARE
  week_start DATE;
  week_end DATE;
  current_count INTEGER;
  plan_id UUID;
BEGIN
  -- Get current week boundaries (Monday to Sunday)
  week_start := DATE_TRUNC('week', NEW.solved_at)::DATE;
  week_end := (week_start + INTERVAL '6 days')::DATE;

  -- Count total questions solved this week
  SELECT COUNT(DISTINCT question_id)
  INTO current_count
  FROM public.student_solved_questions
  WHERE student_id = NEW.student_id
    AND solved_at >= week_start
    AND solved_at < week_end + INTERVAL '1 day';

  -- Update or create weekly question plan
  INSERT INTO public.weekly_question_plans (
    student_id,
    week_start_date,
    week_end_date,
    question_target,
    questions_completed
  ) VALUES (
    NEW.student_id,
    week_start,
    week_end,
    50, -- Default target
    current_count
  )
  ON CONFLICT (student_id, week_start_date)
  DO UPDATE SET
    questions_completed = current_count,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Auto-update weekly count after question solve
-- ============================================================================

DROP TRIGGER IF EXISTS after_question_solved_update_weekly ON public.student_solved_questions;
CREATE TRIGGER after_question_solved_update_weekly
  AFTER INSERT ON public.student_solved_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_weekly_question_count();

-- ============================================================================
-- FUNCTION: Updated Achievement Check (Use Real Question Count)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_question_achievements_v2(p_student_id UUID)
RETURNS VOID AS $$
DECLARE
  total_questions INTEGER;
  achievement_exists BOOLEAN;
BEGIN
  -- Count REAL questions solved from question bank
  SELECT COUNT(DISTINCT question_id)
  INTO total_questions
  FROM public.student_solved_questions
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
        jsonb_build_object('total_questions', total_questions, 'achievement_date', NOW())
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
        jsonb_build_object('total_questions', total_questions, 'achievement_date', NOW())
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
        jsonb_build_object('total_questions', total_questions, 'achievement_date', NOW())
      );
    END IF;
  END IF;

  -- 5000 Questions Achievement
  IF total_questions >= 5000 THEN
    SELECT EXISTS (
      SELECT 1 FROM public.achievements
      WHERE student_id = p_student_id AND achievement_type = 'questions_5000'
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
        'questions_5000',
        '5000 Soru Tanrısı 👑',
        '5000+ soru çözerek tanrı seviyesine ulaştın!',
        '👑',
        TRUE,
        public.generate_certificate_number(),
        jsonb_build_object('total_questions', total_questions, 'achievement_date', NOW())
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Check achievements after solving questions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trigger_check_achievements_v2()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check every 10 questions to avoid performance issues
  IF (SELECT COUNT(*) FROM public.student_solved_questions WHERE student_id = NEW.student_id) % 10 = 0 THEN
    PERFORM public.check_question_achievements_v2(NEW.student_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_question_solved_check_achievements ON public.student_solved_questions;
CREATE TRIGGER after_question_solved_check_achievements
  AFTER INSERT ON public.student_solved_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_check_achievements_v2();

-- ============================================================================
-- VIEW: Student Question Statistics
-- ============================================================================

CREATE OR REPLACE VIEW public.student_question_stats AS
SELECT
  s.id as student_id,
  s.user_id,
  p.full_name as student_name,
  COUNT(DISTINCT ssq.question_id) as total_questions_solved,
  COUNT(DISTINCT CASE WHEN ssq.is_correct THEN ssq.question_id END) as correct_answers,
  COUNT(DISTINCT ssq.subject) as subjects_practiced,
  MAX(ssq.solved_at) as last_solved_at,

  -- This week stats
  COUNT(DISTINCT CASE
    WHEN ssq.solved_at >= DATE_TRUNC('week', NOW())
    THEN ssq.question_id
  END) as questions_this_week,

  -- Today stats
  COUNT(DISTINCT CASE
    WHEN DATE(ssq.solved_at) = CURRENT_DATE
    THEN ssq.question_id
  END) as questions_today,

  -- Performance metrics
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN ssq.is_correct THEN ssq.question_id END) /
    NULLIF(COUNT(DISTINCT ssq.question_id), 0),
    2
  ) as success_rate,

  -- Average time
  ROUND(AVG(ssq.time_spent_seconds)) as avg_time_seconds

FROM public.students s
JOIN public.profiles p ON s.profile_id = p.id
LEFT JOIN public.student_solved_questions ssq ON s.id = ssq.student_id
GROUP BY s.id, s.user_id, p.full_name;

-- Grant permissions
GRANT SELECT ON public.student_question_stats TO authenticated;
GRANT ALL ON public.student_solved_questions TO authenticated;

-- ============================================================================
-- HELPER FUNCTION: Record Question Solve (for API calls)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.record_question_solve(
  p_student_id UUID,
  p_question_id UUID,
  p_question_source TEXT,
  p_subject TEXT,
  p_topic TEXT,
  p_difficulty TEXT,
  p_is_correct BOOLEAN,
  p_time_spent_seconds INTEGER DEFAULT NULL,
  p_student_answer TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  solve_id UUID;
  attempt_num INTEGER;
BEGIN
  -- Get attempt number for this question
  SELECT COALESCE(MAX(attempt_number), 0) + 1
  INTO attempt_num
  FROM public.student_solved_questions
  WHERE student_id = p_student_id AND question_id = p_question_id;

  -- Insert solve record
  INSERT INTO public.student_solved_questions (
    student_id,
    question_id,
    question_source,
    subject,
    topic,
    difficulty,
    is_correct,
    time_spent_seconds,
    student_answer,
    attempt_number
  ) VALUES (
    p_student_id,
    p_question_id,
    p_question_source,
    p_subject,
    p_topic,
    p_difficulty,
    p_is_correct,
    p_time_spent_seconds,
    p_student_answer,
    attempt_num
  )
  ON CONFLICT (student_id, question_id, DATE(solved_at))
  DO UPDATE SET
    is_correct = p_is_correct,
    time_spent_seconds = p_time_spent_seconds,
    student_answer = p_student_answer,
    attempt_number = EXCLUDED.attempt_number
  RETURNING id INTO solve_id;

  RETURN solve_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.record_question_solve TO authenticated;

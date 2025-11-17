-- Video Lessons System
-- YouTube embedded video lessons organized by subject and topic

-- ============================================================================
-- VIDEO LESSONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.video_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content organization
  exam_type TEXT NOT NULL CHECK (exam_type IN ('TYT', 'AYT', 'LGS', 'KPSS', 'DGS', 'ALES')),
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,

  -- Video details
  youtube_url TEXT NOT NULL,
  youtube_video_id TEXT NOT NULL, -- Extracted from URL
  duration_seconds INTEGER,
  thumbnail_url TEXT,

  -- Categorization
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags TEXT[] DEFAULT ARRAY[]::text[],
  order_index INTEGER DEFAULT 0,

  -- Instructor/Creator
  instructor_name TEXT,
  instructor_title TEXT,

  -- Metadata
  is_published BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false, -- Premium content for paid users
  view_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_lessons_exam_type ON public.video_lessons(exam_type);
CREATE INDEX IF NOT EXISTS idx_video_lessons_subject ON public.video_lessons(exam_type, subject);
CREATE INDEX IF NOT EXISTS idx_video_lessons_topic ON public.video_lessons(exam_type, subject, topic);
CREATE INDEX IF NOT EXISTS idx_video_lessons_published ON public.video_lessons(is_published);
CREATE INDEX IF NOT EXISTS idx_video_lessons_premium ON public.video_lessons(is_premium);
CREATE INDEX IF NOT EXISTS idx_video_lessons_order ON public.video_lessons(exam_type, subject, topic, order_index);

-- ============================================================================
-- STUDENT VIDEO PROGRESS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.student_video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.video_lessons(id) ON DELETE CASCADE NOT NULL,

  -- Progress tracking
  watched_seconds INTEGER DEFAULT 0,
  total_duration_seconds INTEGER NOT NULL,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  is_completed BOOLEAN DEFAULT false,

  -- Timestamps
  first_watched_at TIMESTAMPTZ DEFAULT NOW(),
  last_watched_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Notes and bookmarks
  notes TEXT,
  bookmarked BOOLEAN DEFAULT false,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(student_id, video_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_student_video_progress_student ON public.student_video_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_video_progress_video ON public.student_video_progress(video_id);
CREATE INDEX IF NOT EXISTS idx_student_video_progress_completed ON public.student_video_progress(student_id, is_completed);

-- ============================================================================
-- FUNCTION: Update video progress
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_video_progress(
  p_student_id UUID,
  p_video_id UUID,
  p_watched_seconds INTEGER,
  p_total_duration_seconds INTEGER
)
RETURNS VOID AS $$
DECLARE
  completion_pct INTEGER;
  is_done BOOLEAN;
BEGIN
  -- Calculate completion percentage
  completion_pct := LEAST(100, ROUND((p_watched_seconds::NUMERIC / p_total_duration_seconds::NUMERIC) * 100));

  -- Consider complete if watched >= 90%
  is_done := completion_pct >= 90;

  -- Upsert progress
  INSERT INTO public.student_video_progress (
    student_id,
    video_id,
    watched_seconds,
    total_duration_seconds,
    completion_percentage,
    is_completed,
    last_watched_at,
    completed_at
  ) VALUES (
    p_student_id,
    p_video_id,
    p_watched_seconds,
    p_total_duration_seconds,
    completion_pct,
    is_done,
    NOW(),
    CASE WHEN is_done THEN NOW() ELSE NULL END
  )
  ON CONFLICT (student_id, video_id)
  DO UPDATE SET
    watched_seconds = GREATEST(p_watched_seconds, student_video_progress.watched_seconds),
    total_duration_seconds = p_total_duration_seconds,
    completion_percentage = completion_pct,
    is_completed = is_done,
    last_watched_at = NOW(),
    completed_at = CASE WHEN is_done AND student_video_progress.completed_at IS NULL THEN NOW() ELSE student_video_progress.completed_at END,
    updated_at = NOW();

  -- Increment view count on video
  UPDATE public.video_lessons
  SET view_count = view_count + 1
  WHERE id = p_video_id AND NOT EXISTS (
    SELECT 1 FROM public.student_video_progress
    WHERE student_id = p_student_id AND video_id = p_video_id AND first_watched_at < NOW() - INTERVAL '1 hour'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VIEW: Student Video Statistics
-- ============================================================================

CREATE OR REPLACE VIEW public.student_video_stats AS
SELECT
  s.id as student_id,
  s.user_id,
  p.full_name as student_name,
  COUNT(DISTINCT svp.video_id) as total_videos_watched,
  COUNT(DISTINCT CASE WHEN svp.is_completed THEN svp.video_id END) as videos_completed,
  COALESCE(SUM(svp.watched_seconds), 0) as total_watch_time_seconds,
  ROUND(AVG(svp.completion_percentage), 2) as avg_completion_percentage,
  COUNT(DISTINCT CASE WHEN svp.bookmarked THEN svp.video_id END) as bookmarked_videos,
  MAX(svp.last_watched_at) as last_watched_at
FROM public.students s
JOIN public.profiles p ON s.profile_id = p.id
LEFT JOIN public.student_video_progress svp ON s.id = svp.student_id
GROUP BY s.id, s.user_id, p.full_name;

-- Grant permissions
GRANT SELECT ON public.student_video_stats TO authenticated;
GRANT ALL ON public.video_lessons TO authenticated;
GRANT ALL ON public.student_video_progress TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_video_progress TO authenticated;

-- ============================================================================
-- FUNCTION: Extract YouTube Video ID from URL
-- ============================================================================

CREATE OR REPLACE FUNCTION public.extract_youtube_id(youtube_url TEXT)
RETURNS TEXT AS $$
DECLARE
  video_id TEXT;
BEGIN
  -- Handle different YouTube URL formats
  -- https://www.youtube.com/watch?v=VIDEO_ID
  -- https://youtu.be/VIDEO_ID
  -- https://www.youtube.com/embed/VIDEO_ID

  IF youtube_url ~ 'youtube\.com/watch\?v=' THEN
    video_id := SUBSTRING(youtube_url FROM 'v=([a-zA-Z0-9_-]{11})');
  ELSIF youtube_url ~ 'youtu\.be/' THEN
    video_id := SUBSTRING(youtube_url FROM 'youtu\.be/([a-zA-Z0-9_-]{11})');
  ELSIF youtube_url ~ 'youtube\.com/embed/' THEN
    video_id := SUBSTRING(youtube_url FROM 'embed/([a-zA-Z0-9_-]{11})');
  END IF;

  RETURN video_id;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- TRIGGER: Auto-extract YouTube ID on insert/update
-- ============================================================================

CREATE OR REPLACE FUNCTION public.auto_extract_youtube_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.youtube_video_id := public.extract_youtube_id(NEW.youtube_url);

  -- Auto-generate thumbnail URL
  IF NEW.youtube_video_id IS NOT NULL THEN
    NEW.thumbnail_url := 'https://img.youtube.com/vi/' || NEW.youtube_video_id || '/maxresdefault.jpg';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS before_video_lesson_insert_extract_id ON public.video_lessons;
CREATE TRIGGER before_video_lesson_insert_extract_id
  BEFORE INSERT OR UPDATE ON public.video_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_extract_youtube_id();

-- ============================================================================
-- Sample Data (TYT Matematik - İlk 10 konu)
-- ============================================================================

INSERT INTO public.video_lessons (exam_type, subject, topic, title, description, youtube_url, instructor_name, instructor_title, difficulty, order_index) VALUES
('TYT', 'Matematik', 'Temel Kavramlar', 'Sayılar ve Sayı Sistemleri', 'Doğal sayılar, tam sayılar, rasyonel sayılar ve gerçek sayılar üzerine temel bilgiler', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Ahmet Yılmaz', 'Matematik Öğretmeni', 'easy', 1),
('TYT', 'Matematik', 'Temel Kavramlar', 'Üslü Sayılar', 'Üslü sayılar, üs kuralları ve üslü sayılarda işlemler', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Ahmet Yılmaz', 'Matematik Öğretmeni', 'easy', 2),
('TYT', 'Matematik', 'Temel Kavramlar', 'Köklü Sayılar', 'Köklü sayılar, kök alma işlemleri ve özellikleri', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Ahmet Yılmaz', 'Matematik Öğretmeni', 'medium', 3),
('TYT', 'Matematik', 'Denklemler', 'Birinci Dereceden Denklemler', 'Tek bilinmeyenli birinci dereceden denklemler ve çözüm yöntemleri', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Mehmet Kaya', 'Matematik Öğretmeni', 'easy', 4),
('TYT', 'Matematik', 'Denklemler', 'İkinci Dereceden Denklemler', 'İkinci dereceden denklemler, diskriminant ve çözüm yöntemleri', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Mehmet Kaya', 'Matematik Öğretmeni', 'medium', 5),
('TYT', 'Fizik', 'Hareket', 'Hız ve İvme', 'Hız kavramı, ortalama hız, anlık hız ve ivme', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Ayşe Demir', 'Fizik Öğretmeni', 'easy', 1),
('TYT', 'Fizik', 'Hareket', 'Serbest Düşme', 'Serbest düşme hareketi, yer çekimi ivmesi', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Ayşe Demir', 'Fizik Öğretmeni', 'medium', 2),
('TYT', 'Kimya', 'Atom', 'Atom Modelleri', 'Dalton, Thomson, Rutherford ve Bohr atom modelleri', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Can Özkan', 'Kimya Öğretmeni', 'medium', 1),
('TYT', 'Kimya', 'Atom', 'Periyodik Cetvel', 'Periyodik sistemin incelenmesi, gruplar ve periyotlar', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Can Özkan', 'Kimya Öğretmeni', 'medium', 2),
('AYT', 'Matematik', 'Türev', 'Türev Tanımı', 'Türev kavramı, türevin geometrik anlamı', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Elif Şahin', 'Matematik Öğretmeni', 'hard', 1);

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.extract_youtube_id TO authenticated;

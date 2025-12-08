-- =====================================================
-- TOPIC TRACKING SYSTEM
-- Students can track their progress on subjects/topics
-- =====================================================

-- =====================================================
-- Topics Master Table (All curriculum topics)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade_level INTEGER NOT NULL CHECK (grade_level >= 5 AND grade_level <= 12),
    subject VARCHAR(100) NOT NULL, -- Matematik, Türkçe, Fen, etc.
    topic_name VARCHAR(200) NOT NULL, -- Konu adı (örn: "Doğal Sayılarda Toplama")
    topic_order INTEGER NOT NULL, -- Sıralama için
    exam_type VARCHAR(50), -- TYT, AYT-SAY, AYT-EA, AYT-SOZ, LGS
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(grade_level, subject, topic_name)
);

CREATE INDEX idx_topics_grade_subject ON public.topics(grade_level, subject);
CREATE INDEX idx_topics_exam_type ON public.topics(exam_type);

-- =====================================================
-- Student Topic Progress Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.student_topic_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,

    -- Progress tracking
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    is_completed BOOLEAN DEFAULT false,

    -- Question statistics
    total_questions_solved INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    wrong_answers INTEGER DEFAULT 0,

    -- Source books used (JSON array of book names)
    source_books JSONB DEFAULT '[]'::jsonb,

    -- Notes
    notes TEXT,

    -- Timestamps
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_studied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(student_id, topic_id)
);

CREATE INDEX idx_student_progress_student ON public.student_topic_progress(student_id);
CREATE INDEX idx_student_progress_topic ON public.student_topic_progress(topic_id);
CREATE INDEX idx_student_progress_completion ON public.student_topic_progress(is_completed);

-- =====================================================
-- Study Sessions (detailed logging)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.topic_study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,

    -- Session details
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_minutes INTEGER, -- How long studied
    questions_solved INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    wrong_count INTEGER DEFAULT 0,

    -- Source
    source_book VARCHAR(200), -- Which book used in this session

    -- Notes
    session_notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_study_sessions_student ON public.topic_study_sessions(student_id);
CREATE INDEX idx_study_sessions_date ON public.topic_study_sessions(session_date);

-- =====================================================
-- RLS Policies
-- =====================================================

-- Topics: Everyone can read
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view topics"
    ON public.topics FOR SELECT
    USING (true);

-- Student Progress: Only owner can access
ALTER TABLE public.student_topic_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own progress"
    ON public.student_topic_progress FOR SELECT
    USING (
        student_id IN (
            SELECT id FROM public.students WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Students can insert their own progress"
    ON public.student_topic_progress FOR INSERT
    WITH CHECK (
        student_id IN (
            SELECT id FROM public.students WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Students can update their own progress"
    ON public.student_topic_progress FOR UPDATE
    USING (
        student_id IN (
            SELECT id FROM public.students WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Students can delete their own progress"
    ON public.student_topic_progress FOR DELETE
    USING (
        student_id IN (
            SELECT id FROM public.students WHERE user_id = auth.uid()
        )
    );

-- Study Sessions: Only owner can access
ALTER TABLE public.topic_study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own sessions"
    ON public.topic_study_sessions FOR SELECT
    USING (
        student_id IN (
            SELECT id FROM public.students WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Students can insert their own sessions"
    ON public.topic_study_sessions FOR INSERT
    WITH CHECK (
        student_id IN (
            SELECT id FROM public.students WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to update topic progress automatically
CREATE OR REPLACE FUNCTION update_topic_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update completion status if percentage = 100
    IF NEW.completion_percentage = 100 AND NEW.is_completed = false THEN
        NEW.is_completed = true;
        NEW.completed_at = NOW();
    END IF;

    -- Update last_studied_at
    NEW.last_studied_at = NOW();
    NEW.updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_topic_progress
    BEFORE UPDATE ON public.student_topic_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_topic_progress();

-- =====================================================
-- Grant Permissions
-- =====================================================
GRANT SELECT ON public.topics TO authenticated;
GRANT ALL ON public.student_topic_progress TO authenticated;
GRANT ALL ON public.topic_study_sessions TO authenticated;

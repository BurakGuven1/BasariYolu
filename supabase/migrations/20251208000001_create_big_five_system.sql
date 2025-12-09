-- =====================================================
-- BIG FIVE PERSONALITY ASSESSMENT SYSTEM
-- Students can take personality tests
-- =====================================================

-- =====================================================
-- Big Five Questions Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.big_five_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    trait VARCHAR(50) NOT NULL CHECK (trait IN ('openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism')),
    reverse_scored BOOLEAN DEFAULT FALSE,
    min_grade INTEGER NOT NULL CHECK (min_grade >= 5 AND min_grade <= 12),
    max_grade INTEGER NOT NULL CHECK (max_grade >= 5 AND max_grade <= 12),
    question_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_big_five_questions_grade ON public.big_five_questions(min_grade, max_grade);
CREATE INDEX IF NOT EXISTS idx_big_five_questions_trait ON public.big_five_questions(trait);

-- =====================================================
-- Student Responses Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.big_five_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.big_five_questions(id) ON DELETE CASCADE,
    response_value INTEGER NOT NULL CHECK (response_value >= 1 AND response_value <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_big_five_responses_student ON public.big_five_responses(student_id);
CREATE INDEX IF NOT EXISTS idx_big_five_responses_question ON public.big_five_responses(question_id);

-- =====================================================
-- Student Results Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.big_five_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    openness_score NUMERIC(5,2) NOT NULL,
    conscientiousness_score NUMERIC(5,2) NOT NULL,
    extraversion_score NUMERIC(5,2) NOT NULL,
    agreeableness_score NUMERIC(5,2) NOT NULL,
    neuroticism_score NUMERIC(5,2) NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id)
);

CREATE INDEX IF NOT EXISTS idx_big_five_results_student ON public.big_five_results(student_id);

-- =====================================================
-- RPC Function: Calculate Big Five Scores
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_big_five_scores(p_student_id UUID)
RETURNS TABLE(
    openness NUMERIC,
    conscientiousness NUMERIC,
    extraversion NUMERIC,
    agreeableness NUMERIC,
    neuroticism NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ROUND(AVG(CASE
            WHEN q.reverse_scored THEN (6 - r.response_value)::NUMERIC
            ELSE r.response_value::NUMERIC
        END) FILTER (WHERE q.trait = 'openness'), 2) as openness,
        ROUND(AVG(CASE
            WHEN q.reverse_scored THEN (6 - r.response_value)::NUMERIC
            ELSE r.response_value::NUMERIC
        END) FILTER (WHERE q.trait = 'conscientiousness'), 2) as conscientiousness,
        ROUND(AVG(CASE
            WHEN q.reverse_scored THEN (6 - r.response_value)::NUMERIC
            ELSE r.response_value::NUMERIC
        END) FILTER (WHERE q.trait = 'extraversion'), 2) as extraversion,
        ROUND(AVG(CASE
            WHEN q.reverse_scored THEN (6 - r.response_value)::NUMERIC
            ELSE r.response_value::NUMERIC
        END) FILTER (WHERE q.trait = 'agreeableness'), 2) as agreeableness,
        ROUND(AVG(CASE
            WHEN q.reverse_scored THEN (6 - r.response_value)::NUMERIC
            ELSE r.response_value::NUMERIC
        END) FILTER (WHERE q.trait = 'neuroticism'), 2) as neuroticism
    FROM big_five_responses r
    JOIN big_five_questions q ON q.id = r.question_id
    WHERE r.student_id = p_student_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Grant Permissions
-- =====================================================
GRANT SELECT ON public.big_five_questions TO authenticated;
GRANT ALL ON public.big_five_responses TO authenticated;
GRANT ALL ON public.big_five_results TO authenticated;

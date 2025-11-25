-- Big Five Personality Inventory System
-- Creates tables for Big Five assessment questions and student responses

-- =====================================================
-- Big Five Questions Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.big_five_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    trait VARCHAR(50) NOT NULL CHECK (trait IN ('openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism')),
    reverse_scored BOOLEAN DEFAULT false,
    min_grade INTEGER NOT NULL CHECK (min_grade >= 5 AND min_grade <= 12),
    max_grade INTEGER NOT NULL CHECK (max_grade >= 5 AND max_grade <= 12),
    question_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT valid_grade_range CHECK (min_grade <= max_grade)
);

-- =====================================================
-- Big Five Responses Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.big_five_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.big_five_questions(id) ON DELETE CASCADE,
    response_value INTEGER NOT NULL CHECK (response_value >= 1 AND response_value <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, question_id)
);

-- =====================================================
-- Big Five Results Table (cached scores)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.big_five_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    openness_score DECIMAL(5,2) NOT NULL CHECK (openness_score >= 0 AND openness_score <= 5),
    conscientiousness_score DECIMAL(5,2) NOT NULL CHECK (conscientiousness_score >= 0 AND conscientiousness_score <= 5),
    extraversion_score DECIMAL(5,2) NOT NULL CHECK (extraversion_score >= 0 AND extraversion_score <= 5),
    agreeableness_score DECIMAL(5,2) NOT NULL CHECK (agreeableness_score >= 0 AND agreeableness_score <= 5),
    neuroticism_score DECIMAL(5,2) NOT NULL CHECK (neuroticism_score >= 0 AND neuroticism_score <= 5),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id)
);

-- =====================================================
-- Indexes for Performance
-- =====================================================
CREATE INDEX idx_big_five_questions_trait ON public.big_five_questions(trait);
CREATE INDEX idx_big_five_questions_grade ON public.big_five_questions(min_grade, max_grade);
CREATE INDEX idx_big_five_responses_student ON public.big_five_responses(student_id);
CREATE INDEX idx_big_five_responses_question ON public.big_five_responses(question_id);
CREATE INDEX idx_big_five_results_student ON public.big_five_results(student_id);

-- =====================================================
-- RLS Policies
-- =====================================================

-- Enable RLS
ALTER TABLE public.big_five_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.big_five_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.big_five_results ENABLE ROW LEVEL SECURITY;

-- Questions: Everyone can read
CREATE POLICY "Anyone can view Big Five questions"
    ON public.big_five_questions FOR SELECT
    USING (true);

-- Responses: Students can insert/update/view their own
CREATE POLICY "Students can view their own responses"
    ON public.big_five_responses FOR SELECT
    USING (
        student_id IN (
            SELECT id FROM public.students WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Students can insert their own responses"
    ON public.big_five_responses FOR INSERT
    WITH CHECK (
        student_id IN (
            SELECT id FROM public.students WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Students can update their own responses"
    ON public.big_five_responses FOR UPDATE
    USING (
        student_id IN (
            SELECT id FROM public.students WHERE user_id = auth.uid()
        )
    );

-- Results: Students can view their own, teachers can view their students'
CREATE POLICY "Students can view their own results"
    ON public.big_five_results FOR SELECT
    USING (
        student_id IN (
            SELECT id FROM public.students WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can view their students' results"
    ON public.big_five_results FOR SELECT
    USING (
        student_id IN (
            SELECT s.id FROM public.students s
            INNER JOIN public.teachers t ON s.id = ANY(t.student_ids)
            WHERE t.user_id = auth.uid()
        )
    );

CREATE POLICY "Students can insert/update their own results"
    ON public.big_five_results FOR INSERT
    WITH CHECK (
        student_id IN (
            SELECT id FROM public.students WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Students can update their own results"
    ON public.big_five_results FOR UPDATE
    USING (
        student_id IN (
            SELECT id FROM public.students WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- Function to Calculate Big Five Scores
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_big_five_scores(p_student_id UUID)
RETURNS TABLE (
    openness DECIMAL,
    conscientiousness DECIMAL,
    extraversion DECIMAL,
    agreeableness DECIMAL,
    neuroticism DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ROUND(AVG(CASE
            WHEN q.trait = 'openness' THEN
                CASE WHEN q.reverse_scored THEN 6 - r.response_value ELSE r.response_value END
            ELSE NULL
        END)::NUMERIC, 2) as openness,
        ROUND(AVG(CASE
            WHEN q.trait = 'conscientiousness' THEN
                CASE WHEN q.reverse_scored THEN 6 - r.response_value ELSE r.response_value END
            ELSE NULL
        END)::NUMERIC, 2) as conscientiousness,
        ROUND(AVG(CASE
            WHEN q.trait = 'extraversion' THEN
                CASE WHEN q.reverse_scored THEN 6 - r.response_value ELSE r.response_value END
            ELSE NULL
        END)::NUMERIC, 2) as extraversion,
        ROUND(AVG(CASE
            WHEN q.trait = 'agreeableness' THEN
                CASE WHEN q.reverse_scored THEN 6 - r.response_value ELSE r.response_value END
            ELSE NULL
        END)::NUMERIC, 2) as agreeableness,
        ROUND(AVG(CASE
            WHEN q.trait = 'neuroticism' THEN
                CASE WHEN q.reverse_scored THEN 6 - r.response_value ELSE r.response_value END
            ELSE NULL
        END)::NUMERIC, 2) as neuroticism
    FROM public.big_five_responses r
    INNER JOIN public.big_five_questions q ON r.question_id = q.id
    WHERE r.student_id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Seed Big Five Questions (Turkish)
-- =====================================================

-- Openness (Deneyime Açıklık) - 10 questions
INSERT INTO public.big_five_questions (question_text, trait, reverse_scored, min_grade, max_grade, question_order) VALUES
('Yeni şeyler öğrenmeyi severim', 'openness', false, 5, 12, 1),
('Hayal kurmayı ve yaratıcı düşünmeyi severim', 'openness', false, 5, 12, 2),
('Sanat, müzik veya edebiyatla ilgilenirim', 'openness', false, 5, 12, 3),
('Yeni fikirler ve farklı bakış açıları beni heyecanlandırır', 'openness', false, 5, 12, 4),
('Değişiklikten hoşlanmam, her şeyin aynı kalmasını tercih ederim', 'openness', true, 5, 12, 5),
('Meraklıyım ve çevremi keşfetmek isterim', 'openness', false, 5, 12, 6),
('Soyut kavramlar üzerine düşünmekten hoşlanırım', 'openness', false, 7, 12, 7),
('Rutin işleri yapmayı tercih ederim', 'openness', true, 5, 12, 8),
('Farklı kültürler ve yerler hakkında öğrenmek isterim', 'openness', false, 5, 12, 9),
('Yeni deneyimler yaşamaktan kaçınırım', 'openness', true, 5, 12, 10);

-- Conscientiousness (Sorumluluk) - 10 questions
INSERT INTO public.big_five_questions (question_text, trait, reverse_scored, min_grade, max_grade, question_order) VALUES
('Planlı ve düzenli çalışırım', 'conscientiousness', false, 5, 12, 11),
('Görevlerimi zamanında tamamlarım', 'conscientiousness', false, 5, 12, 12),
('Detaylara dikkat ederim', 'conscientiousness', false, 5, 12, 13),
('Hedeflerime ulaşmak için çok çalışırım', 'conscientiousness', false, 5, 12, 14),
('Dağınıklık beni rahatsız etmez', 'conscientiousness', true, 5, 12, 15),
('Sorumluluklarımı ciddiye alırım', 'conscientiousness', false, 5, 12, 16),
('İşleri son dakikaya bırakırım', 'conscientiousness', true, 5, 12, 17),
('Her şeyin düzenli olmasını severim', 'conscientiousness', false, 5, 12, 18),
('Başladığım işleri bitiririm', 'conscientiousness', false, 5, 12, 19),
('Tembellik yapmayı severim', 'conscientiousness', true, 5, 12, 20);

-- Extraversion (Dışa Dönüklük) - 10 questions
INSERT INTO public.big_five_questions (question_text, trait, reverse_scored, min_grade, max_grade, question_order) VALUES
('İnsanlarla vakit geçirmekten hoşlanırım', 'extraversion', false, 5, 12, 21),
('Sosyal ortamlarda rahatım', 'extraversion', false, 5, 12, 22),
('Yeni insanlarla tanışmak beni mutlu eder', 'extraversion', false, 5, 12, 23),
('Konuşkan biriyim', 'extraversion', false, 5, 12, 24),
('Yalnız kalmayı tercih ederim', 'extraversion', true, 5, 12, 25),
('Grup çalışmalarında aktif rol alırım', 'extraversion', false, 5, 12, 26),
('Utangaç biriyim', 'extraversion', true, 5, 12, 27),
('Enerjik ve hareketliyim', 'extraversion', false, 5, 12, 28),
('Sessiz ortamları tercih ederim', 'extraversion', true, 5, 12, 29),
('Dikkat çekmekten hoşlanırım', 'extraversion', false, 5, 12, 30);

-- Agreeableness (Uyumluluk) - 10 questions
INSERT INTO public.big_five_questions (question_text, trait, reverse_scored, min_grade, max_grade, question_order) VALUES
('İnsanlara yardım etmek beni mutlu eder', 'agreeableness', false, 5, 12, 31),
('Başkalarının duygularını önemserim', 'agreeableness', false, 5, 12, 32),
('İşbirlikçi biriyim', 'agreeableness', false, 5, 12, 33),
('İnsanlara güvenirim', 'agreeableness', false, 5, 12, 34),
('Tartışmaya girmeyi severim', 'agreeableness', true, 5, 12, 35),
('Nazik ve anlayışlıyım', 'agreeableness', false, 5, 12, 36),
('Başkalarının fikirlerine saygı duyarım', 'agreeableness', false, 5, 12, 37),
('Eleştirici biriyim', 'agreeableness', true, 5, 12, 38),
('Affedici biriyim', 'agreeableness', false, 5, 12, 39),
('Bencil davranabilirim', 'agreeableness', true, 5, 12, 40);

-- Neuroticism (Duygusal Denge - Ters kodlu) - 10 questions
INSERT INTO public.big_five_questions (question_text, trait, reverse_scored, min_grade, max_grade, question_order) VALUES
('Sık sık endişelenirim', 'neuroticism', false, 5, 12, 41),
('Stresli durumlarda sakin kalabilirim', 'neuroticism', true, 5, 12, 42),
('Duygusal durumum sık sık değişir', 'neuroticism', false, 5, 12, 43),
('Kolay üzülürüm', 'neuroticism', false, 5, 12, 44),
('Genellikle rahat ve sakinirim', 'neuroticism', true, 5, 12, 45),
('Küçük şeyler bile beni sinirlendirebilir', 'neuroticism', false, 5, 12, 46),
('Kontrolümü kaybetmekten korkarım', 'neuroticism', false, 5, 12, 47),
('Baskı altında iyi çalışırım', 'neuroticism', true, 5, 12, 48),
('Kolaylıkla pes ederim', 'neuroticism', false, 5, 12, 49),
('Duygusal olarak dengeliyim', 'neuroticism', true, 5, 12, 50);

-- Grant permissions
GRANT SELECT ON public.big_five_questions TO authenticated;
GRANT ALL ON public.big_five_responses TO authenticated;
GRANT ALL ON public.big_five_results TO authenticated;

-- =====================================================
-- SEED CURRICULUM TOPICS
-- Populate topics table with Turkish curriculum data
-- =====================================================

-- Function to insert topics
CREATE OR REPLACE FUNCTION insert_topic(
    p_grade INTEGER,
    p_subject VARCHAR,
    p_topic VARCHAR,
    p_order INTEGER,
    p_exam_type VARCHAR DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.topics (grade_level, subject, topic_name, topic_order, exam_type)
    VALUES (p_grade, p_subject, p_topic, p_order, p_exam_type)
    ON CONFLICT (grade_level, subject, topic_name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ÖRNEKLERİ KALDIRILDI
-- DeepSeek ile oluşturulan SQL'ler buraya eklenecek

-- Drop the helper function
DROP FUNCTION insert_topic;

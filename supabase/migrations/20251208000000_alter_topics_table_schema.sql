-- =====================================================
-- ALTER TOPICS TABLE - Simplify Schema
-- Remove sub_topic, rename main_topic to topic_name
-- =====================================================

-- Drop old unique constraint
ALTER TABLE public.topics
DROP CONSTRAINT IF EXISTS topics_grade_level_subject_main_topic_sub_topic_key;

-- Drop sub_topic column
ALTER TABLE public.topics
DROP COLUMN IF EXISTS sub_topic;

-- Rename main_topic to topic_name
ALTER TABLE public.topics
RENAME COLUMN main_topic TO topic_name;

-- Add new unique constraint
ALTER TABLE public.topics
ADD CONSTRAINT topics_grade_level_subject_topic_name_key
UNIQUE (grade_level, subject, topic_name);

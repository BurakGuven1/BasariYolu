-- AI Chat Enhancements: Conversation History and Image Support
-- This migration adds support for conversation threads and image uploads in AI chat

-- =====================================================
-- AI Conversations Table
-- =====================================================
-- Stores conversation threads for each student
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT, -- Auto-generated from first message
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- AI Messages Table
-- =====================================================
-- Stores individual messages within conversations
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  image_url TEXT, -- URL to stored image in Supabase Storage
  tokens_used INTEGER,
  model_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Update existing ai_questions table (if exists)
-- =====================================================
-- Add conversation_id to link old questions to new conversation system
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_questions') THEN
    ALTER TABLE public.ai_questions
    ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================
-- Indexes for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_ai_conversations_student_id ON public.ai_conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated_at ON public.ai_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON public.ai_messages(created_at);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- Students can only access their own conversations
CREATE POLICY "Students can view their own conversations"
  ON public.ai_conversations
  FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own conversations"
  ON public.ai_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own conversations"
  ON public.ai_conversations
  FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "Students can delete their own conversations"
  ON public.ai_conversations
  FOR DELETE
  USING (auth.uid() = student_id);

-- Students can only access messages from their own conversations
CREATE POLICY "Students can view their own messages"
  ON public.ai_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations
      WHERE ai_conversations.id = ai_messages.conversation_id
      AND ai_conversations.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can create messages in their own conversations"
  ON public.ai_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_conversations
      WHERE ai_conversations.id = ai_messages.conversation_id
      AND ai_conversations.student_id = auth.uid()
    )
  );

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to update conversation's updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.ai_conversations
  SET
    updated_at = NOW(),
    last_message_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update conversation timestamp when message is added
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON public.ai_messages;
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON public.ai_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Function to get or create a conversation for a student
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_student_id UUID,
  p_conversation_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- If conversation_id provided, use it
  IF p_conversation_id IS NOT NULL THEN
    SELECT id INTO v_conversation_id
    FROM public.ai_conversations
    WHERE id = p_conversation_id AND student_id = p_student_id;

    IF FOUND THEN
      RETURN v_conversation_id;
    END IF;
  END IF;

  -- Create new conversation
  INSERT INTO public.ai_conversations (student_id)
  VALUES (p_student_id)
  RETURNING id INTO v_conversation_id;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get conversation messages with history
CREATE OR REPLACE FUNCTION get_conversation_messages(
  p_conversation_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  role TEXT,
  content TEXT,
  image_url TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.role,
    m.content,
    m.image_url,
    m.tokens_used,
    m.created_at
  FROM public.ai_messages m
  WHERE m.conversation_id = p_conversation_id
  ORDER BY m.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get student's recent conversations
CREATE OR REPLACE FUNCTION get_student_conversations(
  p_student_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  message_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    COALESCE(c.title, 'Yeni Sohbet') as title,
    c.created_at,
    c.updated_at,
    c.last_message_at,
    COUNT(m.id) as message_count
  FROM public.ai_conversations c
  LEFT JOIN public.ai_messages m ON m.conversation_id = c.id
  WHERE c.student_id = p_student_id
  GROUP BY c.id, c.title, c.created_at, c.updated_at, c.last_message_at
  ORDER BY c.last_message_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Storage Bucket for AI Images
-- =====================================================
-- Create storage bucket for AI chat images (if not exists)
-- Public bucket allows direct image access via public URLs
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-chat-images', 'ai-chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for ai-chat-images bucket
CREATE POLICY "Students can upload their own images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ai-chat-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Students can view their own images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ai-chat-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Students can delete their own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'ai-chat-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE public.ai_conversations IS 'Stores AI chat conversation threads for students';
COMMENT ON TABLE public.ai_messages IS 'Stores individual messages within AI chat conversations';
COMMENT ON COLUMN public.ai_messages.image_url IS 'Optional image URL for vision-based questions';
COMMENT ON FUNCTION get_or_create_conversation IS 'Gets existing conversation or creates new one for student';
COMMENT ON FUNCTION get_conversation_messages IS 'Retrieves all messages in a conversation with history';
COMMENT ON FUNCTION get_student_conversations IS 'Gets list of student conversations with metadata';

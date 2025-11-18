-- Fix AI Chat Images Bucket - Make it Public
-- This allows images to be viewed via public URLs without authentication

-- Update existing bucket to public
UPDATE storage.buckets
SET public = true
WHERE id = 'ai-chat-images';

-- Note: RLS policies still protect upload/delete operations
-- Only students can upload to their own folder (student_id/)
-- Anyone can view public URLs (needed for image rendering in chat)

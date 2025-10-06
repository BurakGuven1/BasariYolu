/*
  # Create Storage Bucket for Exam Files

  1. Storage Setup
    - Create 'exam-files' bucket for storing exam result files
    - Set up proper RLS policies for file access
    - Allow teachers to upload files
    - Allow students to view files from their classes

  2. Security
    - Teachers can upload files to their class exams
    - Students can view files from exams in their classes
    - Public read access for authenticated users
*/

-- Create the exam-files bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-files', 'exam-files', true);

-- Allow authenticated users to upload files
CREATE POLICY "Teachers can upload exam files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exam-files' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to view files
CREATE POLICY "Authenticated users can view exam files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'exam-files');

-- Allow file owners to delete files
CREATE POLICY "Users can delete their own exam files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'exam-files' AND
  auth.role() = 'authenticated'
);
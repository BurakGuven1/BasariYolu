-- Create student-exam-artifacts bucket for storing exam PDFs and images
-- This migration creates the storage bucket and sets up RLS policies

-- Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-exam-artifacts',
  'student-exam-artifacts',
  true, -- Public bucket so files can be accessed via publicUrl
  10485760, -- 10MB file size limit
  ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/heic',
    'image/heif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/heic',
    'image/heif'
  ];

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teachers can upload exam artifacts" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can view their institution artifacts" ON storage.objects;
DROP POLICY IF EXISTS "Students can view their own artifacts" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for student-exam-artifacts" ON storage.objects;

-- RLS Policy: Teachers can upload exam artifacts to their institution
CREATE POLICY "Teachers can upload exam artifacts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'student-exam-artifacts'
  AND (
    -- Teacher is a member of the institution (path format: institutionId/studentId/filename)
    EXISTS (
      SELECT 1 FROM institution_members
      WHERE institution_members.user_id = auth.uid()
      AND institution_members.role = 'teacher'
      AND institution_members.institution_id::text = split_part(name, '/', 1)
    )
    OR
    -- Institution owner/manager
    EXISTS (
      SELECT 1 FROM institution_members
      WHERE institution_members.user_id = auth.uid()
      AND institution_members.role IN ('owner', 'manager')
      AND institution_members.institution_id::text = split_part(name, '/', 1)
    )
  )
);

-- RLS Policy: Teachers can view artifacts from their institution
CREATE POLICY "Teachers can view their institution artifacts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'student-exam-artifacts'
  AND (
    -- Teacher is a member of the institution
    EXISTS (
      SELECT 1 FROM institution_members
      WHERE institution_members.user_id = auth.uid()
      AND institution_members.role IN ('teacher', 'owner', 'manager')
      AND institution_members.institution_id::text = split_part(name, '/', 1)
    )
  )
);

-- RLS Policy: Students can view their own artifacts
CREATE POLICY "Students can view their own artifacts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'student-exam-artifacts'
  AND split_part(name, '/', 2) = auth.uid()::text
);

-- RLS Policy: Public read access (since bucket is public)
-- This allows the publicUrl to work properly
CREATE POLICY "Public read access for student-exam-artifacts"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'student-exam-artifacts');

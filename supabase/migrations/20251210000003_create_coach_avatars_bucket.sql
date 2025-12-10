-- =====================================================
-- COACH AVATARS STORAGE BUCKET
-- For storing coach profile photos
-- =====================================================

-- 1. Create storage bucket for coach avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'coach-avatars',
    'coach-avatars',
    true,
    2097152, -- 2MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- 2. RLS Policies for coach-avatars bucket
-- Allow authenticated users to upload their own avatar
CREATE POLICY "Teachers can upload their own coach avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'coach-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatar
CREATE POLICY "Teachers can update their own coach avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'coach-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatar
CREATE POLICY "Teachers can delete their own coach avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'coach-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow everyone to view coach avatars (public bucket)
CREATE POLICY "Anyone can view coach avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'coach-avatars');

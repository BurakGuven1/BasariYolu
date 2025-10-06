@@ .. @@
 -- Create storage bucket for exam files
-INSERT INTO storage.buckets (id, name, public) VALUES ('exam-files', 'exam-files', true);
+INSERT INTO storage.buckets (id, name, public) 
+VALUES ('exam-files', 'exam-files', true)
+ON CONFLICT (id) DO NOTHING;
 
 -- Create RLS policies for exam-files bucket
 CREATE POLICY "Teachers can upload exam files"
@@ -22,4 +24,12 @@ CREATE POLICY "Authenticated users can view exam files"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (bucket_id = 'exam-files');
+
+-- Create RLS policy for exam_files table
+CREATE POLICY "Teachers can insert exam files"
+  ON exam_files FOR INSERT
+  TO authenticated
+  WITH CHECK (
+    teacher_id IN (SELECT id FROM teachers WHERE email = auth.jwt() ->> 'email')
+  );
-- Supabase SQL Editor'da çalıştır
-- Soru Portalı RLS'i doğru ve güvenli policy'lerle aktif et

-- 1. Mevcut basit policy'leri sil
DROP POLICY IF EXISTS "authenticated_all_student_questions" ON student_questions;
DROP POLICY IF EXISTS "authenticated_all_student_answers" ON student_answers;
DROP POLICY IF EXISTS "authenticated_all_question_likes" ON question_likes;
DROP POLICY IF EXISTS "authenticated_all_answer_likes" ON answer_likes;

-- 2. STUDENT_QUESTIONS için güvenli policy'ler

-- SELECT: Herkes görebilir (authenticated kullanıcılar)
CREATE POLICY "Anyone can view questions"
ON student_questions FOR SELECT
TO authenticated
USING (true);

-- INSERT: Authenticated kullanıcılar soru ekleyebilir
CREATE POLICY "Authenticated users can create questions"
ON student_questions FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Sadece kendi sorularını güncelleyebilir
CREATE POLICY "Users can update own questions"
ON student_questions FOR UPDATE
TO authenticated
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- DELETE: Sadece kendi sorularını silebilir
CREATE POLICY "Users can delete own questions"
ON student_questions FOR DELETE
TO authenticated
USING (auth.uid() = student_id);

-- 3. STUDENT_ANSWERS için güvenli policy'ler

-- SELECT: Herkes görebilir
CREATE POLICY "Anyone can view answers"
ON student_answers FOR SELECT
TO authenticated
USING (true);

-- INSERT: Authenticated kullanıcılar yanıt ekleyebilir
CREATE POLICY "Authenticated users can create answers"
ON student_answers FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Sadece kendi yanıtlarını güncelleyebilir
CREATE POLICY "Users can update own answers"
ON student_answers FOR UPDATE
TO authenticated
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- DELETE: Sadece kendi yanıtlarını silebilir
CREATE POLICY "Users can delete own answers"
ON student_answers FOR DELETE
TO authenticated
USING (auth.uid() = student_id);

-- 4. QUESTION_LIKES için güvenli policy'ler

-- SELECT: Herkes görebilir
CREATE POLICY "Anyone can view question likes"
ON question_likes FOR SELECT
TO authenticated
USING (true);

-- INSERT: Authenticated kullanıcılar beğenebilir
CREATE POLICY "Authenticated users can like questions"
ON question_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

-- DELETE: Sadece kendi beğenisini kaldırabilir
CREATE POLICY "Users can remove own question likes"
ON question_likes FOR DELETE
TO authenticated
USING (auth.uid() = student_id);

-- 5. ANSWER_LIKES için güvenli policy'ler

-- SELECT: Herkes görebilir
CREATE POLICY "Anyone can view answer likes"
ON answer_likes FOR SELECT
TO authenticated
USING (true);

-- INSERT: Authenticated kullanıcılar beğenebilir
CREATE POLICY "Authenticated users can like answers"
ON answer_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

-- DELETE: Sadece kendi beğenisini kaldırabilir
CREATE POLICY "Users can remove own answer likes"
ON answer_likes FOR DELETE
TO authenticated
USING (auth.uid() = student_id);

-- 6. Kontrol et - Her tablo için 4 policy olmalı
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('student_questions', 'student_answers', 'question_likes', 'answer_likes')
ORDER BY tablename, cmd;

-- Başarı mesajı
SELECT 'RLS policy''leri güvenli şekilde güncellendi!' as message;

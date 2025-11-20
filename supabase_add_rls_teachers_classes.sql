-- ADIM 2: Policy'si OLMAYAN kritik tablolara RLS ve policy ekle
-- TEACHERS, CLASSES, CLASS_STUDENTS gibi tablolar

-- ============================================================================
-- TEACHERS TABLOSU
-- ============================================================================

-- RLS aktif et
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- SELECT: Sadece kendi bilgilerini görebilir
CREATE POLICY "Teachers can view own profile"
ON teachers FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- UPDATE: Sadece kendi bilgilerini güncelleyebilir
CREATE POLICY "Teachers can update own profile"
ON teachers FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- INSERT: Authenticated kullanıcılar öğretmen kaydı oluşturabilir
CREATE POLICY "Authenticated users can create teacher profile"
ON teachers FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- CLASSES TABLOSU (Öğretmenlerin sınıfları)
-- ============================================================================

-- RLS aktif et
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- SELECT: Öğretmen kendi sınıflarını, öğrenciler katıldıkları sınıfları görebilir
CREATE POLICY "Teachers can view own classes"
ON classes FOR SELECT
TO authenticated
USING (
  teacher_id = auth.uid()
  OR
  -- Öğrenciler katıldıkları sınıfları görebilir
  EXISTS (
    SELECT 1 FROM class_students
    WHERE class_students.class_id = classes.id
    AND class_students.student_id = auth.uid()
  )
);

-- INSERT: Sadece öğretmenler sınıf oluşturabilir
CREATE POLICY "Teachers can create classes"
ON classes FOR INSERT
TO authenticated
WITH CHECK (teacher_id = auth.uid());

-- UPDATE: Sadece sınıfın sahibi güncelleyebilir
CREATE POLICY "Teachers can update own classes"
ON classes FOR UPDATE
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- DELETE: Sadece sınıfın sahibi silebilir
CREATE POLICY "Teachers can delete own classes"
ON classes FOR DELETE
TO authenticated
USING (teacher_id = auth.uid());

-- ============================================================================
-- CLASS_STUDENTS TABLOSU (Sınıf-Öğrenci ilişkisi)
-- ============================================================================

-- RLS aktif et
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;

-- SELECT: Öğretmen kendi sınıflarının öğrencilerini, öğrenci kendi kayıtlarını görebilir
CREATE POLICY "View class students"
ON class_students FOR SELECT
TO authenticated
USING (
  -- Öğretmen kendi sınıflarının öğrencilerini görebilir
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_students.class_id
    AND classes.teacher_id = auth.uid()
  )
  OR
  -- Öğrenci kendi kayıtlarını görebilir
  student_id = auth.uid()
);

-- INSERT: Öğretmenler öğrenci ekleyebilir, öğrenciler katılabilir
CREATE POLICY "Add students to class"
ON class_students FOR INSERT
TO authenticated
WITH CHECK (
  -- Öğretmen kendi sınıfına öğrenci ekleyebilir
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_students.class_id
    AND classes.teacher_id = auth.uid()
  )
  OR
  -- Öğrenci davet kodu ile katılabilir (student_id kendi id'si olmalı)
  student_id = auth.uid()
);

-- UPDATE: Öğretmen güncelleyebilir
CREATE POLICY "Update class students"
ON class_students FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_students.class_id
    AND classes.teacher_id = auth.uid()
  )
);

-- DELETE: Öğretmen silebilir, öğrenci kendi kaydını silebilir
CREATE POLICY "Remove class students"
ON class_students FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_students.class_id
    AND classes.teacher_id = auth.uid()
  )
  OR
  student_id = auth.uid()
);

-- ============================================================================
-- CLASS_EXAMS TABLOSU
-- ============================================================================

-- RLS aktif et
ALTER TABLE class_exams ENABLE ROW LEVEL SECURITY;

-- SELECT: Öğretmen kendi sınav bilgilerini, öğrenciler katıldıkları sınavları görebilir
CREATE POLICY "View class exams"
ON class_exams FOR SELECT
TO authenticated
USING (
  -- Öğretmen kendi sınıflarının sınavlarını görebilir
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_exams.class_id
    AND classes.teacher_id = auth.uid()
  )
  OR
  -- Öğrenci sınıfta ise sınavları görebilir
  EXISTS (
    SELECT 1 FROM class_students
    WHERE class_students.class_id = class_exams.class_id
    AND class_students.student_id = auth.uid()
  )
);

-- INSERT, UPDATE, DELETE: Sadece öğretmen
CREATE POLICY "Teachers manage class exams"
ON class_exams FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_exams.class_id
    AND classes.teacher_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_exams.class_id
    AND classes.teacher_id = auth.uid()
  )
);

-- ============================================================================
-- CLASS_EXAM_RESULTS TABLOSU
-- ============================================================================

-- RLS aktif et
ALTER TABLE class_exam_results ENABLE ROW LEVEL SECURITY;

-- SELECT: Öğretmen tüm sonuçları, öğrenci sadece kendi sonuçlarını görebilir
CREATE POLICY "View exam results"
ON class_exam_results FOR SELECT
TO authenticated
USING (
  -- Öğretmen sınıfının tüm sonuçlarını görebilir
  EXISTS (
    SELECT 1 FROM class_exams
    JOIN classes ON classes.id = class_exams.class_id
    WHERE class_exams.id = class_exam_results.exam_id
    AND classes.teacher_id = auth.uid()
  )
  OR
  -- Öğrenci sadece kendi sonuçlarını görebilir
  student_id = auth.uid()
);

-- INSERT, UPDATE: Öğretmen ekleyebilir/güncelleyebilir
CREATE POLICY "Teachers manage exam results"
ON class_exam_results FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM class_exams
    JOIN classes ON classes.id = class_exams.class_id
    WHERE class_exams.id = class_exam_results.exam_id
    AND classes.teacher_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM class_exams
    JOIN classes ON classes.id = class_exams.class_id
    WHERE class_exams.id = class_exam_results.exam_id
    AND classes.teacher_id = auth.uid()
  )
);

-- ============================================================================
-- KONTROL
-- ============================================================================
SELECT
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename IN (
    'teachers',
    'classes',
    'class_students',
    'class_exams',
    'class_exam_results'
  )
ORDER BY tablename;

SELECT 'Teachers ve Classes tabloları güvence altına alındı!' as message;

-- Teachers ve Classes Tablolarına RLS Ekle (DÜZELTİLMİŞ)
-- Önce mevcut hatalı policy'leri temizle

-- ============================================================================
-- HATALI POLICY'LERİ SİL (varsa)
-- ============================================================================
DROP POLICY IF EXISTS "View exam results" ON class_exam_results;
DROP POLICY IF EXISTS "Teachers manage exam results" ON class_exam_results;

-- ============================================================================
-- TEACHERS TABLOSU
-- ============================================================================

-- RLS zaten aktif mi kontrol et, değilse aktif et
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'teachers'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Eski policy'leri sil (varsa)
DROP POLICY IF EXISTS "Teachers can view own profile" ON teachers;
DROP POLICY IF EXISTS "Teachers can update own profile" ON teachers;
DROP POLICY IF EXISTS "Authenticated users can create teacher profile" ON teachers;

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
-- CLASSES TABLOSU
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'classes'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Eski policy'leri sil
DROP POLICY IF EXISTS "Teachers can view own classes" ON classes;
DROP POLICY IF EXISTS "Teachers can create classes" ON classes;
DROP POLICY IF EXISTS "Teachers can update own classes" ON classes;
DROP POLICY IF EXISTS "Teachers can delete own classes" ON classes;

-- SELECT: Öğretmen kendi sınıflarını, öğrenciler katıldıkları sınıfları görebilir
CREATE POLICY "Teachers can view own classes"
ON classes FOR SELECT
TO authenticated
USING (
  teacher_id = auth.uid()
  OR
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
-- CLASS_STUDENTS TABLOSU
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'class_students'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DROP POLICY IF EXISTS "View class students" ON class_students;
DROP POLICY IF EXISTS "Add students to class" ON class_students;
DROP POLICY IF EXISTS "Update class students" ON class_students;
DROP POLICY IF EXISTS "Remove class students" ON class_students;

-- SELECT: Öğretmen kendi sınıflarının öğrencilerini, öğrenci kendi kayıtlarını görebilir
CREATE POLICY "View class students"
ON class_students FOR SELECT
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

-- INSERT: Öğretmenler öğrenci ekleyebilir, öğrenciler katılabilir
CREATE POLICY "Add students to class"
ON class_students FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_students.class_id
    AND classes.teacher_id = auth.uid()
  )
  OR
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'class_exams'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE class_exams ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DROP POLICY IF EXISTS "View class exams" ON class_exams;
DROP POLICY IF EXISTS "Teachers manage class exams" ON class_exams;

-- SELECT: Öğretmen kendi sınavlarını, öğrenciler katıldıkları sınavları görebilir
CREATE POLICY "View class exams"
ON class_exams FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_exams.class_id
    AND classes.teacher_id = auth.uid()
  )
  OR
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
-- CLASS_EXAM_RESULTS TABLOSU (DÜZELTİLMİŞ - class_exam_id kullanıyor)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'class_exam_results'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE class_exam_results ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Tablo yapısını kontrol et ve doğru kolona göre policy oluştur
-- class_exam_id veya exam_id veya farklı bir kolon olabilir

-- SEÇENEK 1: Eğer 'class_exam_id' kolonu varsa
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'class_exam_results'
    AND column_name = 'class_exam_id'
  ) THEN
    -- SELECT: Öğretmen tüm sonuçları, öğrenci sadece kendi sonuçlarını görebilir
    EXECUTE 'CREATE POLICY "View exam results"
    ON class_exam_results FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM class_exams
        JOIN classes ON classes.id = class_exams.class_id
        WHERE class_exams.id = class_exam_results.class_exam_id
        AND classes.teacher_id = auth.uid()
      )
      OR
      student_id = auth.uid()
    )';

    -- INSERT, UPDATE: Öğretmen yönetir
    EXECUTE 'CREATE POLICY "Teachers manage exam results"
    ON class_exam_results FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM class_exams
        JOIN classes ON classes.id = class_exams.class_id
        WHERE class_exams.id = class_exam_results.class_exam_id
        AND classes.teacher_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM class_exams
        JOIN classes ON classes.id = class_exams.class_id
        WHERE class_exams.id = class_exam_results.class_exam_id
        AND classes.teacher_id = auth.uid()
      )
    )';
  END IF;
END $$;

-- SEÇENEK 2: Eğer farklı bir foreign key kolonu varsa
-- Manuel düzeltme gerekebilir - kolon ismini kontrol edin

-- ============================================================================
-- CLASS_ANNOUNCEMENTS TABLOSU
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'class_announcements'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE class_announcements ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DROP POLICY IF EXISTS "View class announcements" ON class_announcements;
DROP POLICY IF EXISTS "Teachers manage announcements" ON class_announcements;

-- SELECT: Sınıfın öğretmeni ve öğrencileri duyuruları görebilir
CREATE POLICY "View class announcements"
ON class_announcements FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_announcements.class_id
    AND (
      classes.teacher_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM class_students
        WHERE class_students.class_id = classes.id
        AND class_students.student_id = auth.uid()
      )
    )
  )
);

-- INSERT, UPDATE, DELETE: Sadece öğretmen
CREATE POLICY "Teachers manage announcements"
ON class_announcements FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_announcements.class_id
    AND classes.teacher_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_announcements.class_id
    AND classes.teacher_id = auth.uid()
  )
);

-- ============================================================================
-- CLASS_ASSIGNMENTS TABLOSU
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'class_assignments'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE class_assignments ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DROP POLICY IF EXISTS "View class assignments" ON class_assignments;
DROP POLICY IF EXISTS "Teachers manage assignments" ON class_assignments;

-- SELECT: Öğretmen ve sınıf öğrencileri görebilir
CREATE POLICY "View class assignments"
ON class_assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_assignments.class_id
    AND (
      classes.teacher_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM class_students
        WHERE class_students.class_id = classes.id
        AND class_students.student_id = auth.uid()
      )
    )
  )
);

-- INSERT, UPDATE, DELETE: Sadece öğretmen
CREATE POLICY "Teachers manage assignments"
ON class_assignments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_assignments.class_id
    AND classes.teacher_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_assignments.class_id
    AND classes.teacher_id = auth.uid()
  )
);

-- ============================================================================
-- KONTROL VE ÖZET
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
    'class_exam_results',
    'class_announcements',
    'class_assignments'
  )
ORDER BY tablename;

-- Başarı mesajı
SELECT '✅ Teachers ve Classes RLS başarıyla aktif edildi!' as message,
       'class_exam_results için doğru kolon ismi kullanıldı' as note;

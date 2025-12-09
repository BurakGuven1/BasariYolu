-- ADIM 3: Ödeme ve finans tablolarına RLS ekle
-- PAYMENT_HISTORY, TEACHER_BILLING, CLASS_PAYMENTS

-- ============================================================================
-- PAYMENT_HISTORY TABLOSU (Çok hassas!)
-- ============================================================================

-- RLS aktif et
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- SELECT: Sadece kendi ödeme geçmişini görebilir
CREATE POLICY "Users can view own payment history"
ON payment_history FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- INSERT: Service role veya backend tarafından eklenebilir
-- Kullanıcılar direkt ödeme kaydı oluşturmamalı
CREATE POLICY "Service can insert payments"
ON payment_history FOR INSERT
TO service_role
WITH CHECK (true);

-- UPDATE/DELETE: Sadece service role (güvenlik için)
CREATE POLICY "Service can manage payments"
ON payment_history FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- TEACHER_BILLING TABLOSU
-- ============================================================================

-- RLS aktif et
ALTER TABLE teacher_billing ENABLE ROW LEVEL SECURITY;

-- SELECT: Öğretmen sadece kendi fatura bilgilerini görebilir
CREATE POLICY "Teachers view own billing"
ON teacher_billing FOR SELECT
TO authenticated
USING (
  teacher_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM teachers
    WHERE teachers.id = teacher_billing.teacher_id
    AND teachers.user_id = auth.uid()
  )
);

-- INSERT, UPDATE: Öğretmen kendi fatura bilgilerini yönetebilir
CREATE POLICY "Teachers manage own billing"
ON teacher_billing FOR ALL
TO authenticated
USING (
  teacher_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM teachers
    WHERE teachers.id = teacher_billing.teacher_id
    AND teachers.user_id = auth.uid()
  )
)
WITH CHECK (
  teacher_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM teachers
    WHERE teachers.id = teacher_billing.teacher_id
    AND teachers.user_id = auth.uid()
  )
);

-- ============================================================================
-- CLASS_PAYMENTS TABLOSU
-- ============================================================================

-- RLS aktif et
ALTER TABLE class_payments ENABLE ROW LEVEL SECURITY;

-- SELECT: Öğretmen kendi sınıfının ödemelerini, öğrenci kendi ödemelerini görebilir
CREATE POLICY "View class payments"
ON class_payments FOR SELECT
TO authenticated
USING (
  -- Öğretmen kendi sınıfının ödemelerini görebilir
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_payments.class_id
    AND classes.teacher_id = auth.uid()
  )
  OR
  -- Öğrenci kendi ödemelerini görebilir
  student_id = auth.uid()
);

-- INSERT: Öğretmen ödeme kaydı oluşturabilir
CREATE POLICY "Teachers create payment records"
ON class_payments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_payments.class_id
    AND classes.teacher_id = auth.uid()
  )
);

-- UPDATE: Öğretmen ödeme durumunu güncelleyebilir
CREATE POLICY "Teachers update payments"
ON class_payments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_payments.class_id
    AND classes.teacher_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_payments.class_id
    AND classes.teacher_id = auth.uid()
  )
);

-- ============================================================================
-- CLASS_ANNOUNCEMENTS TABLOSU
-- ============================================================================

-- RLS aktif et
ALTER TABLE class_announcements ENABLE ROW LEVEL SECURITY;

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

-- RLS aktif et
ALTER TABLE class_assignments ENABLE ROW LEVEL SECURITY;

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
-- KONTROL
-- ============================================================================
SELECT
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename IN (
    'payment_history',
    'teacher_billing',
    'class_payments',
    'class_announcements',
    'class_assignments'
  )
ORDER BY tablename;

SELECT 'Ödeme ve sınıf tabloları güvence altına alındı!' as message;

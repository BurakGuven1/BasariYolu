-- Öğrencilere harici sınav atama sistemi
-- Kurum öğrencilere sınav atar, öğrenci cevaplarını girer

-- 1. Öğrencilere atanan sınavlar
CREATE TABLE IF NOT EXISTS institution_student_exam_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES institution_external_exam_templates(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  deadline DATE, -- Son cevap girme tarihi (opsiyonel)
  status TEXT DEFAULT 'pending', -- pending, completed, expired
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institution_id, template_id, user_id, exam_date) -- Aynı sınav aynı gün tekrar atanamaz
);

-- 2. Sınav sonuçlarına self_submitted flag ekle
ALTER TABLE institution_external_exam_results
ADD COLUMN IF NOT EXISTS self_submitted BOOLEAN DEFAULT false;

-- 3. Sınav sonuçlarına assignment_id ekle (hangi atamaya ait)
ALTER TABLE institution_external_exam_results
ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES institution_student_exam_assignments(id) ON DELETE SET NULL;

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_exam_assignments_institution ON institution_student_exam_assignments(institution_id);
CREATE INDEX IF NOT EXISTS idx_exam_assignments_student ON institution_student_exam_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_assignments_template ON institution_student_exam_assignments(template_id);
CREATE INDEX IF NOT EXISTS idx_exam_assignments_status ON institution_student_exam_assignments(status);
CREATE INDEX IF NOT EXISTS idx_external_exam_results_self_submitted ON institution_external_exam_results(self_submitted);
CREATE INDEX IF NOT EXISTS idx_external_exam_results_assignment ON institution_external_exam_results(assignment_id);

-- RLS Policies
ALTER TABLE institution_student_exam_assignments ENABLE ROW LEVEL SECURITY;

-- Öğrenci kendi atamalarını görebilir
CREATE POLICY "Students can view their assigned exams"
  ON institution_student_exam_assignments FOR SELECT
  USING (user_id = auth.uid());

-- Kurum üyeleri kendi kurumlarının atamalarını görebilir
CREATE POLICY "Institution members can view assignments"
  ON institution_student_exam_assignments FOR SELECT
  USING (
    institution_id IN (
      SELECT institution_id FROM institution_members
      WHERE user_id = auth.uid()
    )
  );

-- Kurum yöneticileri/öğretmenler sınav atayabilir
CREATE POLICY "Institution staff can assign exams"
  ON institution_student_exam_assignments FOR INSERT
  WITH CHECK (
    institution_id IN (
      SELECT institution_id FROM institution_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager', 'teacher')
    )
  );

-- Kurum yöneticileri/öğretmenler atamaları güncelleyebilir
CREATE POLICY "Institution staff can update assignments"
  ON institution_student_exam_assignments FOR UPDATE
  USING (
    institution_id IN (
      SELECT institution_id FROM institution_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager', 'teacher')
    )
  );

-- Kurum yöneticileri atamaları silebilir
CREATE POLICY "Institution managers can delete assignments"
  ON institution_student_exam_assignments FOR DELETE
  USING (
    institution_id IN (
      SELECT institution_id FROM institution_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

-- Öğrenci kendi atamalarına cevap girebilir
CREATE POLICY "Students can submit their own answers"
  ON institution_external_exam_results FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    self_submitted = true AND
    assignment_id IN (
      SELECT id FROM institution_student_exam_assignments
      WHERE user_id = auth.uid() AND status = 'pending'
    )
  );

-- Yorumlar
COMMENT ON TABLE institution_student_exam_assignments IS 'Öğrencilere atanan harici sınavlar - Öğrenci cevaplarını kendisi girer';
COMMENT ON COLUMN institution_external_exam_results.self_submitted IS 'Öğrenci tarafından mı girildi yoksa kurum tarafından mı toplu yüklendi';
COMMENT ON COLUMN institution_external_exam_results.assignment_id IS 'Hangi atamaya ait (öğrenci kendi girdiyse)';

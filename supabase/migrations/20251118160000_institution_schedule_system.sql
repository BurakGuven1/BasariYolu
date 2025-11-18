-- Institution Schedule System - FIXED VERSION
-- Mevcut veritabanı yapısına uygun olarak düzeltildi
-- institution_members tablosu kullanılarak RLS policies düzeltildi

-- ==============================================================
-- INSTITUTION SCHEDULE ENTRIES (Ders Programı Girdileri)
-- ==============================================================

CREATE TABLE IF NOT EXISTS institution_schedule_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,

  -- Esnek sınıf/grup yapısı
  class_name TEXT NOT NULL, -- '12-A', '12-Say-1', 'Mezun', '11-TM-2' vs

  -- Ders bilgileri
  subject TEXT NOT NULL, -- 'Matematik', 'Fizik', 'Türkçe' vs
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Öğretmen (nullable - atanmamış olabilir)

  -- Yer ve zaman
  classroom TEXT, -- 'A-101', 'B-205', 'Lab-1', 'Spor Salonu' vs (nullable)
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Pazartesi, 7=Pazar
  start_time TIME NOT NULL, -- '08:00', '09:00' vs
  end_time TIME NOT NULL, -- '08:40', '09:40' vs

  -- Ek bilgiler
  notes TEXT, -- Özel notlar
  color TEXT DEFAULT '#3B82F6', -- Renk kodu (görsel ayrım için)
  is_active BOOLEAN DEFAULT true, -- Aktif/pasif

  -- Tekrar bilgisi (opsiyonel - gelecekte kullanılabilir)
  recurrence_type TEXT DEFAULT 'weekly' CHECK (recurrence_type IN ('weekly', 'biweekly', 'custom')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Constraints
  CHECK (start_time < end_time)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_schedule_entries_institution
  ON institution_schedule_entries(institution_id);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_teacher
  ON institution_schedule_entries(teacher_id);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_class
  ON institution_schedule_entries(class_name);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_day
  ON institution_schedule_entries(day_of_week);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_active
  ON institution_schedule_entries(is_active) WHERE is_active = true;

-- ==============================================================
-- TEACHER PERSONAL SCHEDULES (Öğretmen Kişisel Programları)
-- ==============================================================

CREATE TABLE IF NOT EXISTS teacher_personal_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,

  -- Etkinlik bilgileri
  title TEXT NOT NULL, -- 'Ders Hazırlığı', 'Toplantı', 'Özel Ders' vs
  description TEXT,

  -- Zaman bilgileri
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Yer bilgisi
  location TEXT, -- 'Öğretmenler Odası', 'Müdür Odası' vs

  -- Kategoriler
  category TEXT DEFAULT 'personal' CHECK (category IN ('personal', 'meeting', 'preparation', 'tutoring', 'other')),
  color TEXT DEFAULT '#10B981',

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CHECK (start_time < end_time)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_teacher_schedules_teacher
  ON teacher_personal_schedules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_schedules_institution
  ON teacher_personal_schedules(institution_id);
CREATE INDEX IF NOT EXISTS idx_teacher_schedules_day
  ON teacher_personal_schedules(day_of_week);

-- ==============================================================
-- INSTITUTION CLASSES (Kurum Sınıfları - Metadata)
-- ==============================================================

CREATE TABLE IF NOT EXISTS institution_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL, -- '12-A', '12-Say-1', 'Mezun' vs
  class_description TEXT, -- 'Sayısal 12. Sınıf', 'TYT Mezun Grubu' vs
  grade_level TEXT, -- '12', '11', 'Mezun' vs
  branch TEXT, -- 'Sayısal', 'Sözel', 'EA', 'TM' vs

  -- Danışman öğretmen
  advisor_teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Öğrenci sayısı (opsiyonel)
  student_count INTEGER DEFAULT 0,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(institution_id, class_name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_institution_classes_institution
  ON institution_classes(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_classes_active
  ON institution_classes(is_active) WHERE is_active = true;

-- ==============================================================
-- RLS POLICIES - FIXED
-- ==============================================================

-- Enable RLS
ALTER TABLE institution_schedule_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_personal_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_classes ENABLE ROW LEVEL SECURITY;

-- institution_schedule_entries policies
DROP POLICY IF EXISTS "Institution admins can manage schedule entries" ON institution_schedule_entries;
DROP POLICY IF EXISTS "Teachers can view their institution schedule" ON institution_schedule_entries;
DROP POLICY IF EXISTS "Students can view their institution schedule" ON institution_schedule_entries;

-- Kurum yöneticileri (owner/manager) tüm işlemleri yapabilir
CREATE POLICY "Institution admins can manage schedule entries"
  ON institution_schedule_entries
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM institution_members
      WHERE institution_members.institution_id = institution_schedule_entries.institution_id
      AND institution_members.user_id = auth.uid()
      AND institution_members.role IN ('owner', 'manager')
      AND institution_members.status = 'active'
    )
  );

-- Öğretmenler (teacher role) görüntüleyebilir
CREATE POLICY "Teachers can view their institution schedule"
  ON institution_schedule_entries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM institution_members
      WHERE institution_members.institution_id = institution_schedule_entries.institution_id
      AND institution_members.user_id = auth.uid()
      AND institution_members.role = 'teacher'
      AND institution_members.status = 'active'
    )
  );

-- Öğrenciler görüntüleyebilir
CREATE POLICY "Students can view their institution schedule"
  ON institution_schedule_entries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM institution_student_requests
      WHERE institution_student_requests.institution_id = institution_schedule_entries.institution_id
      AND institution_student_requests.student_id = auth.uid()
      AND institution_student_requests.status = 'approved'
    )
  );

-- teacher_personal_schedules policies
DROP POLICY IF EXISTS "Teachers can manage their own schedules" ON teacher_personal_schedules;
DROP POLICY IF EXISTS "Institution admins can view teacher schedules" ON teacher_personal_schedules;

-- Öğretmenler kendi kişisel programlarını yönetebilir
CREATE POLICY "Teachers can manage their own schedules"
  ON teacher_personal_schedules
  FOR ALL
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Kurum yöneticileri öğretmen programlarını görüntüleyebilir
CREATE POLICY "Institution admins can view teacher schedules"
  ON teacher_personal_schedules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM institution_members
      WHERE institution_members.institution_id = teacher_personal_schedules.institution_id
      AND institution_members.user_id = auth.uid()
      AND institution_members.role IN ('owner', 'manager')
      AND institution_members.status = 'active'
    )
  );

-- institution_classes policies
DROP POLICY IF EXISTS "Institution admins can manage classes" ON institution_classes;
DROP POLICY IF EXISTS "Teachers can view institution classes" ON institution_classes;
DROP POLICY IF EXISTS "Students can view institution classes" ON institution_classes;

-- Kurum yöneticileri sınıf yönetimi yapabilir
CREATE POLICY "Institution admins can manage classes"
  ON institution_classes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM institution_members
      WHERE institution_members.institution_id = institution_classes.institution_id
      AND institution_members.user_id = auth.uid()
      AND institution_members.role IN ('owner', 'manager')
      AND institution_members.status = 'active'
    )
  );

-- Öğretmenler sınıfları görüntüleyebilir
CREATE POLICY "Teachers can view institution classes"
  ON institution_classes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM institution_members
      WHERE institution_members.institution_id = institution_classes.institution_id
      AND institution_members.user_id = auth.uid()
      AND institution_members.role = 'teacher'
      AND institution_members.status = 'active'
    )
  );

-- Öğrenciler sınıfları görüntüleyebilir
CREATE POLICY "Students can view institution classes"
  ON institution_classes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM institution_student_requests
      WHERE institution_student_requests.institution_id = institution_classes.institution_id
      AND institution_student_requests.student_id = auth.uid()
      AND institution_student_requests.status = 'approved'
    )
  );

-- ==============================================================
-- TRIGGERS
-- ==============================================================

-- Updated at trigger for schedule entries
DROP TRIGGER IF EXISTS update_schedule_entries_updated_at ON institution_schedule_entries;
CREATE TRIGGER update_schedule_entries_updated_at
  BEFORE UPDATE ON institution_schedule_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated at trigger for teacher schedules
DROP TRIGGER IF EXISTS update_teacher_schedules_updated_at ON teacher_personal_schedules;
CREATE TRIGGER update_teacher_schedules_updated_at
  BEFORE UPDATE ON teacher_personal_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated at trigger for institution classes
DROP TRIGGER IF EXISTS update_institution_classes_updated_at ON institution_classes;
CREATE TRIGGER update_institution_classes_updated_at
  BEFORE UPDATE ON institution_classes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================
-- HELPER FUNCTIONS
-- ==============================================================

-- Get full schedule for institution (combines schedule entries and teacher personal schedules)
CREATE OR REPLACE FUNCTION get_institution_full_schedule(institution_uuid UUID)
RETURNS TABLE (
  id UUID,
  type TEXT,
  title TEXT,
  class_name TEXT,
  subject TEXT,
  teacher_name TEXT,
  teacher_id UUID,
  classroom TEXT,
  day_of_week INTEGER,
  start_time TIME,
  end_time TIME,
  color TEXT,
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ise.id,
    'class_schedule'::TEXT as type,
    ise.subject as title,
    ise.class_name,
    ise.subject,
    p.full_name as teacher_name,
    ise.teacher_id,
    ise.classroom,
    ise.day_of_week,
    ise.start_time,
    ise.end_time,
    ise.color,
    ise.notes
  FROM institution_schedule_entries ise
  LEFT JOIN profiles p ON p.id = ise.teacher_id
  WHERE ise.institution_id = institution_uuid
    AND ise.is_active = true

  UNION ALL

  SELECT
    tps.id,
    'teacher_personal'::TEXT as type,
    tps.title,
    NULL::TEXT as class_name,
    tps.category as subject,
    p.full_name as teacher_name,
    tps.teacher_id,
    tps.location as classroom,
    tps.day_of_week,
    tps.start_time,
    tps.end_time,
    tps.color,
    tps.description as notes
  FROM teacher_personal_schedules tps
  LEFT JOIN profiles p ON p.id = tps.teacher_id
  WHERE tps.institution_id = institution_uuid
    AND tps.is_active = true

  ORDER BY day_of_week, start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get teacher's weekly schedule
CREATE OR REPLACE FUNCTION get_teacher_weekly_schedule(teacher_uuid UUID, institution_uuid UUID)
RETURNS TABLE (
  id UUID,
  type TEXT,
  title TEXT,
  class_name TEXT,
  subject TEXT,
  classroom TEXT,
  day_of_week INTEGER,
  start_time TIME,
  end_time TIME,
  color TEXT,
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ise.id,
    'class_schedule'::TEXT as type,
    ise.subject as title,
    ise.class_name,
    ise.subject,
    ise.classroom,
    ise.day_of_week,
    ise.start_time,
    ise.end_time,
    ise.color,
    ise.notes
  FROM institution_schedule_entries ise
  WHERE ise.teacher_id = teacher_uuid
    AND ise.institution_id = institution_uuid
    AND ise.is_active = true

  UNION ALL

  SELECT
    tps.id,
    'personal'::TEXT as type,
    tps.title,
    NULL::TEXT as class_name,
    tps.category as subject,
    tps.location as classroom,
    tps.day_of_week,
    tps.start_time,
    tps.end_time,
    tps.color,
    tps.description as notes
  FROM teacher_personal_schedules tps
  WHERE tps.teacher_id = teacher_uuid
    AND tps.institution_id = institution_uuid
    AND tps.is_active = true

  ORDER BY day_of_week, start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================
-- GRANTS
-- ==============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON institution_schedule_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON teacher_personal_schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON institution_classes TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

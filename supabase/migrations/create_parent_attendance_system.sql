-- ============================================
-- VELİ VE DEVAMSIZLIK SİSTEMİ
-- ============================================

-- 1. VELİ İLETİŞİM BİLGİLERİ TABLOSU
CREATE TABLE IF NOT EXISTS parent_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  preferred_contact_method VARCHAR(20) DEFAULT 'whatsapp' CHECK (preferred_contact_method IN ('whatsapp', 'email', 'both')),
  relation VARCHAR(50), -- 'anne', 'baba', 'vasi', vb.
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique: Bir kurumda aynı öğrenci için aynı veli tekrar eklenmesin
  UNIQUE(institution_id, student_id, phone)
);

-- Index'ler
CREATE INDEX idx_parent_contacts_institution ON parent_contacts(institution_id);
CREATE INDEX idx_parent_contacts_student ON parent_contacts(student_id);
CREATE INDEX idx_parent_contacts_active ON parent_contacts(is_active);

-- 2. YOKLAMA/DEVAMSIZLIK TABLOSU
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  attendance_date DATE NOT NULL,
  lesson_time VARCHAR(20), -- 'Sabah', '1. Ders', '2. Ders', vb.
  subject VARCHAR(100), -- 'Matematik', 'Fizik', vb.
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  -- present: geldi, absent: gelmedi, late: geç geldi, excused: mazeret
  excuse_reason TEXT,
  notes TEXT,
  notified_parent BOOLEAN DEFAULT false, -- Veliye bildirim gitti mi?
  notified_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique: Aynı öğrenci aynı gün aynı derste birden fazla yoklama olmasın
  UNIQUE(student_id, attendance_date, lesson_time, subject)
);

-- Index'ler
CREATE INDEX idx_attendance_institution ON attendance(institution_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_class ON attendance(class_id);
CREATE INDEX idx_attendance_teacher ON attendance(teacher_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_attendance_notified ON attendance(notified_parent);

-- 3. BİLDİRİM GEÇMİŞİ TABLOSU
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  parent_contact_id UUID REFERENCES parent_contacts(id) ON DELETE SET NULL,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  notification_type VARCHAR(50) NOT NULL, -- 'attendance', 'exam_result', 'announcement', vb.
  method VARCHAR(20) NOT NULL CHECK (method IN ('whatsapp', 'email', 'sms')),
  recipient VARCHAR(255) NOT NULL, -- Telefon numarası veya email
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  metadata JSONB, -- Ekstra bilgiler (exam_id, attendance_id, vb.)
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index'ler
CREATE INDEX idx_notification_logs_institution ON notification_logs(institution_id);
CREATE INDEX idx_notification_logs_parent ON notification_logs(parent_contact_id);
CREATE INDEX idx_notification_logs_student ON notification_logs(student_id);
CREATE INDEX idx_notification_logs_type ON notification_logs(notification_type);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_created ON notification_logs(created_at);

-- 4. DEVAMSIZLIK İSTATİSTİKLERİ VİEW
CREATE OR REPLACE VIEW student_attendance_stats AS
SELECT
  a.student_id,
  a.institution_id,
  COUNT(*) FILTER (WHERE a.status = 'present') as total_present,
  COUNT(*) FILTER (WHERE a.status = 'absent') as total_absent,
  COUNT(*) FILTER (WHERE a.status = 'late') as total_late,
  COUNT(*) FILTER (WHERE a.status = 'excused') as total_excused,
  COUNT(*) as total_records,
  ROUND(
    (COUNT(*) FILTER (WHERE a.status = 'present')::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
    2
  ) as attendance_percentage,
  MAX(a.attendance_date) as last_attendance_date,
  COUNT(*) FILTER (
    WHERE a.status = 'absent'
    AND a.attendance_date >= CURRENT_DATE - INTERVAL '7 days'
  ) as absent_last_7_days,
  COUNT(*) FILTER (
    WHERE a.status = 'absent'
    AND a.attendance_date >= CURRENT_DATE - INTERVAL '30 days'
  ) as absent_last_30_days
FROM attendance a
GROUP BY a.student_id, a.institution_id;

-- 5. UPDATED_AT TRİGGER FONKSİYONU (eğer yoksa)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ları ekle
CREATE TRIGGER update_parent_contacts_updated_at
  BEFORE UPDATE ON parent_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLİCY'LERİ - GÜVENLİK
-- ============================================

-- Parent Contacts RLS
ALTER TABLE parent_contacts ENABLE ROW LEVEL SECURITY;

-- Kurum kendi velilerini görebilir/yönetebilir
CREATE POLICY "institution_manage_parents" ON parent_contacts
  FOR ALL
  TO authenticated
  USING (
    institution_id IN (
      SELECT id FROM institutions WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    institution_id IN (
      SELECT id FROM institutions WHERE user_id = auth.uid()
    )
  );

-- Öğretmen kendi sınıfındaki öğrencilerin velilerini görebilir
CREATE POLICY "teacher_view_class_parents" ON parent_contacts
  FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT cs.student_id
      FROM class_students cs
      INNER JOIN classes c ON c.id = cs.class_id
      WHERE c.teacher_id IN (
        SELECT id FROM teachers WHERE user_id = auth.uid()
      )
    )
  );

-- Attendance RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Kurum tüm devamsızlıkları görebilir/yönetebilir
CREATE POLICY "institution_manage_attendance" ON attendance
  FOR ALL
  TO authenticated
  USING (
    institution_id IN (
      SELECT id FROM institutions WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    institution_id IN (
      SELECT id FROM institutions WHERE user_id = auth.uid()
    )
  );

-- Öğretmen kendi yoklamalarını alabilir ve görebilir
CREATE POLICY "teacher_manage_attendance" ON attendance
  FOR ALL
  TO authenticated
  USING (
    teacher_id IN (
      SELECT id FROM teachers WHERE user_id = auth.uid()
    )
    OR class_id IN (
      SELECT id FROM classes WHERE teacher_id IN (
        SELECT id FROM teachers WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    teacher_id IN (
      SELECT id FROM teachers WHERE user_id = auth.uid()
    )
    OR class_id IN (
      SELECT id FROM classes WHERE teacher_id IN (
        SELECT id FROM teachers WHERE user_id = auth.uid()
      )
    )
  );

-- Öğrenci kendi devamsızlığını görebilir
CREATE POLICY "student_view_own_attendance" ON attendance
  FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Notification Logs RLS
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Kurum kendi bildirimlerini görebilir
CREATE POLICY "institution_view_notifications" ON notification_logs
  FOR SELECT
  TO authenticated
  USING (
    institution_id IN (
      SELECT id FROM institutions WHERE user_id = auth.uid()
    )
  );

-- Kurum bildirim oluşturabilir
CREATE POLICY "institution_create_notifications" ON notification_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    institution_id IN (
      SELECT id FROM institutions WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- YARDIMCI FONKSİYONLAR
-- ============================================

-- Son 30 gün devamsızlık özeti
CREATE OR REPLACE FUNCTION get_student_recent_absences(p_student_id UUID)
RETURNS TABLE (
  date DATE,
  lesson_time VARCHAR,
  subject VARCHAR,
  excuse_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.attendance_date,
    a.lesson_time,
    a.subject,
    a.excuse_reason
  FROM attendance a
  WHERE a.student_id = p_student_id
    AND a.status IN ('absent', 'late')
    AND a.attendance_date >= CURRENT_DATE - INTERVAL '30 days'
  ORDER BY a.attendance_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Veli bildirim gönderme durumu güncelleme
CREATE OR REPLACE FUNCTION mark_attendance_notified(p_attendance_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE attendance
  SET notified_parent = true,
      notified_at = NOW()
  WHERE id = p_attendance_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE parent_contacts IS 'Veli iletişim bilgileri - Kurum tarafından yönetilir';
COMMENT ON TABLE attendance IS 'Öğrenci yoklama/devamsızlık kayıtları';
COMMENT ON TABLE notification_logs IS 'Veliye gönderilen bildirimler log';
COMMENT ON VIEW student_attendance_stats IS 'Öğrenci devamsızlık istatistikleri özeti';

-- ============================================
-- VELİ VE DEVAMSIZLIK SİSTEMİ (DÜZELTİLMİŞ)
-- ============================================

-- 1. VELİ İLETİŞİM BİLGİLERİ TABLOSU
CREATE TABLE IF NOT EXISTS parent_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL,
  student_id UUID NOT NULL,
  parent_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  preferred_contact_method VARCHAR(20) DEFAULT 'whatsapp' CHECK (preferred_contact_method IN ('whatsapp', 'email', 'both')),
  relation VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_parent_contacts_institution ON parent_contacts(institution_id);
CREATE INDEX IF NOT EXISTS idx_parent_contacts_student ON parent_contacts(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_contacts_active ON parent_contacts(is_active);

-- 2. YOKLAMA/DEVAMSIZLIK TABLOSU
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL,
  class_id UUID,
  student_id UUID NOT NULL,
  teacher_id UUID,
  attendance_date DATE NOT NULL,
  lesson_time VARCHAR(20),
  subject VARCHAR(100),
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  excuse_reason TEXT,
  notes TEXT,
  notified_parent BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_attendance_institution ON attendance(institution_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_teacher ON attendance(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- 3. BİLDİRİM GEÇMİŞİ TABLOSU
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL,
  parent_contact_id UUID,
  student_id UUID,
  notification_type VARCHAR(50) NOT NULL,
  method VARCHAR(20) NOT NULL CHECK (method IN ('whatsapp', 'email', 'sms')),
  recipient VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  metadata JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_notification_logs_institution ON notification_logs(institution_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_student ON notification_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created ON notification_logs(created_at);

-- 4. RLS POLİCY'LERİ - GÜVENLİK
ALTER TABLE parent_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Parent Contacts Policies
DROP POLICY IF EXISTS "institution_manage_parents" ON parent_contacts;
CREATE POLICY "institution_manage_parents" ON parent_contacts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Attendance Policies
DROP POLICY IF EXISTS "institution_manage_attendance" ON attendance;
CREATE POLICY "institution_manage_attendance" ON attendance
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Notification Logs Policies
DROP POLICY IF EXISTS "institution_view_notifications" ON notification_logs;
CREATE POLICY "institution_view_notifications" ON notification_logs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE parent_contacts IS 'Veli iletişim bilgileri - Kurum tarafından yönetilir';
COMMENT ON TABLE attendance IS 'Öğrenci yoklama/devamsızlık kayıtları';
COMMENT ON TABLE notification_logs IS 'Veliye gönderilen bildirimler log';

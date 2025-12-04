-- ============================================
-- VELİ VE DEVAMSIZLIK SİSTEMİ - HATASIZ VERSİYON
-- ============================================

-- Eski tabloları temizle
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS parent_contacts CASCADE;

-- 1. VELİ İLETİŞİM BİLGİLERİ
CREATE TABLE parent_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL,
  student_id UUID NOT NULL,
  parent_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  preferred_contact_method VARCHAR(20) DEFAULT 'whatsapp',
  relation VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parent_contacts_institution ON parent_contacts(institution_id);
CREATE INDEX idx_parent_contacts_student ON parent_contacts(student_id);
CREATE INDEX idx_parent_contacts_active ON parent_contacts(is_active);

-- 2. YOKLAMA/DEVAMSIZLIK
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL,
  class_id UUID,
  student_id UUID NOT NULL,
  teacher_id UUID,
  attendance_date DATE NOT NULL,
  lesson_time VARCHAR(20),
  subject VARCHAR(100),
  status VARCHAR(20) NOT NULL,
  excuse_reason TEXT,
  notes TEXT,
  notified_parent BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attendance_institution ON attendance(institution_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_class ON attendance(class_id);
CREATE INDEX idx_attendance_teacher ON attendance(teacher_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_attendance_status ON attendance(status);

-- 3. BİLDİRİM GEÇMİŞİ
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL,
  parent_contact_id UUID,
  student_id UUID,
  notification_type VARCHAR(50) NOT NULL,
  method VARCHAR(20) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  metadata JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_logs_institution ON notification_logs(institution_id);
CREATE INDEX idx_notification_logs_student ON notification_logs(student_id);
CREATE INDEX idx_notification_logs_created ON notification_logs(created_at);

-- 4. RLS AKTIF ET
ALTER TABLE parent_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 5. BASIT POLICY'LER (HERKESE AÇIK - PRODUCTION'DA DÜZENLENEBİLİR)
DROP POLICY IF EXISTS "public_access_parent_contacts" ON parent_contacts;
CREATE POLICY "public_access_parent_contacts" ON parent_contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_access_attendance" ON attendance;
CREATE POLICY "public_access_attendance" ON attendance FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_access_notification_logs" ON notification_logs;
CREATE POLICY "public_access_notification_logs" ON notification_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Başarı mesajı
DO $$
BEGIN
  RAISE NOTICE 'Veli ve devamsızlık sistemi başarıyla kuruldu!';
END $$;

-- Parent Contacts and Attendance System
-- Fixed version without complex foreign keys

-- Clean up existing tables
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS parent_contacts CASCADE;

-- Create parent_contacts table
-- student_id references auth.users (the student's user ID)
CREATE TABLE parent_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Create attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL,
  class_id UUID,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  attendance_date DATE NOT NULL,
  lesson_time VARCHAR(20),
  subject VARCHAR(100),
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  excuse_reason TEXT,
  notes TEXT,
  notified_parent BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notification_logs table
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL,
  parent_contact_id UUID REFERENCES parent_contacts(id) ON DELETE SET NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  method VARCHAR(20) NOT NULL CHECK (method IN ('whatsapp', 'email', 'sms')),
  recipient VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  metadata JSONB,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_parent_contacts_institution ON parent_contacts(institution_id);
CREATE INDEX idx_parent_contacts_student ON parent_contacts(student_id);
CREATE INDEX idx_parent_contacts_active ON parent_contacts(institution_id, is_active);

CREATE INDEX idx_attendance_institution ON attendance(institution_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_attendance_class ON attendance(class_id, attendance_date);

CREATE INDEX idx_notification_logs_institution ON notification_logs(institution_id);
CREATE INDEX idx_notification_logs_student ON notification_logs(student_id);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);

-- Enable Row Level Security
ALTER TABLE parent_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for parent_contacts
CREATE POLICY "Authenticated users can view parent contacts"
  ON parent_contacts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert parent contacts"
  ON parent_contacts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update parent contacts"
  ON parent_contacts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete parent contacts"
  ON parent_contacts FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for attendance
CREATE POLICY "Authenticated users can view attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert attendance"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update attendance"
  ON attendance FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete attendance"
  ON attendance FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for notification_logs
CREATE POLICY "Authenticated users can view notification logs"
  ON notification_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert notification logs"
  ON notification_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_parent_contacts_updated_at
  BEFORE UPDATE ON parent_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE parent_contacts IS 'Parent/guardian contact information for students';
COMMENT ON TABLE attendance IS 'Student attendance records for classes';
COMMENT ON TABLE notification_logs IS 'Log of all notifications sent to parents';

COMMENT ON COLUMN parent_contacts.student_id IS 'References auth.users.id (student user ID)';
COMMENT ON COLUMN attendance.student_id IS 'References auth.users.id (student user ID)';
COMMENT ON COLUMN attendance.teacher_id IS 'References auth.users.id (teacher user ID)';

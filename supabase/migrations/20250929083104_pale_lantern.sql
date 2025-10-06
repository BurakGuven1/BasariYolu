/*
  # Teacher/Class System Implementation

  1. New Tables
    - `teachers` - Teacher profiles and authentication
    - `classes` - Class management with capacity limits
    - `class_students` - Student-class relationships
    - `class_payments` - Payment tracking for classes

  2. Security
    - Enable RLS on all new tables
    - Add appropriate policies for teachers and students
    - Implement capacity and validation constraints

  3. Features
    - 40 student hard limit per class
    - Tiered pricing (monthly, 3-month, 9-month)
    - Invite code system for class joining
    - Payment status tracking
*/

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  phone text UNIQUE NOT NULL,
  school_name text,
  email_confirmed boolean DEFAULT false,
  email_confirmation_token text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_name text NOT NULL,
  description text,
  student_capacity integer NOT NULL DEFAULT 40 CHECK (student_capacity <= 40 AND student_capacity >= 5),
  current_students integer DEFAULT 0 CHECK (current_students <= student_capacity),
  package_type text NOT NULL CHECK (package_type IN ('monthly', '3_months', '9_months')),
  price_per_student numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  invite_code text UNIQUE NOT NULL,
  invite_code_updated_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'active', 'payment_failed', 'suspended', 'completed')),
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id, class_name)
);

-- Class students relationship
CREATE TABLE IF NOT EXISTS class_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'left', 'removed')),
  UNIQUE(class_id, student_id)
);

-- Class payments tracking
CREATE TABLE IF NOT EXISTS class_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  payment_method text,
  transaction_id text UNIQUE,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_date timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Function to generate class invite codes
CREATE OR REPLACE FUNCTION generate_class_invite_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    -- Generate 12 character code in format XXXX-XXXX-XXXX
    code := UPPER(
      SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4) || '-' ||
      SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4) || '-' ||
      SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4)
    );
    
    -- Check if code already exists
    SELECT COUNT(*) INTO exists_check FROM classes WHERE invite_code = code;
    
    -- If unique, return the code
    IF exists_check = 0 THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Set default invite codes for classes
ALTER TABLE classes ALTER COLUMN invite_code SET DEFAULT generate_class_invite_code();

-- Function to update current_students count
CREATE OR REPLACE FUNCTION update_class_student_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Student joined
    UPDATE classes 
    SET current_students = current_students + 1,
        updated_at = now()
    WHERE id = NEW.class_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Status changed
    IF OLD.status = 'active' AND NEW.status != 'active' THEN
      -- Student left or removed
      UPDATE classes 
      SET current_students = current_students - 1,
          updated_at = now()
      WHERE id = NEW.class_id;
    ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
      -- Student rejoined
      UPDATE classes 
      SET current_students = current_students + 1,
          updated_at = now()
      WHERE id = NEW.class_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Student removed completely
    IF OLD.status = 'active' THEN
      UPDATE classes 
      SET current_students = current_students - 1,
          updated_at = now()
      WHERE id = OLD.class_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for student count updates
CREATE TRIGGER update_class_student_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON class_students
  FOR EACH ROW EXECUTE FUNCTION update_class_student_count();

-- Function to validate class capacity
CREATE OR REPLACE FUNCTION check_class_capacity()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if class has capacity
  IF (SELECT current_students FROM classes WHERE id = NEW.class_id) >= 
     (SELECT student_capacity FROM classes WHERE id = NEW.class_id) THEN
    RAISE EXCEPTION 'Sınıf kapasitesi dolu. Maksimum 40 öğrenci alınabilir.';
  END IF;
  
  -- Check if class is active
  IF (SELECT status FROM classes WHERE id = NEW.class_id) != 'active' THEN
    RAISE EXCEPTION 'Sınıf aktif değil. Ödeme tamamlanmamış olabilir.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for capacity validation
CREATE TRIGGER check_class_capacity_trigger
  BEFORE INSERT ON class_students
  FOR EACH ROW EXECUTE FUNCTION check_class_capacity();

-- Enable RLS
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teachers
CREATE POLICY "Teachers can view own profile" ON teachers
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Teachers can update own profile" ON teachers
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Allow teacher registration" ON teachers
  FOR INSERT WITH CHECK (true);

-- RLS Policies for classes
CREATE POLICY "Teachers can manage own classes" ON classes
  FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Students can view classes they joined" ON classes
  FOR SELECT USING (
    id IN (
      SELECT class_id FROM class_students 
      WHERE student_id IN (
        SELECT id FROM students WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for class_students
CREATE POLICY "Teachers can manage class students" ON class_students
  FOR ALL USING (
    class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  );

CREATE POLICY "Students can view own class memberships" ON class_students
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

-- RLS Policies for class_payments
CREATE POLICY "Teachers can view own payments" ON class_payments
  FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can insert own payments" ON class_payments
  FOR INSERT WITH CHECK (teacher_id = auth.uid());

-- Public access policies for parent login
CREATE POLICY "Public read access to classes" ON classes
  FOR SELECT TO public USING (true);

CREATE POLICY "Public read access to class_students" ON class_students
  FOR SELECT TO public USING (true);

CREATE POLICY "Public read access to teachers" ON teachers
  FOR SELECT TO public USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_invite_code ON classes(invite_code);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
CREATE INDEX IF NOT EXISTS idx_class_students_class_id ON class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_student_id ON class_students(student_id);
CREATE INDEX IF NOT EXISTS idx_class_payments_class_id ON class_payments(class_id);
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);
CREATE INDEX IF NOT EXISTS idx_teachers_phone ON teachers(phone);
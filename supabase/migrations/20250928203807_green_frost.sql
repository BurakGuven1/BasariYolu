/*
  # Weekly Study Goals and Enhanced Subscriptions

  1. New Tables
    - `weekly_study_goals`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `weekly_hours_target` (integer)
      - `start_date` (date)
      - `end_date` (date)
      - `is_active` (boolean)
      - `created_at` (timestamp)

  2. Enhanced Tables
    - `subscriptions` - Add billing_cycle column
    - Update pricing structure

  3. Security
    - Enable RLS on new tables
    - Add appropriate policies
*/

-- Create weekly study goals table
CREATE TABLE IF NOT EXISTS weekly_study_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  weekly_hours_target integer NOT NULL DEFAULT 25,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Add billing cycle to subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'billing_cycle'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly'));
  END IF;
END $$;

-- Update subscription prices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'original_price'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN original_price numeric(10,2);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE weekly_study_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weekly_study_goals
CREATE POLICY "Students can manage own study goals"
  ON weekly_study_goals
  FOR ALL
  TO authenticated
  USING (student_id IN (
    SELECT students.id FROM students WHERE students.user_id = auth.uid()
  ));

CREATE POLICY "Parents can view study goals"
  ON weekly_study_goals
  FOR SELECT
  TO authenticated
  USING (student_id IN (
    SELECT psc.student_id 
    FROM parent_student_connections psc
    JOIN parents p ON p.id = psc.parent_id
    WHERE p.user_id = auth.uid()
  ));

-- Public read access for parent login
CREATE POLICY "Public read access to study goals"
  ON weekly_study_goals
  FOR SELECT
  TO public
  USING (true);

-- Function to auto-create new weekly goals
CREATE OR REPLACE FUNCTION create_new_weekly_goal()
RETURNS TRIGGER AS $$
BEGIN
  -- When a study goal expires, create a new one
  IF NEW.end_date <= CURRENT_DATE AND OLD.is_active = true THEN
    INSERT INTO weekly_study_goals (student_id, weekly_hours_target, start_date, end_date, is_active)
    VALUES (NEW.student_id, NEW.weekly_hours_target, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', true);
    
    -- Deactivate the old goal
    NEW.is_active = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-creating weekly goals
DROP TRIGGER IF EXISTS auto_create_weekly_goal ON weekly_study_goals;
CREATE TRIGGER auto_create_weekly_goal
  BEFORE UPDATE ON weekly_study_goals
  FOR EACH ROW
  EXECUTE FUNCTION create_new_weekly_goal();
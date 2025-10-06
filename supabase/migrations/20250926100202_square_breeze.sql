-- First, drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all inserts" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow all inserts" ON students;
DROP POLICY IF EXISTS "Students can view own data" ON students;
DROP POLICY IF EXISTS "Students can update own data" ON students;
DROP POLICY IF EXISTS "Allow all inserts" ON parents;
DROP POLICY IF EXISTS "Parents can view own data" ON parents;
DROP POLICY IF EXISTS "Parents can update own data" ON parents;

-- Create simple policies for profiles
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create simple policies for students
CREATE POLICY "students_insert_policy" ON students
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "students_select_policy" ON students
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "students_update_policy" ON students
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create simple policies for parents
CREATE POLICY "parents_insert_policy" ON parents
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "parents_select_policy" ON parents
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "parents_update_policy" ON parents
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
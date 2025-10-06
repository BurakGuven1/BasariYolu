-- Completely reset RLS policies for all tables

-- 1. PROFILES table - completely reset
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile after signup" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;

-- Enable RLS and create simple policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert profiles (needed for registration)
CREATE POLICY "Allow all inserts" ON profiles
  FOR INSERT 
  WITH CHECK (true);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. STUDENTS table - reset
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can insert own data" ON students;
DROP POLICY IF EXISTS "Students can update own data" ON students;
DROP POLICY IF EXISTS "Students can view own data" ON students;

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert student records (needed for registration)
CREATE POLICY "Allow all student inserts" ON students
  FOR INSERT 
  WITH CHECK (true);

-- Allow students to view their own data
CREATE POLICY "Students can view own data" ON students
  FOR SELECT 
  USING (user_id = auth.uid());

-- Allow students to update their own data
CREATE POLICY "Students can update own data" ON students
  FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. PARENTS table - reset
ALTER TABLE parents DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Parents can insert own data" ON parents;
DROP POLICY IF EXISTS "Parents can update own data" ON parents;
DROP POLICY IF EXISTS "Parents can view own data" ON parents;

ALTER TABLE parents ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert parent records (needed for registration)
CREATE POLICY "Allow all parent inserts" ON parents
  FOR INSERT 
  WITH CHECK (true);

-- Allow parents to view their own data
CREATE POLICY "Parents can view own data" ON parents
  FOR SELECT 
  USING (user_id = auth.uid());

-- Allow parents to update their own data
CREATE POLICY "Parents can update own data" ON parents
  FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Make sure auth.users() function works properly
-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
GRANT SELECT ON auth.users TO anon, authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
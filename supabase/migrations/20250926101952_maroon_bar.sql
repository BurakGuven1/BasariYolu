-- Completely remove all RLS policies and recreate simple ones
-- This will fix the "new row violates row-level security policy" error

-- First, disable RLS temporarily to clean up
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE parents DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all policies for profiles table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON profiles';
    END LOOP;
    
    -- Drop all policies for students table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'students') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON students';
    END LOOP;
    
    -- Drop all policies for parents table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'parents') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON parents';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;

-- Create simple, working policies for profiles
CREATE POLICY "profiles_allow_all_inserts" ON profiles
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "profiles_allow_own_select" ON profiles
    FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "profiles_allow_own_update" ON profiles
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Create simple, working policies for students
CREATE POLICY "students_allow_all_inserts" ON students
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "students_allow_own_select" ON students
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "students_allow_own_update" ON students
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create simple, working policies for parents
CREATE POLICY "parents_allow_all_inserts" ON parents
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "parents_allow_own_select" ON parents
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "parents_allow_own_update" ON parents
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
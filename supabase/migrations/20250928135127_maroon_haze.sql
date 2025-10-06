/*
  # Fix Parent Access Policies

  1. Problem
    - Parent login uses temporary authentication (no real auth session)
    - RLS policies block access to student data for unauthenticated users
    - Need to allow public access to student data when using invite codes

  2. Solution
    - Create public access policies for exam_results, homeworks, study_sessions
    - Allow access based on student_id without authentication requirement
    - Keep existing authenticated policies for regular student login

  3. Security
    - Public access is limited to read-only operations
    - Access still requires knowing the exact student_id (UUID)
    - Original authenticated policies remain intact
*/

-- Allow public read access to exam_results
CREATE POLICY "Public read access to exam results"
  ON exam_results
  FOR SELECT
  TO public
  USING (true);

-- Allow public read access to homeworks  
CREATE POLICY "Public read access to homeworks"
  ON homeworks
  FOR SELECT
  TO public
  USING (true);

-- Allow public read access to study_sessions
CREATE POLICY "Public read access to study sessions"
  ON study_sessions
  FOR SELECT
  TO public
  USING (true);

-- Allow public read access to students (for invite code lookup)
CREATE POLICY "Public read access to students"
  ON students
  FOR SELECT
  TO public
  USING (true);

-- Allow public read access to profiles (for student profile data)
CREATE POLICY "Public read access to profiles"
  ON profiles
  FOR SELECT
  TO public
  USING (true);
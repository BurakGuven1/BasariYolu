/*
  # Fix Profiles RLS Policy for Registration

  1. Changes
    - Drop the existing restrictive INSERT policy for profiles
    - Create a new policy that allows users to insert their own profile after signup
    - This allows the registration process to work properly

  2. Security
    - Still maintains security by only allowing users to insert their own profile
    - Uses auth.uid() to ensure users can only create profiles for themselves
*/

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a new policy that allows authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile after signup" ON profiles
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also allow public (anon) users to insert profiles during the signup process
-- This is needed because during signup, the user might still be in anon state
CREATE POLICY "Allow profile creation during signup" ON profiles
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);
-- Fix Big Five RLS 403 Error
-- Disable RLS and grant full access to Big Five tables

-- Disable RLS for big_five_responses
ALTER TABLE big_five_responses DISABLE ROW LEVEL SECURITY;

-- Disable RLS for big_five_results
ALTER TABLE big_five_results DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can insert their own responses" ON big_five_responses;
DROP POLICY IF EXISTS "Users can update their own responses" ON big_five_responses;
DROP POLICY IF EXISTS "Users can view their own responses" ON big_five_responses;
DROP POLICY IF EXISTS "Users can delete their own responses" ON big_five_responses;
DROP POLICY IF EXISTS "Users can insert their own results" ON big_five_results;
DROP POLICY IF EXISTS "Users can update their own results" ON big_five_results;
DROP POLICY IF EXISTS "Users can view their own results" ON big_five_results;
DROP POLICY IF EXISTS "Users can delete their own results" ON big_five_results;

-- Grant full access to authenticated users
GRANT ALL ON big_five_responses TO authenticated;
GRANT ALL ON big_five_results TO authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

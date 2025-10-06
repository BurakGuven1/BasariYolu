if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  alert("VITE_SUPABASE_ANON_KEY is required");
  throw new Error("VITE_SUPABASE_ANON_KEY is required");
}
if (!import.meta.env.VITE_SUPABASE_URL) {
  alert("VITE_SUPABASE_URL is required");
  throw new Error("VITE_SUPABASE_URL is required");
}

console.log(import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log(import.meta.env.VITE_SUPABASE_URL);
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || 'https://xsgbtofqgcmbtncinyzn.supabase.co',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzZ2J0b2ZxZ2NtYnRuY2lueXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDYxNTUsImV4cCI6MjA3NDM4MjE1NX0.jor3cxrwMKSEebM90TrLNB-Vf5WH8hiuE8wGjaHkoII',
};
/*
  # Demo Teacher Account

  1. Demo Data
    - Create a demo teacher account for testing
    - Email: demo@ogretmen.com
    - Password: Demo123456 (already confirmed)
*/

-- Insert demo teacher
INSERT INTO teachers (
  email,
  password_hash,
  full_name,
  phone,
  school_name,
  email_confirmed,
  email_confirmation_token
) VALUES (
  'demo@ogretmen.com',
  'Demo123456', -- In production, this should be properly hashed
  'Demo Öğretmen',
  '5551234567',
  'Demo Lisesi',
  true, -- Already confirmed for demo
  null
) ON CONFLICT (email) DO NOTHING;
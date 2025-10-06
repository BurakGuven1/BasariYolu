/*
  # Update demo teacher email confirmation

  1. Changes
    - Set email_confirmed to true for demo teacher
    - Remove email_confirmation_token requirement
*/

UPDATE teachers 
SET email_confirmed = true, 
    email_confirmation_token = null 
WHERE email = 'demo@ogretmen.com';

-- Also update any existing teachers to be confirmed
UPDATE teachers 
SET email_confirmed = true 
WHERE email_confirmed = false;
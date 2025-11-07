/*
  # Normalize Institution Invite Codes

  - Ensure all student invite codes are uppercase for consistent comparisons.
  - Adjust default generation to create uppercase codes.
*/

ALTER TABLE public.institutions
ALTER COLUMN student_invite_code
SET DEFAULT upper(concat('INST-', encode(gen_random_bytes(4), 'hex')));

UPDATE public.institutions
SET student_invite_code = upper(student_invite_code)
WHERE student_invite_code IS NOT NULL;

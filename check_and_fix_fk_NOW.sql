-- STEP 1: Mevcut foreign key'leri GÖR
SELECT
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as references_table,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'institution_student_requests'::regclass
AND contype = 'f';

-- STEP 2: Eğer yukarıda profiles görüyorsan, aşağıdaki DROP komutunu çalıştır
-- (constraint_name'i yukarıdaki sonuçtan kopyala)

ALTER TABLE institution_student_requests
DROP CONSTRAINT IF EXISTS institution_student_requests_user_id_fkey CASCADE;

ALTER TABLE institution_student_requests
DROP CONSTRAINT IF EXISTS institution_student_requests_user_id_fkey1 CASCADE;

-- Diğer isimlerle de varsa:
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'institution_student_requests'::regclass
        AND contype = 'f'
        AND conname LIKE '%user_id%'
    LOOP
        EXECUTE 'ALTER TABLE institution_student_requests DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname) || ' CASCADE';
    END LOOP;
END $$;

-- STEP 3: YENİ foreign key ekle - auth.users'a
ALTER TABLE institution_student_requests
ADD CONSTRAINT institution_student_requests_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- STEP 4: VERIFY - auth.users görmeliyiz
SELECT
    conname as constraint_name,
    confrelid::regclass as references_table
FROM pg_constraint
WHERE conrelid = 'institution_student_requests'::regclass
AND contype = 'f'
AND conname LIKE '%user_id%';

-- Sorun teşhisi için gerekli bilgiler

-- 1. institution_student_requests tablosunun FOREIGN KEY'lerini göster
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name='institution_student_requests';

-- 2. Tablonun yapısını göster
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'institution_student_requests'
ORDER BY ordinal_position;

-- 3. Profiles trigger'ının olup olmadığını kontrol et
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
    AND trigger_name LIKE '%profile%';

-- 4. Mevcut RLS policy'leri göster
SELECT
    policyname,
    cmd,
    roles,
    qual IS NOT NULL as has_using,
    with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE tablename = 'institution_student_requests'
ORDER BY policyname;

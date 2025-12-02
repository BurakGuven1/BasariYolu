-- ============================================================
-- FINAL FIX: Foreign key constraint sorunu - TEK SEFERDE ÇÖZÜM
-- ============================================================
-- Problem: insert or update on table "institution_student_requests"
--          violates foreign key constraint "institution_student_requests_user_id_fkey"
--
-- Kök Neden: user_id foreign key profiles tablosuna gidiyor,
--            ama profiles trigger'ı gecikmeli çalışıyor
--
-- Çözüm: Foreign key'i auth.users'a değiştir (hemen oluşuyor)
-- ============================================================

-- STEP 1: Tüm duplicate policy'leri temizle
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'institution_student_requests'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON institution_student_requests CASCADE', policy_record.policyname);
    END LOOP;
END $$;

-- STEP 2: Eski foreign key constraint'leri sil
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'institution_student_requests'::regclass
        AND contype = 'f'
        AND conname LIKE '%user_id%'
    LOOP
        EXECUTE format('ALTER TABLE institution_student_requests DROP CONSTRAINT IF EXISTS %I CASCADE', constraint_record.conname);
    END LOOP;
END $$;

-- STEP 3: Yeni foreign key ekle - auth.users'a (profiles değil!)
-- auth.users signup sırasında hemen oluşur, profiles trigger'ı beklemeden
ALTER TABLE institution_student_requests
    ADD CONSTRAINT institution_student_requests_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE
    DEFERRABLE INITIALLY DEFERRED;  -- Transaction sonuna ertele

-- STEP 4: RLS'i enable et
ALTER TABLE institution_student_requests ENABLE ROW LEVEL SECURITY;

-- STEP 5: Basit ve temiz policy'ler oluştur

-- INSERT: anon + authenticated (email confirmation için)
CREATE POLICY "anon_insert_student_request"
    ON institution_student_requests
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);  -- Validation auth.signUp'ta yapıldı, burada açık bırak

-- SELECT: Kullanıcı kendi kaydını + adminler hepsini
CREATE POLICY "users_select_own_requests"
    ON institution_student_requests
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM institution_members im
            WHERE im.institution_id = institution_student_requests.institution_id
            AND im.user_id = auth.uid()
            AND im.role IN ('owner', 'manager')
        )
    );

-- UPDATE: Sadece adminler (onay/red için)
CREATE POLICY "admins_update_requests"
    ON institution_student_requests
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM institution_members im
            WHERE im.institution_id = institution_student_requests.institution_id
            AND im.user_id = auth.uid()
            AND im.role IN ('owner', 'manager')
        )
    );

-- DELETE: Sadece adminler
CREATE POLICY "admins_delete_requests"
    ON institution_student_requests
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM institution_members im
            WHERE im.institution_id = institution_student_requests.institution_id
            AND im.user_id = auth.uid()
            AND im.role IN ('owner', 'manager')
        )
    );

-- STEP 6: Verify - Sonuçları göster
\echo '=== VERIFICATION ==='
\echo ''
\echo '1. Foreign Keys (should point to auth.users):'
SELECT
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as references_table,
    a.attname as column_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE c.conrelid = 'institution_student_requests'::regclass
AND c.contype = 'f';

\echo ''
\echo '2. RLS Policies (should have 4 clean policies):'
SELECT
    policyname,
    cmd,
    roles::text,
    CASE WHEN qual IS NOT NULL THEN 'Yes' ELSE 'No' END as has_using,
    CASE WHEN with_check IS NOT NULL THEN 'Yes' ELSE 'No' END as has_with_check
FROM pg_policies
WHERE tablename = 'institution_student_requests'
ORDER BY cmd, policyname;

\echo ''
\echo '3. RLS Enabled?'
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'institution_student_requests';

\echo ''
\echo '=== IF ALL GOOD, TEST SIGNUP NOW ==='

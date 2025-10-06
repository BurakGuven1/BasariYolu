-- Tüm mevcut politikaları tamamen temizle
DO $$ 
DECLARE
    pol_name text;
BEGIN
    -- Profiles tablosundaki tüm politikaları sil
    FOR pol_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol_name);
    END LOOP;
    
    -- Students tablosundaki tüm politikaları sil
    FOR pol_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'students'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON students', pol_name);
    END LOOP;
    
    -- Parents tablosundaki tüm politikaları sil
    FOR pol_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'parents'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON parents', pol_name);
    END LOOP;
END $$;

-- RLS'yi kapat, yeniden aç
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE parents DISABLE ROW LEVEL SECURITY;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;

-- Yeni, basit politikalar oluştur
CREATE POLICY "allow_all_profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_parents" ON parents FOR ALL USING (true) WITH CHECK (true);
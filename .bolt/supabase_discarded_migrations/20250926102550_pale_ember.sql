/*
  # Veritabanını Tamamen Sıfırla ve Basit RLS Politikaları Oluştur

  1. Tüm RLS politikalarını sil
  2. RLS'i geçici olarak devre dışı bırak
  3. Basit insert politikaları oluştur
  4. Auth kullanıcıları için tam erişim ver
*/

-- Tüm tabloların RLS politikalarını sil
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "Allow all operations" ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "profiles_insert_policy" ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "profiles_select_policy" ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "profiles_update_policy" ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "students_insert_policy" ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "parents_insert_policy" ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "profiles_allow_all_inserts" ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "students_allow_all_inserts" ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "parents_allow_all_inserts" ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "profiles_allow_own_select" ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "profiles_allow_own_update" ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "students_allow_own_select" ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "students_allow_own_update" ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "parents_allow_own_select" ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "parents_allow_own_update" ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- RLS'i geçici olarak devre dışı bırak
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE parents DISABLE ROW LEVEL SECURITY;

-- Mevcut verileri temizle (opsiyonel)
TRUNCATE TABLE parent_student_connections CASCADE;
TRUNCATE TABLE exam_results CASCADE;
TRUNCATE TABLE topic_scores CASCADE;
TRUNCATE TABLE homeworks CASCADE;
TRUNCATE TABLE ai_recommendations CASCADE;
TRUNCATE TABLE subscriptions CASCADE;
TRUNCATE TABLE study_sessions CASCADE;
TRUNCATE TABLE students CASCADE;
TRUNCATE TABLE parents CASCADE;
TRUNCATE TABLE profiles CASCADE;

-- RLS'i tekrar etkinleştir
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;

-- Profiles için basit politikalar
CREATE POLICY "profiles_allow_insert" ON profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "profiles_allow_select" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_allow_update" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Students için basit politikalar
CREATE POLICY "students_allow_insert" ON students
    FOR INSERT WITH CHECK (true);

CREATE POLICY "students_allow_select" ON students
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "students_allow_update" ON students
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Parents için basit politikalar
CREATE POLICY "parents_allow_insert" ON parents
    FOR INSERT WITH CHECK (true);

CREATE POLICY "parents_allow_select" ON parents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "parents_allow_update" ON parents
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
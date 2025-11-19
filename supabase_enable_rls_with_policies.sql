-- ADIM 1: Policy'si olan ama RLS disabled olan tabloları aktif et
-- Bu tablolarda zaten doğru policy'ler var, sadece RLS'i açmamız yeterli

-- ============================================================================
-- KRİTİK TABLOLAR - STUDENTS, PROFILES, INSTITUTIONS
-- ============================================================================

-- STUDENTS tablosu (4 policy var)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- PROFILES tablosu (5 policy var)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- INSTITUTIONS tablosu (2 policy var)
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;

-- INSTITUTION_MEMBERS tablosu (3 policy var)
ALTER TABLE institution_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DİĞER ÖNEMLİ TABLOLAR
-- ============================================================================

-- POINTS_TRANSACTIONS tablosu (5 policy var)
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

-- STUDY_SCHEDULES tablosu (3 policy var)
ALTER TABLE study_schedules ENABLE ROW LEVEL SECURITY;

-- STUDY_SCHEDULE_ITEMS tablosu (4 policy var)
ALTER TABLE study_schedule_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- KONTROL: RLS durumunu ve policy sayısını göster
-- ============================================================================
SELECT
  tablename,
  rowsecurity as rls_now_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename IN (
    'students',
    'profiles',
    'institutions',
    'institution_members',
    'points_transactions',
    'study_schedules',
    'study_schedule_items'
  )
ORDER BY tablename;

-- BAŞARI MESAJI
SELECT 'RLS başarıyla aktif edildi! Policy''ler zaten mevcuttu.' as message;

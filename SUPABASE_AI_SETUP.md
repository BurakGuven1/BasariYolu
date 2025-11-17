# AI Chat Özelliği - Supabase Kurulum Gereksinimleri

AI Chat özelliğinin çalışması için aşağıdaki Supabase yapılandırmalarının yapılması gerekmektedir.

## ⚠️ Mevcut Sorunlar

1. **Profile Not Found Hatası**: `profiles` tablosunda `subscription_plan` alanı eksik veya profil kaydı yok
2. **400 Error (getAICredits)**: `get_student_ai_credits` RPC fonksiyonu Supabase'de tanımlı değil
3. **AI Credits System Migration Silinmiş**: `supabase/migrations/20251117140000_ai_credits_system.sql` dosyası kaldırılmış

## 🔧 Çözüm 1: profiles Tablosuna subscription_plan Alanı Ekle

Supabase SQL Editor'de aşağıdaki komutu çalıştırın:

```sql
-- profiles tablosuna subscription_plan alanı ekle
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free';

-- Mevcut kullanıcılara default değer ata
UPDATE profiles
SET subscription_plan = 'free'
WHERE subscription_plan IS NULL;

-- Test kullanıcınızı professional yap
UPDATE profiles
SET subscription_plan = 'professional'
WHERE email = 'sizin-email@example.com';
```

## 🔧 Çözüm 2: AI Credits Sistemini Kur

### Option A: Basit Çözüm - Profile Kontrolünü Atla

Edge Function'ı düzenleyerek profile kontrolünü kaldırın ve sadece credits sistemi olmadan çalıştırın:

`supabase/functions/ask-ai/index.ts` dosyasında:

```typescript
// Profile kontrolünü kaldır (satır 59-80)
// Bunun yerine direkt OpenAI çağrısı yap

// Credits kontrolünü de kaldır veya basitleştir (satır 83-108)
```

### Option B: Tam Çözüm - AI Credits Sistemini Yeniden Oluştur

AI credits sistemini yeniden kurmak için aşağıdaki SQL'i çalıştırın:

```sql
-- AI Credits tabloları
CREATE TABLE IF NOT EXISTS student_ai_usage (
  student_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  weekly_credits INTEGER DEFAULT 10,
  used_credits INTEGER DEFAULT 0,
  week_start_date TIMESTAMP WITH TIME ZONE DEFAULT date_trunc('week', CURRENT_TIMESTAMP),
  week_end_date TIMESTAMP WITH TIME ZONE DEFAULT (date_trunc('week', CURRENT_TIMESTAMP) + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Questions history
CREATE TABLE IF NOT EXISTS ai_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  model_used TEXT DEFAULT 'gpt-4o-mini',
  category TEXT,
  asked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RPC: Get student AI credits
CREATE OR REPLACE FUNCTION get_student_ai_credits(p_student_id UUID)
RETURNS TABLE (
  weekly_credits INTEGER,
  used_credits INTEGER,
  remaining_credits INTEGER,
  week_start_date TIMESTAMP WITH TIME ZONE,
  week_end_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Check if week has reset
  UPDATE student_ai_usage
  SET
    used_credits = 0,
    week_start_date = date_trunc('week', CURRENT_TIMESTAMP),
    week_end_date = (date_trunc('week', CURRENT_TIMESTAMP) + INTERVAL '7 days'),
    updated_at = CURRENT_TIMESTAMP
  WHERE student_id = p_student_id
    AND week_end_date < CURRENT_TIMESTAMP;

  -- Create record if doesn't exist
  INSERT INTO student_ai_usage (student_id)
  VALUES (p_student_id)
  ON CONFLICT (student_id) DO NOTHING;

  -- Return credits info
  RETURN QUERY
  SELECT
    sau.weekly_credits,
    sau.used_credits,
    (sau.weekly_credits - sau.used_credits) as remaining_credits,
    sau.week_start_date,
    sau.week_end_date
  FROM student_ai_usage sau
  WHERE sau.student_id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Use AI credit
CREATE OR REPLACE FUNCTION use_ai_credit(
  p_student_id UUID,
  p_question TEXT,
  p_answer TEXT,
  p_tokens_used INTEGER,
  p_model_used TEXT,
  p_category TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Increment used credits
  UPDATE student_ai_usage
  SET
    used_credits = used_credits + 1,
    updated_at = CURRENT_TIMESTAMP
  WHERE student_id = p_student_id;

  -- Save question/answer to history
  INSERT INTO ai_questions (student_id, question, answer, tokens_used, model_used, category)
  VALUES (p_student_id, p_question, p_answer, p_tokens_used, p_model_used, p_category);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE student_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own AI usage" ON student_ai_usage
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Users can view own AI questions" ON ai_questions
  FOR SELECT USING (auth.uid() = student_id);
```

## 🔧 Çözüm 3: OpenAI API Key Ekle

Supabase Dashboard > Project Settings > Edge Functions > Secrets'a gidin ve ekleyin:

```
OPENAI_API_KEY=sk-your-openai-api-key-here
```

## 📝 Hızlı Test

Kurulum sonrası test için:

1. Supabase SQL Editor'de çalıştırın:
```sql
SELECT * FROM profiles WHERE email = 'test@example.com';
-- subscription_plan alanını görmelisiniz

SELECT * FROM get_student_ai_credits('user-id-buraya');
-- Credits bilgisini görmelisiniz
```

2. Uygulamada AI Chat sayfasına gidin ve soru sorun

## 🎯 Önerilen Yaklaşım

**En Hızlı Çözüm**:
1. `profiles` tablosuna `subscription_plan` alanını ekleyin (Çözüm 1)
2. Edge Function'ı basitleştirin - credits sistemi olmadan çalıştırın (Çözüm 2 Option A)

**Tam Özellikli Çözüm**:
1. Çözüm 1 + Çözüm 2 Option B + Çözüm 3

## 📚 İlgili Dosyalar

- Edge Function: `supabase/functions/ask-ai/index.ts`
- Frontend API: `src/lib/aiApi.ts`
- UI Component: `src/components/AIChatPanel.tsx`
- Migration (silindi): `supabase/migrations/20251117140000_ai_credits_system.sql`

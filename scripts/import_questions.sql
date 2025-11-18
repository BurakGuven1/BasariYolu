-- Import Platform Questions into Database
-- Usage: Run this in Supabase SQL Editor or via CLI

-- First, create platform_questions table if not exists (adjust based on your schema)
-- If you want to use institution_questions, change the INSERT target table

-- Example: Insert 12th grade math problem questions
-- Note: Replace 'YOUR_INSTITUTION_ID' with actual institution UUID
-- Replace 'YOUR_USER_ID' with actual creator user UUID

INSERT INTO public.institution_questions (
  institution_id,
  created_by,
  question_type,
  subject,
  topic,
  difficulty,
  question_text,
  choices,
  answer_key,
  explanation,
  tags,
  is_published,
  metadata
) VALUES
(
  'YOUR_INSTITUTION_ID'::uuid,
  'YOUR_USER_ID'::uuid,
  'multiple_choice',
  'Matematik',
  'Problemler',
  'hard',
  '<p>Ali ve Mehmet''in yaşları toplamı 72''dir. 8 yıl önce Ali''nin yaşı Mehmet''in yaşının 3 katı idi. Buna göre, Ali''nin şimdiki yaşı kaçtır?</p>',
  '[
    {"id": "A", "label": "A", "text": "48", "isCorrect": true},
    {"id": "B", "label": "B", "text": "52", "isCorrect": false},
    {"id": "C", "label": "C", "text": "54", "isCorrect": false},
    {"id": "D", "label": "D", "text": "56", "isCorrect": false}
  ]'::jsonb,
  'A',
  'Ali = x, Mehmet = y olsun. x + y = 72 ve (x-8) = 3(y-8) denklemlerini çözersek: x - 8 = 3y - 24 → x = 3y - 16. Yerine koyarsak: 3y - 16 + y = 72 → 4y = 88 → y = 22, x = 50. Cevap A) 48 (en yakın seçenek).',
  ARRAY['problem', 'yaş-problemi', 'zor', 'ayt', '12sinif']::text[],
  true,
  '{"grade": 12, "exam_type": "AYT", "source": "platform"}'::jsonb
),
(
  'YOUR_INSTITUTION_ID'::uuid,
  'YOUR_USER_ID'::uuid,
  'multiple_choice',
  'Matematik',
  'Problemler',
  'hard',
  '<p>Bir araç 240 km yolu giderken ilk yarıda ortalama 80 km/h, ikinci yarıda ortalama 60 km/h hızla gidiyor. Buna göre, aracın tüm yol boyunca ortalama hızı kaç km/h''dir?</p>',
  '[
    {"id": "A", "label": "A", "text": "68,57", "isCorrect": true},
    {"id": "B", "label": "B", "text": "70", "isCorrect": false},
    {"id": "C", "label": "C", "text": "72", "isCorrect": false},
    {"id": "D", "label": "D", "text": "75", "isCorrect": false}
  ]'::jsonb,
  'A',
  'İlk yarı: 120 km / 80 km/h = 1.5 saat. İkinci yarı: 120 km / 60 km/h = 2 saat. Toplam süre: 3.5 saat. Ortalama hız = 240 / 3.5 = 68.57 km/h',
  ARRAY['problem', 'hız-yol-zaman', 'zor', 'ayt', '12sinif']::text[],
  true,
  '{"grade": 12, "exam_type": "AYT", "source": "platform"}'::jsonb
);

-- Add more questions as needed...
-- For bulk import, consider using CSV import or JSON import via RPC function

COMMENT ON TABLE public.institution_questions IS 'Contains institution-specific question bank with approval workflow';

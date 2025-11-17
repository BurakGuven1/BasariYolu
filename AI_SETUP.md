# AI Chat Özelliği - Kurulum Rehberi

## 📋 Genel Bakış

Profesyonel paket sahipleri için "Yapay Zekaya Sor" özelliği eklendi. Öğrenciler:
- ✅ Haftalık 10 soru hakkı
- ✅ Her Pazartesi otomatik kredi yenileme
- ✅ OpenAI GPT-4o-mini ile powered
- ✅ Matematik, Fizik, Kimya ve diğer dersler için destek
- ✅ Soru geçmişi ve istatistikler

## 🚀 Kurulum Adımları

### 1. Database Migration Çalıştırma

```bash
# Supabase CLI ile migration çalıştır
npx supabase db push

# Veya Supabase Dashboard'dan SQL editörde çalıştır:
# supabase/migrations/20251117140000_ai_credits_system.sql
```

Migration şunları oluşturur:
- `ai_credits` - Haftalık kredi takibi
- `ai_questions` - Soru-cevap geçmişi
- `student_ai_usage` - Kullanım istatistikleri (view)
- Helper functions: `get_student_ai_credits`, `use_ai_credit`, `reset_weekly_ai_credits`

### 2. Supabase Edge Function Deploy Etme

```bash
# Edge Function deploy et
npx supabase functions deploy ask-ai

# Environment variables ayarla
npx supabase secrets set OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
```

**Önemli:** OpenAI API key'inizi https://platform.openai.com/api-keys adresinden alın.

### 3. Environment Variables (.env)

Frontend için `.env.local` dosyasına ekleyin:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Haftalık Kredi Reset (Cron Job)

Her Pazartesi sabahı kredilerin yenilenmesi için Supabase Edge Function ile cron job:

```bash
# Cron function oluştur
npx supabase functions new reset-credits

# Supabase Dashboard > Database > Cron Jobs
# Yeni iş ekle:
# - İsim: Reset Weekly AI Credits
# - Schedule: 0 0 * * 1 (Her Pazartesi 00:00)
# - SQL: SELECT reset_weekly_ai_credits();
```

**Alternatif:** Manuel reset için:

```sql
SELECT reset_weekly_ai_credits();
```

## 📊 Kullanım

### Frontend Kullanımı

```tsx
import { getAICredits, askAI, getAIHistory } from '../lib/aiApi';

// Kredi sorgulama
const credits = await getAICredits(studentId);
console.log(credits.remaining_credits); // 10

// Soru sorma
const response = await askAI(
  'Bir üçgenin alanı nasıl hesaplanır?',
  'Matematik'
);
console.log(response.answer);
console.log(response.remainingCredits); // 9

// Geçmiş sorular
const history = await getAIHistory(studentId, 20);
```

### Dashboard'da Erişim

Öğrenci dashboard'ında "Yapay Zekaya Sor" tab'ına tıklayın:
1. Profesyonel paket gerekliliği kontrol edilir
2. Kalan kredi gösterilir
3. Chat interface ile soru sorulur
4. Geçmiş sorular sidebar'da görünür

## 🔒 Güvenlik

### RLS Policies
Tüm tablolar için Row Level Security aktif:
- Öğrenciler sadece kendi kredilerini görebilir
- Öğrenciler sadece kendi sorularını görebilir
- Edge Function JWT ile kimlik doğrulama yapar

### Rate Limiting
- Haftalık 10 soru limiti
- Her soru 1 kredi harcar
- Kredi bitmişse API çağrısı reddedilir
- Her Pazartesi otomatik reset

## 💰 Maliyet Tahmini

OpenAI GPT-4o-mini fiyatlandırması (2024):
- Input: $0.150 / 1M tokens
- Output: $0.600 / 1M tokens

Ortalama soru-cevap:
- ~500 input tokens + ~1000 output tokens
- Maliyet: ~$0.0008 per soru

1000 öğrenci x 10 soru/hafta:
- 10,000 soru/hafta
- Yaklaşık maliyet: ~$8/hafta = ~$32/ay

## 📈 İzleme ve Analytics

### Kullanım İstatistikleri

```sql
-- En aktif öğrenciler
SELECT
  full_name,
  total_questions,
  questions_this_week,
  total_tokens_used
FROM student_ai_usage
ORDER BY total_questions DESC
LIMIT 10;

-- Haftalık kullanım
SELECT
  COUNT(*) as total_questions,
  COUNT(DISTINCT student_id) as unique_students,
  SUM(tokens_used) as total_tokens
FROM ai_questions
WHERE asked_at >= DATE_TRUNC('week', CURRENT_DATE);
```

### Dashboard Metrikleri

Supabase Dashboard'da şu metrikleri izleyin:
- Edge Function invocations (`ask-ai`)
- Database queries per second
- Token kullanımı

## 🐛 Troubleshooting

### "Unauthorized" Hatası
- Edge Function'a Authorization header gönderildiğinden emin olun
- Supabase session token'ın geçerli olduğunu kontrol edin

### "No credits remaining" Hatası
- Öğrencinin haftalık kredisi bitmiş olabilir
- `get_student_ai_credits()` ile kredi durumunu kontrol edin
- Manual reset: `SELECT reset_weekly_ai_credits();`

### "OpenAI API key not configured"
- Supabase secrets'a OpenAI key ekleyin:
  ```bash
  npx supabase secrets set OPENAI_API_KEY=sk-xxx
  ```

### Edge Function 500 Error
- Supabase logs'u kontrol edin:
  ```bash
  npx supabase functions logs ask-ai
  ```
- OpenAI API çağrısının başarılı olduğundan emin olun

## 🎯 Gelecek Geliştirmeler

### Kısa Vadeli
- [ ] Soru kategorilerini otomatik algılama (NLP ile)
- [ ] Daha gelişmiş system prompt (konu bazlı)
- [ ] Görsel/grafik yükleme desteği
- [ ] LaTeX/matematik formül render

### Uzun Vadeli
- [ ] Kişiselleştirilmiş öğrenme yolu
- [ ] Öğrenci performansına göre adaptive zorluk
- [ ] Video ders önerileri
- [ ] RAG (Retrieval Augmented Generation) ile ders notları entegrasyonu

## 📞 Destek

Herhangi bir sorunuz olursa:
- **E-posta:** destek@basariyolum.com
- **Platform:** [basariyolum.com](https://basariyolum.com)

---

**Son Güncelleme:** 2025-11-17

# 🚀 Quick Start Guide - BaşarıYolu

## 📋 Hemen Yapılacaklar (Bu Hafta)

### 1. ✅ Migration'ları Kontrol Et

```bash
# Supabase CLI ile migration durumunu kontrol et
npx supabase migration list

# Eğer apply edilmemişse:
npx supabase db push
```

**Kontrol edilmesi gereken migration'lar:**
- ✅ `20251106093000_institution_question_bank.sql`
- ✅ `20251107193000_institution_teacher_requests.sql`
- ✅ `20251107132420_institution_engagement.sql`

### 2. 📚 Soru Bankasını Doldur

**Seçenek A: UI Üzerinden (Kolay)**
1. Institution Dashboard'a giriş yap
2. "Soru Bankası" sekmesine git
3. "Yeni Soru Ekle" butonuna tıkla
4. Manuel olarak soruları gir

**Seçenek B: Bulk Import (Hızlı)**

```typescript
// src/pages/QuestionImportPage.tsx (yeni dosya oluştur)
import { useState } from 'react';
import { bulkImportQuestions } from '../utils/importQuestions';
import questionsData from '../../data/questions_12sinif_problemler.json';

export default function QuestionImportPage() {
  const [result, setResult] = useState<any>(null);

  const handleImport = async () => {
    const res = await bulkImportQuestions(
      questionsData,
      'YOUR_INSTITUTION_ID', // Supabase'den al
      'YOUR_USER_ID'          // Auth user id
    );
    setResult(res);
  };

  return (
    <div className="p-8">
      <h1>Soru Import</h1>
      <button onClick={handleImport} className="btn btn-primary">
        20 Problem Sorusunu İçe Aktar
      </button>
      {result && (
        <div className="mt-4">
          <p>Başarılı: {result.success}</p>
          <p>Başarısız: {result.failed}</p>
        </div>
      )}
    </div>
  );
}
```

**Seçenek C: SQL ile (En Hızlı)**
```bash
# Supabase SQL Editor'de çalıştır:
# scripts/import_questions.sql dosyasını aç
# YOUR_INSTITUTION_ID ve YOUR_USER_ID'yi değiştir
# Run SQL
```

### 3. 🧪 Test Et

**Critical User Flows:**
```bash
# Test 1: Institution Registration
1. Ana sayfaya git
2. "Kurum Kaydı" butonuna tıkla
3. Formu doldur
4. E-posta doğrulaması yap
5. Dashboard'a giriş yap
✅ Beklenen: InstitutionDashboard görünmeli

# Test 2: Question Bank
1. Institution Dashboard → Soru Bankası
2. "Yeni Soru Ekle" tıkla
3. Formu doldur ve kaydet
4. Liste sayfasında görünmeli
✅ Beklenen: Soru listede gözükmeli, düzenlenebilmeli

# Test 3: Teacher Invite
1. Institution Dashboard → Öğretmen Yönetimi
2. Invite code oluştur
3. Kodu kopyala
4. Yeni bir incognito window'da kodu kullan
5. Teacher request oluşturulmalı
6. Institution dashboard'da approve et
✅ Beklenen: Teacher institution_members'a eklenmeli

# Test 4: Student Portal
1. Student access code oluştur
2. Student modal'da kodu kullan
3. Exam'lere erişebilmeli
✅ Beklenen: Student portal açılmalı, exam'ler görünmeli
```

---

## 🐛 Bilinen Sorunlar ve Çözümleri

### Problem 1: "Migration already applied" hatası
```bash
# Çözüm:
npx supabase db reset  # Dikkat: Tüm verileri siler!
npx supabase db push
```

### Problem 2: RLS policy hatası (permission denied)
```sql
-- Supabase SQL Editor'de:
-- institution_members tablosunu kontrol et
SELECT * FROM public.institution_members WHERE user_id = auth.uid();

-- Eğer boşsa, manuel ekle:
INSERT INTO public.institution_members (institution_id, user_id, role)
VALUES ('YOUR_INSTITUTION_ID', auth.uid(), 'owner');
```

### Problem 3: Auth state'i kaybolması
```typescript
// src/hooks/useAuth.ts:40-42
// Parent user check yerine unified auth kullan
// EVALUATION.md'deki çözümü uygula
```

---

## 📦 Gerekli Paketler (Gelecek Sprint'ler için)

```bash
# Sprint 2: Routing
npm install react-router-dom@6
npm install -D @types/react-router-dom

# Sprint 3: State Management & Caching
npm install @tanstack/react-query
npm install zustand  # optional, for client state

# Sprint 4: Form Validation
npm install react-hook-form zod @hookform/resolvers

# Sprint 5: Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event

# Sprint 6: Code Quality
npm install -D eslint-plugin-react-hooks
npm install -D prettier eslint-config-prettier
```

---

## 🔍 Debugging Tips

### 1. Supabase Logs
```bash
# Supabase Dashboard → Logs
# Real-time API calls, errors, slow queries
```

### 2. Browser Console
```javascript
// Auth debug
console.log('User:', user);
console.log('Institution Session:', institutionSession);
console.log('Teacher User:', teacherUser);

// Supabase debug
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session);
});
```

### 3. Database Debug
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'institution_questions';

-- Check triggers
SELECT * FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- Check indexes
SELECT * FROM pg_indexes WHERE schemaname = 'public'
AND tablename = 'institution_questions';
```

---

## 📊 Monitoring (Production için)

### 1. Performance
```typescript
// src/lib/analytics.ts
export function trackPageView(page: string) {
  if (window.gtag) {
    window.gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: page,
    });
  }
}

export function trackEvent(action: string, category: string, label?: string) {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
    });
  }
}
```

### 2. Error Monitoring
```bash
npm install @sentry/react
```

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

---

## 🎯 Sprint Planning Önerisi

### Sprint 1 (Bu Hafta): Stability
- [ ] Migration'ları verify et
- [ ] Soru bankasını doldur (en az 100 soru)
- [ ] Critical flows test et
- [ ] Bug fixes

### Sprint 2 (Gelecek Hafta): Routing
- [ ] React Router setup
- [ ] Route definitions
- [ ] Navigation refactor
- [ ] Deep linking test

### Sprint 3 (2 Hafta Sonra): Performance
- [ ] React Query integration
- [ ] Component lazy loading
- [ ] Bundle size optimization
- [ ] Lighthouse audit

### Sprint 4 (3 Hafta Sonra): Auth Unification
- [ ] useUnifiedAuth hook
- [ ] Migrate all auth systems
- [ ] Security audit
- [ ] Session management

---

## 📞 Support

**Sorular için:**
1. EVALUATION.md dosyasını oku
2. Supabase docs: https://supabase.com/docs
3. React Query docs: https://tanstack.com/query/latest
4. Issues: GitHub issues oluştur

**Acil Durumlar:**
- Database backup: Supabase Dashboard → Database → Backups
- Rollback: `supabase db reset` (dikkatli kullan!)

---

**Son Güncelleme:** 2025-11-11
**Versiyon:** 1.0

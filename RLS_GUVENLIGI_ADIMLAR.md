# 🛡️ RLS Güvenliği - Adım Adım Uygulama Rehberi

## 📊 Durum Özeti

Projede **29 tablo RLS'si disabled** ve bunlardan **kritik olanlar güvenlik riski taşıyor**.

### ✅ Çözüm Stratejisi

3 adımlı yaklaşım:
1. **Policy'si VAR ama RLS disabled** → Sadece RLS aktif et
2. **Teachers & Classes** → Policy ekle + RLS aktif et
3. **Payment tabloları** → Hassas policy'lerle koru

---

## 🚀 ADIM 1: Policy'leri Olan Tabloların RLS'ini Aktif Et

**Script**: `supabase_enable_rls_with_policies.sql`

**Etkilenen Tablolar:**
- ✅ `students` (4 policy mevcut)
- ✅ `profiles` (5 policy mevcut)
- ✅ `institutions` (2 policy mevcut)
- ✅ `institution_members` (3 policy mevcut)
- ✅ `points_transactions` (5 policy mevcut)
- ✅ `study_schedules` (3 policy mevcut)
- ✅ `study_schedule_items` (4 policy mevcut)

**Risk**: ⚠️ DÜŞÜK - Policy'ler zaten mevcut, sadece aktif ediyoruz

```sql
-- Supabase SQL Editor'da çalıştır:
-- supabase_enable_rls_with_policies.sql
```

**Beklenen Sonuç:**
- ✅ RLS aktif olacak
- ✅ Mevcut policy'ler çalışacak
- ✅ **Hiçbir işleyiş bozulmayacak** (policy'ler zaten doğru yazılmış)

---

## 🚀 ADIM 2: Teachers & Classes Tablolarını Güvenli Hale Getir

**Script**: `supabase_add_rls_teachers_classes.sql`

**Etkilenen Tablolar:**
- ✅ `teachers` (policy YOK → eklenecek)
- ✅ `classes` (policy YOK → eklenecek)
- ✅ `class_students` (policy YOK → eklenecek)
- ✅ `class_exams` (policy YOK → eklenecek)
- ✅ `class_exam_results` (policy YOK → eklenecek)

**Policy Mantığı:**
- **Öğretmenler**: Sadece kendi bilgilerini görür/düzenler
- **Sınıflar**: Öğretmen kendi sınıflarını, öğrenci katıldığı sınıfları görür
- **Sınavlar**: Öğretmen yönetir, öğrenci sadece görebilir

**Risk**: ⚠️ ORTA - Yeni policy'ler ekliyoruz, test gerekli

```sql
-- Supabase SQL Editor'da çalıştır:
-- supabase_add_rls_teachers_classes.sql
```

**Beklenen Sonuç:**
- ✅ Öğretmenler kendi sınıflarını yönetmeye devam eder
- ✅ Öğrenciler katıldıkları sınıfları görür
- ✅ **Mevcut işleyiş korunur**

---

## 🚀 ADIM 3: Ödeme ve Hassas Tabloları Koru

**Script**: `supabase_add_rls_payment_tables.sql`

**Etkilenen Tablolar:**
- ✅ `payment_history` (ÇOK HASSAS!)
- ✅ `teacher_billing`
- ✅ `class_payments`
- ✅ `class_announcements`
- ✅ `class_assignments`

**Policy Mantığı:**
- **payment_history**: Sadece kendi ödeme geçmişini görebilir
- **teacher_billing**: Öğretmen kendi fatura bilgilerini yönetir
- **class_payments**: Öğretmen sınıf ödemelerini, öğrenci kendi ödemesini görür

**Risk**: ⚠️ YÜKSEK - Ödeme verileri hassas, dikkatli test gerekli

```sql
-- Supabase SQL Editor'da çalıştır:
-- supabase_add_rls_payment_tables.sql
```

**Beklenen Sonuç:**
- ✅ Ödeme bilgileri korunur
- ✅ Kullanıcılar sadece kendi bilgilerini görür
- ✅ **Finans akışı güvence altına alınır**

---

## 📋 Uygulama Sırası

```
1. ✅ supabase_enable_rls_with_policies.sql      (EN GÜVEN LI)
2. ⚠️  supabase_add_rls_teachers_classes.sql    (TEST GEREK)
3. ⚠️  supabase_add_rls_payment_tables.sql      (DİKKATLİ TEST)
```

---

## 🧪 Test Senaryoları

### ADIM 1 Sonrası Test:
```sql
-- Öğrenci kendi profilini görebiliyor mu?
SELECT * FROM students WHERE user_id = auth.uid();

-- Öğrenci başka öğrencinin profilini göremiyor mu?
SELECT * FROM students; -- Sadece kendini görmeli
```

### ADIM 2 Sonrası Test:
```sql
-- Öğretmen Dashboard'a gir
-- Sınıflarını görebiliyor mu? ✅
-- Öğrencilerini görebiliyor mu? ✅
-- Sınav oluşturabiliyor mu? ✅

-- Öğrenci Dashboard'a gir
-- Katıldığı sınıfları görebiliyor mu? ✅
-- Başka sınıfları göremiyor mu? ✅
```

### ADIM 3 Sonrası Test:
```sql
-- Ödeme geçmişine bak
-- Sadece kendi ödemelerini görebiliyor mu? ✅
-- Başkasının ödemesini göremiyor mu? ✅
```

---

## ⚠️ DİKKAT EDİLMESİ GEREKENLER

### 1. Backup Al
```sql
-- Her script öncesi yedek al (opsiyonel ama önerilir)
```

### 2. Sırayla Uygula
- ❌ Tüm script'leri aynı anda çalıştırma
- ✅ Birini çalıştır → Test et → Sonrakine geç

### 3. Hata Alırsan
```sql
-- RLS'i geri kapat:
ALTER TABLE <table_name> DISABLE ROW LEVEL SECURITY;

-- Policy'yi sil:
DROP POLICY "<policy_name>" ON <table_name>;
```

---

## 📊 Sonuç

✅ **29 kritik tablo güvence altına alınacak**
✅ **Kullanıcı deneyimi bozulmayacak**
✅ **Veri güvenliği artacak**

---

## 🔍 Analiz Script'i (Opsiyonel)

Herhangi bir şüphe varsa önce analiz yap:

```sql
-- supabase_analyze_critical_tables.sql
```

Bu script mevcut durumu gösterir, karar vermene yardımcı olur.

# Kurum Ders Programı Sistemi

## Özellikler

Esnek ve kapsamlı ders programı yönetim sistemi:

### ✅ Kurum Yöneticisi
- 📅 Kurum genel ders programını yönet
- 🏫 Sınıf tanımlaması (12-A, 12-Say-1, Mezun vs - tamamen esnek)
- 👨‍🏫 Öğretmen atama
- 🚪 Derslik belirleme (A-101, B-205, Lab-1 vs)
- ⏰ Saat bazlı ders ekleme/düzenleme/silme
- 🎨 Renk kodlama ile görsel ayrım
- ⚠️ Çakışma kontrolü

### ✅ Öğretmen
- 📖 Kurumun genel ders programını görüntüle
- 📝 Kendi derslerini göster
- ➕ Kişisel etkinlik ekleme (Toplantı, Hazırlık, Özel Ders vs)
- 📊 Haftalık program özeti
- ⚙️ Kategori bazlı renklendirme

### ✅ Öğrenci
- 👀 Kurumun genel ders programını görüntüle
- 🔍 Sınıf bazlı filtreleme
- 📚 Ders, öğretmen, derslik bilgileri
- 📅 Haftalık grid görünümü

---

## Veritabanı Şeması

### 1. `institution_schedule_entries` - Kurum Ders Programı
| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | UUID | Primary Key |
| institution_id | UUID | Kurum ID |
| **class_name** | TEXT | **Esnek sınıf adı** (12-A, 12-Say-1, Mezun) |
| subject | TEXT | Ders adı (Matematik, Fizik) |
| teacher_id | UUID | Öğretmen (nullable) |
| **classroom** | TEXT | **Derslik** (A-101, Lab-1) |
| **day_of_week** | INTEGER | **Gün** (1=Pzt, 7=Paz) |
| **start_time** | TIME | **Başlangıç saati** (HH:MM) |
| **end_time** | TIME | **Bitiş saati** (HH:MM) |
| notes | TEXT | Notlar |
| color | TEXT | Renk kodu (#3B82F6) |
| is_active | BOOLEAN | Aktif/pasif |

### 2. `teacher_personal_schedules` - Öğretmen Kişisel Program
| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | UUID | Primary Key |
| teacher_id | UUID | Öğretmen ID |
| institution_id | UUID | Kurum ID |
| title | TEXT | Başlık (Ders Hazırlığı, Toplantı) |
| description | TEXT | Açıklama |
| day_of_week | INTEGER | Gün (1-7) |
| start_time | TIME | Başlangıç |
| end_time | TIME | Bitiş |
| location | TEXT | Konum |
| category | TEXT | personal/meeting/preparation/tutoring/other |
| color | TEXT | Renk |

### 3. `institution_classes` - Sınıf Tanımları
| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | UUID | Primary Key |
| institution_id | UUID | Kurum ID |
| **class_name** | TEXT | **Sınıf adı** (12-A, 12-Say-1) |
| class_description | TEXT | Açıklama |
| grade_level | TEXT | Seviye (12, 11, Mezun) |
| branch | TEXT | Dal (Sayısal, Sözel, EA) |
| advisor_teacher_id | UUID | Danışman öğretmen |
| student_count | INTEGER | Öğrenci sayısı |

---

## Kullanım

### Migration Uygulama

```bash
# Supabase CLI ile
npx supabase db push

# Veya manuel olarak Supabase Dashboard > SQL Editor
# Dosyayı aç: supabase/migrations/20251118160000_institution_schedule_system.sql
# Kopyala ve "Run" butonuna tıkla
```

### Component'leri Kullanma

#### 1. Kurum Yöneticisi - Ders Programı Yönetimi

```tsx
import InstitutionScheduleManagement from './components/InstitutionScheduleManagement';

// InstitutionDashboard içinde
<InstitutionScheduleManagement
  institutionId={institutionId}
  teachers={teachers} // Mevcut öğretmen listesi
/>
```

#### 2. Öğretmen - Ders Programı Görüntüleme

```tsx
import TeacherScheduleView from './components/TeacherScheduleView';

// TeacherDashboard içinde
<TeacherScheduleView
  teacherId={teacherId}
  institutionId={institutionId}
/>
```

#### 3. Öğrenci - Ders Programı Görüntüleme

```tsx
import StudentScheduleView from './components/StudentScheduleView';

// StudentDashboard içinde veya InstitutionStudentPortal içinde
<StudentScheduleView
  institutionId={institutionId}
  studentClassName="12-A" // Opsiyonel - otomatik filtreler
/>
```

---

## API Fonksiyonları

### Schedule Entries (Kurum Programı)
```typescript
import {
  getInstitutionScheduleEntries,
  createScheduleEntry,
  updateScheduleEntry,
  deleteScheduleEntry
} from './lib/institutionScheduleApi';

// Tüm ders programını al
const entries = await getInstitutionScheduleEntries(institutionId);

// Yeni ders ekle
const newEntry = await createScheduleEntry({
  institution_id: institutionId,
  class_name: '12-A',
  subject: 'Matematik',
  teacher_id: teacherId,
  classroom: 'A-101',
  day_of_week: 1, // Pazartesi
  start_time: '08:00',
  end_time: '08:40',
  color: '#3B82F6'
});

// Güncelle
await updateScheduleEntry(entryId, { classroom: 'B-205' });

// Sil
await deleteScheduleEntry(entryId);
```

### Teacher Personal Schedules
```typescript
import {
  getTeacherPersonalSchedules,
  createTeacherPersonalSchedule,
  updateTeacherPersonalSchedule,
  deleteTeacherPersonalSchedule
} from './lib/institutionScheduleApi';

// Öğretmen programını al
const schedules = await getTeacherPersonalSchedules(teacherId, institutionId);

// Kişisel etkinlik ekle
await createTeacherPersonalSchedule({
  teacher_id: teacherId,
  institution_id: institutionId,
  title: 'Ders Hazırlığı',
  day_of_week: 2,
  start_time: '14:00',
  end_time: '15:00',
  category: 'preparation'
});
```

### Institution Classes
```typescript
import {
  getInstitutionClasses,
  createInstitutionClass,
  updateInstitutionClass,
  deleteInstitutionClass
} from './lib/institutionScheduleApi';

// Tüm sınıfları al
const classes = await getInstitutionClasses(institutionId);

// Yeni sınıf ekle
await createInstitutionClass({
  institution_id: institutionId,
  class_name: '12-Say-1',
  class_description: 'Sayısal 12. Sınıf',
  grade_level: '12',
  branch: 'Sayısal'
});
```

### Full Schedule (Birleşik Görünüm)
```typescript
import {
  getInstitutionFullSchedule,
  getTeacherWeeklySchedule
} from './lib/institutionScheduleApi';

// Kurum tam programı (tüm dersler + öğretmen kişisel programları)
const fullSchedule = await getInstitutionFullSchedule(institutionId);

// Öğretmen haftalık programı (dersleri + kişisel etkinlikleri)
const teacherSchedule = await getTeacherWeeklySchedule(teacherId, institutionId);
```

---

## Helper Fonksiyonlar

```typescript
import {
  getDayName,
  formatTime,
  checkScheduleConflict,
  getTimeSlots,
  getSubjectColors
} from './lib/institutionScheduleApi';

// Gün adı
getDayName(1); // 'Pazartesi'

// Saat formatı
formatTime('08:00:00'); // '08:00'

// Çakışma kontrolü
const hasConflict = checkScheduleConflict(existingEntries, newEntry);

// Saat dilimleri
const timeSlots = getTimeSlots(); // ['07:00', '07:30', '08:00', ...]

// Ders renkleri
const colors = getSubjectColors(); // { 'Matematik': '#3B82F6', ... }
```

---

## Özellikler

### 1. **Esnek Sınıf Yapısı**
- ✅ `12-A`, `12-B` (geleneksel)
- ✅ `12-Say-1`, `12-Say-2` (dal bazlı)
- ✅ `Mezun-TYT`, `Mezun-AYT` (mezunlar)
- ✅ `11-TM-2`, `10-MF-1` (özel kodlama)
- ✅ Her kurum kendi isimlendirmesini yapabilir

### 2. **Çakışma Kontrolü**
- Aynı gün, aynı saat diliminde çakışma engellenir
- Öğretmen kişisel programı ile kurum programı da kontrol edilir

### 3. **Renk Kodlama**
- Her ders için otomatik renk ataması
- Manuel renk seçimi de mevcut
- Kategori bazlı renk grupları (öğretmen kişisel programı için)

### 4. **Haftalık Grid Görünümü**
- 7 günlük grid (Pazartesi-Pazar)
- Saat bazlı timeline
- Responsive tasarım (mobil uyumlu)

### 5. **Filtreleme**
- Sınıf bazlı filtreleme (öğrenci için)
- Öğretmen bazlı filtreleme
- Gün bazlı filtreleme

---

## RLS Policies

### Kurum Yöneticisi
- ✅ Kendi kurumunun tüm ders programını yönetebilir
- ✅ Sınıf ekleyebilir/düzenleyebilir
- ✅ Öğretmen atayabilir

### Öğretmen
- ✅ Kurumun genel ders programını görüntüleyebilir (okuma)
- ✅ Kendi kişisel programını yönetebilir (CRUD)
- ✅ Başka öğretmenlerin kişisel programını göremez

### Öğrenci
- ✅ Kurumun genel ders programını görüntüleyebilir (okuma)
- ✅ Düzenleme/silme yapamaz

---

## Örnek Kullanım Senaryoları

### Senaryo 1: 12-A Sınıfı için Pazartesi Matematik Dersi

```typescript
await createScheduleEntry({
  institution_id: 'xxx',
  class_name: '12-A',
  subject: 'Matematik',
  teacher_id: 'teacher-uuid',
  classroom: 'A-101',
  day_of_week: 1,
  start_time: '08:00',
  end_time: '08:40',
  color: '#3B82F6',
  notes: 'Türev konusu işlenecek'
});
```

### Senaryo 2: Mezun Grubu için Fizik Dersi

```typescript
await createInstitutionClass({
  institution_id: 'xxx',
  class_name: 'Mezun-AYT',
  class_description: 'AYT Mezun Grubu',
  grade_level: 'Mezun',
  branch: 'Sayısal'
});

await createScheduleEntry({
  institution_id: 'xxx',
  class_name: 'Mezun-AYT',
  subject: 'Fizik',
  teacher_id: 'teacher-uuid',
  classroom: 'Lab-1',
  day_of_week: 3,
  start_time: '10:00',
  end_time: '11:30',
  color: '#8B5CF6'
});
```

### Senaryo 3: Öğretmen Kişisel Toplantı

```typescript
await createTeacherPersonalSchedule({
  teacher_id: 'teacher-uuid',
  institution_id: 'xxx',
  title: 'Öğretmenler Kurulu Toplantısı',
  description: 'Aylık rutin toplantı',
  day_of_week: 5,
  start_time: '15:00',
  end_time: '16:00',
  location: 'Toplantı Salonu',
  category: 'meeting',
  color: '#F59E0B'
});
```

---

## Entegrasyon Adımları

### 1. Migration'ı Uygula
```bash
npx supabase db push
```

### 2. InstitutionDashboard'a Ekle

```tsx
// InstitutionDashboard.tsx içinde yeni tab ekle
const tabs = [
  // ... mevcut tablar
  { key: 'schedule', label: 'Ders Programı', icon: Calendar }
];

// Tab render
{activeTab === 'schedule' && (
  <InstitutionScheduleManagement
    institutionId={institutionId}
    teachers={teachers}
  />
)}
```

### 3. TeacherDashboard'a Ekle

```tsx
// TeacherDashboard.tsx içinde yeni tab ekle
{activeTab === 'schedule' && (
  <TeacherScheduleView
    teacherId={teacherId}
    institutionId={institutionId}
  />
)}
```

### 4. InstitutionStudentPortal'a Ekle

```tsx
// InstitutionStudentPortal.tsx içinde yeni tab ekle
{activeTab === 'schedule' && (
  <StudentScheduleView
    institutionId={institutionId}
    studentClassName={studentClass}
  />
)}
```

---

## Gelecek İyileştirmeler (Opsiyonel)

- [ ] PDF export (ders programını PDF olarak indir)
- [ ] Excel export
- [ ] iCal/Google Calendar entegrasyonu
- [ ] Tekrar eden dersler (2 haftada bir vs)
- [ ] Tatil/özel günler yönetimi
- [ ] Derslik kapasite kontrolü
- [ ] Öğretmen yük analizi (haftalık ders saati)
- [ ] Mobil uygulama entegrasyonu
- [ ] Bildirimler (dersten önce hatırlatma)

---

## Dosya Yapısı

```
/supabase/migrations/
  └── 20251118160000_institution_schedule_system.sql

/src/lib/
  └── institutionScheduleApi.ts

/src/components/
  ├── InstitutionScheduleManagement.tsx   (Kurum yöneticisi)
  ├── TeacherScheduleView.tsx             (Öğretmen)
  └── StudentScheduleView.tsx             (Öğrenci)
```

---

## Test Checklist

- [ ] Kurum yöneticisi sınıf ekleyebiliyor
- [ ] Kurum yöneticisi ders ekleyebiliyor
- [ ] Çakışma kontrolü çalışıyor
- [ ] Öğretmen kurum programını görebiliyor
- [ ] Öğretmen kişisel etkinlik ekleyebiliyor
- [ ] Öğrenci kurum programını görebiliyor
- [ ] Öğrenci sınıf bazlı filtreleyebiliyor
- [ ] Renk kodlama doğru çalışıyor
- [ ] Haftalık grid doğru gösteriliyor
- [ ] RLS policies doğru çalışıyor

---

Artık kurumların tamamen esnek, kendi ihtiyaçlarına göre şekillendirebilecekleri kapsamlı bir ders programı sistemleri var! 🎉

# State Management Guide

Bu projede **Context API** kullanarak global state yönetimi yapıyoruz. Tüm context'ler merkezi bir yerde organize edilmiş ve kolayca kullanılabilir hale getirilmiştir.

## 📁 Context Yapısı

```
src/contexts/
├── AppProviders.tsx        # Tüm provider'ları toplar
├── AuthContext.tsx         # Kullanıcı oturum yönetimi
├── StudentContext.tsx      # Öğrenci profil, abonelik, puanlar
├── InstitutionContext.tsx  # Kurum bilgileri, öğrenciler, öğretmenler
├── ExamContext.tsx         # Sınav şablonları ve sonuçları (cache)
├── NotificationContext.tsx # Global bildirimler (toast)
├── ThemeContext.tsx        # Tema (dark/light mode)
├── PomodoroContext.tsx     # Pomodoro zamanlayıcı
└── ParentSessionContext.tsx # Veli oturum bilgisi
```

## 🎯 Kullanım

### 1. Hook'ları Import Et

```typescript
import {
  useAuth,
  useStudent,
  useInstitution,
  useExam,
  useNotification
} from '../contexts/AppProviders';
```

### 2. Component'te Kullan

```typescript
function MyComponent() {
  const { user, loading } = useAuth();
  const { profile, subscription } = useStudent();
  const { success, error } = useNotification();

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div>
      <h1>Hoş geldin {profile?.full_name}</h1>
      <p>Abonelik: {subscription?.plan}</p>
      <button onClick={() => success('İşlem başarılı!')}>
        Test
      </button>
    </div>
  );
}
```

## 📚 Context Detayları

### AuthContext
Kullanıcı oturum yönetimi için.

```typescript
const {
  user,           // Mevcut kullanıcı
  loading,        // Yüklenme durumu
  login,          // Giriş yap
  logout,         // Çıkış yap
  refreshSession  // Oturumu yenile
} = useAuth();
```

**Kullanıcı Tipleri:**
- `student` - Öğrenci
- `parent` - Veli
- `teacher` - Öğretmen
- `institution` - Kurum

### StudentContext
Öğrenci bilgileri için (sadece öğrenci kullanıcılar için).

```typescript
const {
  profile,         // Öğrenci profili
  subscription,    // Abonelik bilgisi
  points,          // Puan ve başarımlar
  loading,
  refreshProfile,  // Profili yenile
  updateProfile,   // Profili güncelle
  addPoints        // Puan ekle
} = useStudent();
```

**Örnek:**
```typescript
// Profil güncelle
await updateProfile({
  target_exam: 'TYT',
  target_university: 'Boğaziçi Üniversitesi'
});

// Puan ekle
await addPoints(50, 'Deneme sınavı tamamlandı');
```

### InstitutionContext
Kurum bilgileri için (sadece kurum kullanıcılar için).

```typescript
const {
  institution,     // Kurum bilgileri
  students,        // Öğrenci listesi
  teachers,        // Öğretmen listesi
  loading,
  approveStudent,  // Öğrenci onayla
  rejectStudent,   // Öğrenci reddet
  addTeacher,      // Öğretmen ekle
  removeTeacher    // Öğretmen çıkar
} = useInstitution();
```

**Örnek:**
```typescript
// Öğrenci onayla
await approveStudent(userId);

// Öğretmen ekle
await addTeacher({
  full_name: 'Ahmet Yılmaz',
  email: 'ahmet@example.com',
  subject: 'Matematik'
});
```

### ExamContext
Sınav şablonları ve sonuçları için (cache ile).

```typescript
const {
  templates,        // Sınav şablonları
  results,          // Sınav sonuçları
  templatesLoading,
  resultsLoading,
  loadTemplates,    // Şablonları yükle
  loadResults,      // Sonuçları yükle
  createTemplate,   // Şablon oluştur
  createResult,     // Sonuç ekle
  getTemplate,      // ID ile şablon al
  getResult,        // ID ile sonuç al
  clearCache        // Cache'i temizle
} = useExam();
```

**Örnek:**
```typescript
// Şablonları yükle (cache kullanır)
await loadTemplates(institutionId);

// Belirli bir şablonu al (cache'ten)
const template = getTemplate(templateId);

// Yeni şablon oluştur
const newTemplate = await createTemplate({
  name: '2025 TYT Denemesi',
  exam_type: 'TYT',
  total_questions: 120,
  duration_minutes: 135
});
```

### NotificationContext
Global bildirimler (toast) için.

```typescript
const {
  success,   // Başarı mesajı
  error,     // Hata mesajı
  info,      // Bilgi mesajı
  warning    // Uyarı mesajı
} = useNotification();
```

**Örnek:**
```typescript
// Basit kullanım
success('Kayıt başarılı!');
error('Bir hata oluştu!');

// Detaylı mesaj
success('İşlem tamamlandı', 'Verileriniz başarıyla kaydedildi.');

// Özel action ile
showNotification({
  type: 'info',
  title: 'Yeni güncelleme',
  message: 'Uygulamanın yeni versiyonu mevcut',
  action: {
    label: 'Güncelle',
    onClick: () => window.location.reload()
  }
});
```

## 🚀 Avantajlar

### ✅ Prop Drilling Yok
```typescript
// ❌ Eskiden (Prop Drilling)
<Dashboard>
  <Header user={user} />
  <Sidebar user={user} subscription={subscription} />
  <Content user={user} subscription={subscription} />
</Dashboard>

// ✅ Şimdi (Context)
<Dashboard>
  <Header />  {/* useAuth() ile user bilgisine eriş */}
  <Sidebar /> {/* useStudent() ile subscription bilgisine eriş */}
  <Content /> {/* Her component kendi ihtiyacı olan context'i kullanır */}
</Dashboard>
```

### ✅ Global State Senkronizasyonu
Bir yerde yapılan değişiklik otomatik olarak tüm component'lere yansır:

```typescript
function Profile() {
  const { profile, updateProfile } = useStudent();

  const handleUpdate = async () => {
    await updateProfile({ full_name: 'Yeni İsim' });
    // Tüm uygulama boyunca profile.full_name otomatik güncellenir!
  };
}
```

### ✅ Cache Mekanizması
ExamContext sık kullanılan verileri cache'leyerek performansı artırır:

```typescript
// İlk çağrı - Veritabanından yükler
await loadTemplates(institutionId);

// İkinci çağrı - Cache'ten döner (hızlı!)
await loadTemplates(institutionId);

// Cache'i temizle
clearCache();
```

### ✅ Type Safety
Tüm context'ler TypeScript ile tip güvenliği sağlar:

```typescript
const { profile } = useStudent();

// ✅ TypeScript autocomplete ile kullanım
profile?.full_name
profile?.target_exam

// ❌ Yanlış property kullanımında hata
profile?.invalid_field // TypeScript hatası!
```

## 📝 Best Practices

### 1. Sadece İhtiyacınız Olanı Kullanın

```typescript
// ✅ İyi
const { user } = useAuth();

// ❌ Kötü - Gereksiz destructuring
const { user, login, logout, refreshSession } = useAuth();
```

### 2. Loading State'leri Kontrol Edin

```typescript
const { profile, loading } = useStudent();

if (loading) {
  return <LoadingSpinner />;
}

if (!profile) {
  return <div>Profil bulunamadı</div>;
}

return <div>{profile.full_name}</div>;
```

### 3. Error Handling Yapın

```typescript
const { updateProfile } = useStudent();
const { error: showError } = useNotification();

const handleUpdate = async () => {
  try {
    await updateProfile({ full_name: 'Yeni İsim' });
    success('Profil güncellendi');
  } catch (err) {
    showError('Güncelleme başarısız', err.message);
  }
};
```

### 4. Conditional Rendering Kullanın

```typescript
const { user } = useAuth();
const { institution } = useInstitution();

// Sadece kurum kullanıcıları için
if (user?.userType === 'institution' && institution) {
  return <InstitutionDashboard />;
}

// Sadece öğrenci kullanıcıları için
if (user?.userType === 'student') {
  return <StudentDashboard />;
}
```

## 🔧 Yeni Context Ekleme

1. Context dosyasını oluştur: `src/contexts/MyContext.tsx`
2. `AppProviders.tsx`'e ekle
3. Export et
4. Kullan!

```typescript
// 1. MyContext.tsx
export function MyProvider({ children }) {
  const [data, setData] = useState(null);
  return (
    <MyContext.Provider value={{ data, setData }}>
      {children}
    </MyContext.Provider>
  );
}

export function useMyContext() {
  return useContext(MyContext);
}

// 2. AppProviders.tsx'te
export function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <MyProvider>  {/* Buraya ekle */}
        {children}
      </MyProvider>
    </ThemeProvider>
  );
}

// 3. Export et
export { useMyContext } from './MyContext';

// 4. Kullan!
const { data } = useMyContext();
```

## 🎨 Örnek Kullanım Senaryoları

### Senaryo 1: Profil Sayfası
```typescript
function ProfilePage() {
  const { profile, updateProfile, loading } = useStudent();
  const { success, error } = useNotification();

  const handleSubmit = async (data) => {
    try {
      await updateProfile(data);
      success('Profil güncellendi!');
    } catch (err) {
      error('Güncelleme başarısız', err.message);
    }
  };

  if (loading) return <Spinner />;

  return <ProfileForm profile={profile} onSubmit={handleSubmit} />;
}
```

### Senaryo 2: Kurum Öğrenci Listesi
```typescript
function StudentList() {
  const { students, approveStudent, loading } = useInstitution();
  const { success } = useNotification();

  const handleApprove = async (userId) => {
    await approveStudent(userId);
    success('Öğrenci onaylandı');
  };

  if (loading) return <Spinner />;

  return students.map(student => (
    <StudentCard
      key={student.user_id}
      student={student}
      onApprove={() => handleApprove(student.user_id)}
    />
  ));
}
```

### Senaryo 3: Sınav Sonuç Detayı
```typescript
function ExamResultDetail({ resultId }) {
  const { getResult, getTemplate } = useExam();

  const result = getResult(resultId);
  const template = result ? getTemplate(result.template_id) : null;

  if (!result || !template) {
    return <div>Sonuç bulunamadı</div>;
  }

  return (
    <div>
      <h1>{template.name}</h1>
      <p>Net: {result.net_score}</p>
      <p>Doğru: {result.correct_count}</p>
    </div>
  );
}
```

## 🎯 Sonuç

Artık projenizde:
- ✅ Prop drilling yok
- ✅ Global state senkron
- ✅ Type-safe kullanım
- ✅ Performans optimizasyonu (cache)
- ✅ Kolay debugging
- ✅ Tutarlı veri akışı

Tüm component'ler birbirleriyle tutarlı çalışır ve veri merkezi olarak yönetilir!

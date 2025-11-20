# BasariYolu Mobile App

React Native mobil uygulaması - Expo ile geliştirilmiştir.

## 🚀 Özellikler

- ✅ **Öğrenci Paneli**: Sınav takibi, ödev yönetimi, ilerleme analizi
- ✅ **Veli Paneli**: Çocuk takibi, sınav sonuçları görüntüleme
- ✅ **Supabase Entegrasyonu**: Real-time database ve authentication
- ✅ **Dark Mode**: Otomatik tema desteği
- ✅ **Offline Ready**: AsyncStorage ile local data persistence
- ✅ **Modern UI**: NativeWind (Tailwind CSS) ile responsive tasarım

## 📦 Gereksinimler

- Node.js 18+
- npm veya yarn
- Expo CLI
- EAS CLI (Play Store build için)
- Android Studio (Android build için) veya Xcode (iOS build için)

## 🛠️ Kurulum

### 1. Bağımlılıkları Yükleyin

```bash
cd mobile
npm install
```

### 2. Environment Variables Ayarlayın

`.env` dosyası zaten oluşturulmuştur. Supabase URL ve Anon Key değerlerini kontrol edin:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xsgbtofqgcmbtncinyzn.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

## 🏃 Geliştirme Modu

### Expo Go ile Test (En Hızlı)

1. **Expo Go** uygulamasını telefonunuza indirin:
   - [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS](https://apps.apple.com/app/expo-go/id982107779)

2. Development server'ı başlatın:

```bash
npx expo start
```

3. QR kodu telefonunuzda Expo Go ile taratın

### Android Emulator ile Test

1. Android Studio'yu açın ve bir emulator başlatın

2. Development server'ı başlatın ve 'a' tuşuna basın:

```bash
npx expo start
# Sonra 'a' tuşuna basın
```

### iOS Simulator ile Test (Sadece macOS)

1. Xcode'u açın

2. Development server'ı başlatın ve 'i' tuşuna basın:

```bash
npx expo start
# Sonra 'i' tuşuna basın
```

## 📱 Build Alma (Play Store için)

### 1. EAS CLI ile Giriş Yapın

```bash
eas login
```

### 2. Preview Build (APK - Internal Testing)

Hızlı test için APK oluşturun:

```bash
eas build --profile preview --platform android
```

Bu komut:
- APK dosyası oluşturur
- EAS'a yükler
- Download linki verir
- APK'yı telefonunuza indirip yükleyebilirsiniz

### 3. Production Build (AAB - Play Store)

Play Store'a yüklemek için AAB oluşturun:

```bash
eas build --profile production --platform android
```

### 4. Play Store'a Yükleme

#### A. Manuel Yükleme

1. Build tamamlandıkında EAS'tan AAB dosyasını indirin
2. [Google Play Console](https://play.google.com/console)'a gidin
3. "Create app" ile yeni uygulama oluşturun
4. "Production" > "Create new release"
5. AAB dosyasını yükleyin
6. App details, screenshots vb. ekleyin
7. Review'a gönderin

#### B. EAS Submit ile Otomatik (Gelecekte)

İlk yüklemeden sonra otomatik yükleme için:

1. Google Play Service Account oluşturun
2. `google-service-account.json` dosyasını mobile klasörüne ekleyin
3. Otomatik submit:

```bash
eas submit --platform android
```

## 🧪 Test Kullanıcıları

Uygulamayı test etmek için web versiyonundan hesap oluşturabilir veya:

**Öğrenci:**
- Email: test@student.com
- Password: test123

**Veli:**
- Email: test@parent.com
- Password: test123

## 📂 Proje Yapısı

```
mobile/
├── src/
│   ├── components/       # Reusable components
│   ├── contexts/         # React contexts (Auth, Theme, etc.)
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Supabase client, utilities
│   ├── navigation/       # Navigation setup
│   ├── screens/          # Screen components
│   ├── types/            # TypeScript types
│   └── utils/            # Helper functions
├── assets/               # Images, fonts, etc.
├── App.tsx               # App entry point
├── app.json              # Expo config
├── eas.json              # EAS Build config
├── .env                  # Environment variables
└── package.json          # Dependencies
```

## 🎨 Ekran Yapısı

### Auth Stack (Giriş yapmamış kullanıcılar)
- `HomeScreen`: Landing page
- `LoginScreen`: Giriş ekranı
- `RegisterScreen`: Kayıt ekranı

### Main Stack (Giriş yapmış kullanıcılar)

#### Öğrenci:
- `StudentDashboardScreen` (Tab Navigator):
  - Anasayfa: İstatistikler, son sınavlar
  - Sınavlar: Tüm sınavlar, filtreleme
  - Ödevler: Ödev listesi, tamamlama
  - Profil: Kullanıcı bilgileri
- `ExamFormScreen`: Sınav ekleme/düzenleme
- `HomeworkFormScreen`: Ödev ekleme/düzenleme

#### Veli:
- `ParentDashboardScreen`:
  - Çocuk seçimi
  - İstatistikler
  - Sınav sonuçları
  - Ödev takibi

## 🔧 Sorun Giderme

### Build Hataları

**"Metro bundler hatası"**
```bash
npx expo start --clear
```

**"Dependencies hatası"**
```bash
rm -rf node_modules package-lock.json
npm install
```

**"EAS build hatası"**
```bash
eas build:configure
```

### Supabase Bağlantı Hatası

1. `.env` dosyasının doğru konumda olduğundan emin olun
2. Environment variables'ı kontrol edin
3. Supabase projesinin aktif olduğunu doğrulayın

### Navigation Hatası

NavigationContainer içinde `useNavigation` kullandığınızdan emin olun.

## 📝 Notlar

- **Bundle Identifier**: `com.basariyolu.app`
- **App Name**: BasariYolu
- **Minimum Android Version**: API 21 (Android 5.0)
- **Target Android Version**: API 34 (Android 14)

## 🚦 Sonraki Adımlar

1. ✅ Proje oluşturuldu
2. ✅ Temel ekranlar hazır
3. ✅ Supabase entegrasyonu tamam
4. ⏳ Play Store'da test etme
5. ⏳ Icon ve splash screen güncelleme
6. ⏳ Screenshots hazırlama
7. ⏳ Store listing hazırlama
8. ⏳ Production release

## 📞 Destek

Sorularınız için: [GitHub Issues](https://github.com/BurakGuven1/BasariYolu/issues)

## 📄 Lisans

Tüm hakları saklıdır © 2025 BasariYolu

# Başarı Yolu Mobile

React Native (Expo olmadan) ile geliştirilmiş Başarı Yolu mobil uygulaması.

## 🚀 Özellikler

- ✅ Kullanıcı kimlik doğrulama (Öğrenci, Veli, Öğretmen, Kurum)
- ✅ Supabase entegrasyonu
- ✅ AsyncStorage ile session yönetimi
- ✅ React Navigation ile sayfa yönlendirme
- ✅ TypeScript desteği
- ✅ iOS ve Android desteği

## 📋 Gereksinimler

### Genel
- Node.js 18+
- npm veya yarn
- Git

### Android için
- Android Studio
- Android SDK (API Level 23+)
- JDK 17+

### iOS için (sadece macOS)
- Xcode 14+
- CocoaPods
- iOS 13.4+

## 🛠️ Kurulum

### 1. Bağımlılıkları Yükleyin

```bash
cd mobile
npm install
```

### 2. Environment Variables

`.env` dosyası oluşturun:

```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin ve Supabase bilgilerinizi ekleyin:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
BACKEND_URL=http://localhost:8000
```

### 3. iOS Kurulumu (sadece macOS)

```bash
cd ios
pod install
cd ..
```

### 4. Android Kurulumu

Android Studio'yu açın ve SDK'nın yüklü olduğundan emin olun.

## 🏃 Uygulamayı Çalıştırma

### Metro Bundler'ı Başlatın

```bash
npm start
```

### Android'de Çalıştırma

Yeni bir terminal açın:

```bash
npm run android
```

### iOS'ta Çalıştırma (sadece macOS)

Yeni bir terminal açın:

```bash
npm run ios
```

## 📱 Uygulama Yapısı

```
mobile/
├── android/              # Android native code
├── ios/                  # iOS native code
├── src/
│   ├── components/       # Reusable components
│   ├── contexts/         # React contexts (Auth, etc.)
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Libraries (Supabase, etc.)
│   ├── navigation/       # Navigation setup
│   ├── screens/          # App screens
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   └── App.tsx           # Main app component
├── .env                  # Environment variables
├── index.js              # Entry point
└── package.json          # Dependencies
```

## 🔐 Authentication

Uygulama 4 farklı kullanıcı tipini destekler:

1. **Öğrenci**: Sınav sonuçları, ödevler, çalışma planları
2. **Veli**: Bağlı öğrencilerin takibi
3. **Öğretmen**: Sınıf yönetimi, ödev verme
4. **Kurum**: Kapsamlı yönetim paneli

## 📦 Kullanılan Ana Kütüphaneler

- `react-native`: 0.76.5
- `@react-navigation/native`: Navigation
- `@supabase/supabase-js`: Backend & Auth
- `@react-native-async-storage/async-storage`: Local storage
- `react-native-vector-icons`: Icons
- `react-native-dotenv`: Environment variables

## 🔧 Build

### Android APK

```bash
cd android
./gradlew assembleRelease
```

APK dosyası: `android/app/build/outputs/apk/release/app-release.apk`

### iOS App

Xcode'da projeyi açın ve Archive yapın:

```bash
cd ios
open BasariYoluMobile.xcworkspace
```

## 🐛 Sorun Giderme

### Metro Bundler Hatası

```bash
npm start -- --reset-cache
```

### Android Build Hatası

```bash
cd android
./gradlew clean
cd ..
npm run android
```

### iOS Build Hatası

```bash
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

### Port Zaten Kullanımda

```bash
npx react-native start --port 8082
```

## 📝 Geliştirme Notları

- Web versiyonundan tüm core fonksiyonaliteler taşındı
- AsyncStorage kullanarak offline-first yaklaşım
- Supabase real-time subscriptions destekleniyor
- TypeScript ile tip güvenliği sağlandı

## 🚧 Yakında Eklenecekler

- [ ] Pomodoro Timer
- [ ] AI Chat Panel
- [ ] Soru Bankası
- [ ] Parent & Teacher Dashboards (detaylı)
- [ ] Institution Dashboard
- [ ] Push Notifications
- [ ] Offline Mode
- [ ] Dark Mode

## 📄 Lisans

Bu proje Başarı Yolu için geliştirilmiştir.

## 👨‍💻 Geliştirici

BasariYolu Ekibi

---

**Not**: Bu proje Expo kullanmadan, vanilla React Native CLI ile geliştirilmiştir. Bu sayede native modüllere tam erişim ve daha iyi performans sağlanmıştır.

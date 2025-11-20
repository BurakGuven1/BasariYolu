# BasariYolu Mobile App 📱

React Native mobil uygulama - Yapay Zeka Destekli Sınav Hazırlık Platformu

## 🎯 Özellikler

- ✅ **React Native + Expo** - Cross-platform (iOS + Android)
- ✅ **Supabase Auth** - Güvenli kimlik doğrulama
- ✅ **React Navigation** - Native navigation
- ✅ **In-App Purchase (IAP)** - Google Play Billing entegrasyonu
- ✅ **%15 Vergi Avantajı** - Türkiye GVK 20/6 madde avantajı

## 📦 Kurulum

```bash
# Paketleri kur
npm install

# Environment variables'ı ayarla
cp .env.example .env
# .env dosyasını düzenle ve Supabase credential'larını ekle
```

## 🚀 Çalıştırma

```bash
# Development server başlat
npx expo start

# Android emulator'de çalıştır
npx expo run:android

# iOS simulator'de çalıştır (macOS gerekli)
npx expo run:ios
```

## 📱 Build (Production)

### EAS Build ile (Önerilen)

```bash
# EAS CLI kur
npm install -g eas-cli

# EAS'a giriş yap
eas login

# EAS projesini yapılandır
eas build:configure

# Android APK build et
eas build --platform android --profile preview

# Production AAB build et (Google Play için)
eas build --platform android --profile production

# iOS build et (Apple Developer hesabı gerekli)
eas build --platform ios --profile production
```

### Local Build

```bash
# Android APK (Development)
npx expo run:android --variant release

# Production build için android/ klasöründe:
cd android
./gradlew assembleRelease
```

## 🔑 Environment Variables

`.env` dosyasında gerekli değişkenler:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google Play IAP Product IDs
EXPO_PUBLIC_IAP_BASIC_MONTHLY=basariyolu_basic_monthly
EXPO_PUBLIC_IAP_BASIC_YEARLY=basariyolu_basic_yearly
EXPO_PUBLIC_IAP_PREMIUM_MONTHLY=basariyolu_premium_monthly
EXPO_PUBLIC_IAP_PREMIUM_YEARLY=basariyolu_premium_yearly
```

## 💰 In-App Purchase Setup

### 1. Google Play Console'da Ürün Oluşturma

1. [Google Play Console](https://play.google.com/console)'a giriş yap
2. Uygulamanı seç > **Monetization** > **In-app products**
3. **Create product** tıkla
4. Product ID'leri gir:
   - `basariyolu_basic_monthly`
   - `basariyolu_basic_yearly`
   - `basariyolu_premium_monthly`
   - `basariyolu_premium_yearly`

5. Her ürün için:
   - Name: "BasariYolu Basic Aylık"
   - Description: "Temel özellikler, aylık erişim"
   - Price: Fiyatı TL olarak belirle
   - Status: **Active** yap

### 2. Test Kullanıcıları Ekleme

1. Google Play Console > **Setup** > **License testing**
2. Test e-postalarını ekle
3. Test response: **PURCHASED** seç

### 3. App Bundle Upload

```bash
# Production AAB build et
eas build --platform android --profile production

# Build tamamlandığında download linki gelecek
# Bu .aab dosyasını Google Play Console'a yükle:
# Play Console > Production > Create new release > Upload
```

## 📊 Proje Yapısı

```
mobile/
├── App.tsx                 # Ana uygulama entry point
├── contexts/
│   └── AuthContext.tsx     # Authentication context
├── lib/
│   └── supabase.ts         # Supabase client config
├── navigation/
│   └── index.tsx           # Navigation yapısı
├── screens/
│   ├── LoginScreen.tsx     # Giriş ekranı
│   ├── RegisterScreen.tsx  # Kayıt ekranı
│   ├── DashboardScreen.tsx # Ana dashboard
│   ├── ProfileScreen.tsx   # Profil ekranı
│   └── SubscriptionScreen.tsx  # Abonelik + IAP
├── app.json                # Expo config
├── package.json            # Dependencies
└── .env                    # Environment variables (gitignore'da)
```

## 🔒 Güvenlik

- ✅ Supabase RLS (Row Level Security) aktif
- ✅ Environment variables `.env` dosyasında
- ✅ API keys asla hardcoded değil
- ✅ IAP receipt validation yapılıyor

## 🎨 UI/UX

- **Design System**: Custom StyleSheet (Tailwind benzeri renkler)
- **Colors**:
  - Primary: `#2563eb` (Blue 600)
  - Success: `#10b981` (Green 500)
  - Error: `#ef4444` (Red 500)
  - Gray scale: `#f9fafb` → `#1f2937`

## 📈 Vergi Avantajı

Türkiye'de mobil uygulama geliştiricilere özel vergi avantajı:

- **Web ödemesi**: %15-40 gelir vergisi
- **Mobil IAP ödemesi**: %15 sabit gelir vergisi (GVK 20/6)
- **Fark**: %25 vergi tasarrufu!

## 🚀 Deployment Checklist

### Google Play Store

- [ ] `app.json` > `android.package` değiştir
- [ ] `app.json` > `android.versionCode` artır
- [ ] Signing key oluştur (EAS otomatik yapıyor)
- [ ] Production AAB build et
- [ ] Play Console'a yükle
- [ ] IAP ürünlerini aktif et
- [ ] Internal/Closed testing başlat
- [ ] Open testing/Production'a al

### iOS App Store (İsteğe bağlı)

- [ ] Apple Developer hesabı ($99/yıl)
- [ ] `app.json` > `ios.bundleIdentifier` değiştir
- [ ] `app.json` > `ios.buildNumber` artır
- [ ] iOS build et
- [ ] App Store Connect'e yükle
- [ ] IAP ürünlerini aktif et
- [ ] TestFlight ile test et
- [ ] Review'a gönder

## 🛠️ Troubleshooting

### IAP çalışmıyor

```bash
# IAP modülünü yeniden kur
npm uninstall react-native-iap
npm install react-native-iap --legacy-peer-deps

# Android'de prebuild yap
npx expo prebuild --clean
```

### Build hatası

```bash
# Cache temizle
npx expo start --clear

# node_modules'u sil ve yeniden kur
rm -rf node_modules
npm install --legacy-peer-deps
```

### Supabase bağlantı hatası

- `.env` dosyasında `EXPO_PUBLIC_` prefix'i var mı kontrol et
- Supabase URL ve Key doğru mu?
- Internet bağlantısı var mı?

## 📞 Destek

Sorularınız için:
- Email: destek@basariyolum.com
- GitHub Issues: [BasariYolu/mobile](https://github.com/BurakGuven1/BasariYolu)

## 📝 Lisans

Tüm hakları saklıdır © 2025 BasariYolu

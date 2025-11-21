# Başarı Yolu Mobile - Detaylı Kurulum Rehberi

## 📚 İçindekiler
1. [Sistem Gereksinimleri](#sistem-gereksinimleri)
2. [Geliştirme Ortamı Kurulumu](#geliştirme-ortamı-kurulumu)
3. [Proje Kurulumu](#proje-kurulumu)
4. [Çalıştırma](#çalıştırma)
5. [Sorun Giderme](#sorun-giderme)

## Sistem Gereksinimleri

### Windows için

1. **Node.js ve npm**
   - Node.js 18 veya üzeri
   - İndirme linki: https://nodejs.org/

2. **Java Development Kit (JDK)**
   - JDK 17 gereklidir
   - İndirme linki: https://www.oracle.com/java/technologies/downloads/

3. **Android Studio**
   - En son sürüm
   - İndirme linki: https://developer.android.com/studio
   - Android SDK (API Level 23-34)
   - Android SDK Build-Tools 34.0.0
   - Android Emulator

4. **Chocolatey** (isteğe bağlı, paket yöneticisi)
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```

### macOS için

1. **Homebrew**
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Node.js**
   ```bash
   brew install node
   ```

3. **Watchman**
   ```bash
   brew install watchman
   ```

4. **CocoaPods** (iOS için)
   ```bash
   sudo gem install cocoapods
   ```

5. **Xcode** (iOS için)
   - Mac App Store'dan yükleyin
   - Command Line Tools: `xcode-select --install`

6. **Android Studio** (Android için)
   - https://developer.android.com/studio

### Linux için

1. **Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **JDK**
   ```bash
   sudo apt-get install openjdk-17-jdk
   ```

3. **Android Studio**
   - https://developer.android.com/studio

4. **Watchman**
   ```bash
   sudo apt-get install watchman
   ```

## Geliştirme Ortamı Kurulumu

### Android Studio Kurulumu

1. Android Studio'yu yükleyin
2. SDK Manager'ı açın (Tools > SDK Manager)
3. Şunları yükleyin:
   - Android SDK Platform 34
   - Android SDK Build-Tools 34.0.0
   - Android Emulator
   - Android SDK Platform-Tools

4. Environment Variables'ı ayarlayın:

**Windows:**
```
ANDROID_HOME = C:\Users\YourUsername\AppData\Local\Android\Sdk
Path += %ANDROID_HOME%\platform-tools
Path += %ANDROID_HOME%\emulator
Path += %ANDROID_HOME%\tools
Path += %ANDROID_HOME%\tools\bin
```

**macOS/Linux:**
```bash
# ~/.bash_profile veya ~/.zshrc
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### iOS Kurulumu (sadece macOS)

1. Xcode'u yükleyin
2. Command Line Tools'u yükleyin:
   ```bash
   xcode-select --install
   ```

3. CocoaPods'u yükleyin:
   ```bash
   sudo gem install cocoapods
   ```

## Proje Kurulumu

### 1. Repository'yi klonlayın

```bash
git clone https://github.com/BurakGuven1/BasariYolu.git
cd BasariYolu/mobile
```

### 2. Bağımlılıkları yükleyin

```bash
npm install
```

### 3. Environment Variables

`.env` dosyasını oluşturun:

```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
BACKEND_URL=http://localhost:8000
```

### 4. iOS için (sadece macOS)

```bash
cd ios
pod install
cd ..
```

### 5. Android için

Android Studio'da `mobile/android` klasörünü açın ve Gradle sync'i bekleyin.

## Çalıştırma

### Metro Bundler'ı başlatın

```bash
npm start
```

### Android

**Emulator ile:**

1. Android Studio'da AVD Manager'ı açın
2. Bir emulator başlatın
3. Yeni terminal:
   ```bash
   npm run android
   ```

**Gerçek cihaz ile:**

1. USB Debugging'i açın (Developer Options)
2. Cihazı bilgisayara bağlayın
3. `adb devices` ile kontrol edin
4. `npm run android` çalıştırın

### iOS (sadece macOS)

**Simulator ile:**

```bash
npm run ios
```

**Belirli bir simulator ile:**

```bash
npm run ios -- --simulator="iPhone 15 Pro"
```

**Gerçek cihaz ile:**

1. Xcode'da projeyi açın: `ios/BasariYoluMobile.xcworkspace`
2. Signing & Capabilities'de Apple ID'nizi ekleyin
3. Cihazınızı seçin ve Run yapın

## Build

### Android APK (Debug)

```bash
cd android
./gradlew assembleDebug
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`

### Android APK (Release)

1. Keystore oluşturun:
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. `android/gradle.properties` dosyasına ekleyin:
   ```
   MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
   MYAPP_RELEASE_KEY_ALIAS=my-key-alias
   MYAPP_RELEASE_STORE_PASSWORD=****
   MYAPP_RELEASE_KEY_PASSWORD=****
   ```

3. Build:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

APK: `android/app/build/outputs/apk/release/app-release.apk`

### iOS App (sadece macOS)

1. Xcode'da projeyi açın
2. Product > Archive
3. Distribute App

## Sorun Giderme

### Metro Bundler başlamıyor

```bash
# Port'u temizle
npx react-native start --reset-cache

# Farklı port kullan
npx react-native start --port 8082
```

### Android build hatası

```bash
# Clean build
cd android
./gradlew clean
cd ..

# Cache temizle
npm start -- --reset-cache

# node_modules temizle
rm -rf node_modules
npm install
```

### iOS build hatası

```bash
# Pods temizle
cd ios
pod deintegrate
rm -rf Pods Podfile.lock
pod install
cd ..

# DerivedData temizle
rm -rf ~/Library/Developer/Xcode/DerivedData
```

### "Unable to load script" hatası

1. Metro Bundler'ın çalıştığından emin olun
2. Cihaz/emulator'ün aynı ağda olduğundan emin olun
3. Firewall ayarlarını kontrol edin

### Android emulator yavaş

1. HAXM (Intel) veya Hypervisor (AMD) kullanın
2. AVD'ye daha fazla RAM verin
3. x86 image kullanın (ARM değil)

### iOS simulator yavaş

1. Disk alanını kontrol edin
2. Simulator'ü restart edin
3. Mac'i restart edin

## Faydalı Komutlar

```bash
# Tüm log'ları göster
npx react-native log-android  # Android
npx react-native log-ios       # iOS

# Android cihazları listele
adb devices

# iOS simulators listele
xcrun simctl list devices

# Paket boyutunu analiz et
npm run analyze

# TypeScript kontrol
npx tsc --noEmit

# Lint
npm run lint
```

## Ek Kaynaklar

- [React Native Docs](https://reactnative.dev/docs/environment-setup)
- [React Navigation](https://reactnavigation.org/)
- [Supabase Docs](https://supabase.com/docs)
- [Android Developer](https://developer.android.com/)
- [Apple Developer](https://developer.apple.com/)

## Destek

Sorun yaşarsanız:
1. GitHub Issues'da arayın
2. Yeni issue açın
3. Ekip ile iletişime geçin

---

**İyi geliştirmeler! 🚀**

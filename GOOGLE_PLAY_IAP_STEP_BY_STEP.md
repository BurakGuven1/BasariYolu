# Google Play In-App Purchase - Adım Adım Kurulum Rehberi

## ⚠️ ÖNEMLİ NOTLAR

- Bu rehberi **TAM SIRAYLA** takip edin
- Her adımı bitirmeden sonrakine geçmeyin
- Test yaparken **gerçek Android cihaz** kullanın (emulator IAP desteklemez)
- License test hesaplarıyla test edeceksiniz (gerçek ücret alınmayacak)

---

## ADIM 1: GOOGLE PLAY CONSOLE'DA IAP ÜRÜNLER OLUŞTUR

### 1.1. Play Console'a Giriş

1. **https://play.google.com/console** adresine git
2. BaşarıYolu uygulamanı seç

### 1.2. Para Kazanma Kurulumu

**Sol menü:** `Para kazanma > Para kazanma kurulumu`

Eğer daha önce yapmadıysan:
- Ödeme profili oluştur (banka bilgileri)
- Vergi bilgilerini gir (Türkiye için)
- Kaydet

### 1.3. Abonelik Ürünleri Oluşturma

**Sol menü:** `Para kazanma > Ürünler > Abonelikler`

**⚠️ ÖNEMLİ:** Google Play'de product ID'ler **paket isminden SONRA** gelir:

Bizim kod: `com.basariyolu.basic.monthly`
Google'da: `basic.monthly` (prefix otomatik ekleniyor)

---

### 📦 PAKET 1: Temel - Aylık

**"Abonelik oluştur" butonuna tıkla**

#### Ürün Bilgileri:
- **Ürün kimliği:** `basic_monthly`
- **Ad:** Temel Paket - Aylık
- **Açıklama:** Temel raporlar ve soru portalı. Aylık abonelik.

#### Base Plan Oluştur:
1. **"Base plan ekle"** butonuna tıkla
2. **Base plan ID:** `monthly`
3. **Faturalandırma süresi:** Her ay (Monthly)
4. **Fiyat ayarla:**
   - Türkiye: ₺99.00
   - (Diğer ülkeler otomatik hesaplanacak)
5. **Grace period:** 3 gün
6. **Kaydet**

#### Durumu Aktif Et:
- **"Aktive et"** butonuna tıkla

---

### 📦 PAKET 2: Temel - 6 Aylık

**"Abonelik oluştur"**

- **Ürün kimliği:** `basic_6months`
- **Ad:** Temel Paket - 6 Aylık
- **Açıklama:** Temel raporlar ve soru portalı. 6 aylık abonelik - %16 indirimli.

**Base plan:**
- **ID:** `6months`
- **Faturalandırma:** Her 6 ayda bir (Every 6 months)
- **Fiyat:** ₺499.00
- **Grace period:** 3 gün

**Aktive et**

---

### 📦 PAKET 3: Temel - Yıllık

- **Ürün kimliği:** `basic_yearly`
- **Ad:** Temel Paket - Yıllık
- **Açıklama:** Temel raporlar ve soru portalı. Yıllık abonelik - %24 indirimli.

**Base plan:**
- **ID:** `yearly`
- **Faturalandırma:** Her yıl (Every year)
- **Fiyat:** ₺899.00
- **Grace period:** 3 gün

**Aktive et**

---

### 📦 PAKET 4-9: Gelişmiş ve Profesyonel

Aynı şekilde devam et:

| Product ID | Ad | Base Plan ID | Fiyat | Süre |
|------------|-----|--------------|-------|------|
| `advanced_monthly` | Gelişmiş - Aylık | `monthly` | ₺199 | 1 ay |
| `advanced_6months` | Gelişmiş - 6 Aylık | `6months` | ₺999 | 6 ay |
| `advanced_yearly` | Gelişmiş - Yıllık | `yearly` | ₺1,799 | 1 yıl |
| `professional_monthly` | Profesyonel - Aylık | `monthly` | ₺399 | 1 ay |
| `professional_6months` | Profesyonel - 6 Aylık | `6months` | ₺1,999 | 6 ay |
| `professional_yearly` | Profesyonel - Yıllık | `yearly` | ₺3,599 | 1 yıl |

**HEPSİNİ AKTIVE ET!**

---

### 1.4. License Testing Ayarla

**Sol menü:** `Kurulum > Lisans testi`

**"Lisans testçileri" ekle:**
```
your-email@gmail.com
test-account@gmail.com
```

Bu hesaplar **ücretsiz test satın alımları** yapabilecek!

**KAYDET**

---

## ✅ ADIM 1 TAMAMLANDI

Google Play Console'da 9 abonelik ürünü oluşturuldu ve aktive edildi!

**Kontrol:**
- [ ] 9 ürün oluşturuldu
- [ ] Hepsi "Active" durumda
- [ ] License testing hesapları eklendi

---

## ADIM 2: REACT-NATIVE-IAP'I KODDA AKTİF ET

### 2.1. package.json'a IAP Ekle

**Dosya:** `mobile/package.json`

`dependencies` bölümüne ekle:

```json
"react-native-iap": "^12.15.5"
```

### 2.2. iapProducts.ts Product ID'lerini Güncelle

**Dosya:** `mobile/src/constants/iapProducts.ts`

Google Play'deki ürün ID'lerine göre güncelle:

```typescript
export const IAP_PRODUCT_IDS = {
  android: {
    basic_monthly: 'basic_monthly',      // Google Play'de oluşturduğun ID
    basic_6months: 'basic_6months',
    basic_yearly: 'basic_yearly',
    advanced_monthly: 'advanced_monthly',
    advanced_6months: 'advanced_6months',
    advanced_yearly: 'advanced_yearly',
    professional_monthly: 'professional_monthly',
    professional_6months: 'professional_6months',
    professional_yearly: 'professional_yearly',
  },
  ios: {
    // iOS için sonra ekleyeceğiz
    basic_monthly: 'com.basariyolu.basic.monthly',
    // ... diğerleri
  }
};
```

### 2.3. PackageSelectionScreen'i Aktif Et

**Dosya:** `mobile/App.tsx`

Comment'leri kaldır:

```typescript
// ÖNCE:
// import { PackageSelectionScreen } from './src/screens/PackageSelectionScreen';

// SONRA:
import { PackageSelectionScreen } from './src/screens/PackageSelectionScreen';

// VE:
// {/* TEMPORARY: Disabled...
// <Stack.Screen name="PackageSelection" .../>
// */}

// SONRA:
<Stack.Screen
  name="PackageSelection"
  component={PackageSelectionScreen}
  options={{ headerShown: true, title: 'Paket Seçimi' }}
/>
```

### 2.4. AuthScreen'de Package Selection'ı Aktif Et

**Dosya:** `mobile/src/screens/AuthScreen.tsx`

Comment'leri kaldır:

```typescript
// ÖNCE:
// TEMPORARY: Skip package selection...
// if (mode === 'register' && role === 'student') {
//   ...
// }

// SONRA:
// For student registration, navigate to package selection
if (mode === 'register' && role === 'student') {
  const { data: userResp } = await supabase.auth.getUser();
  const uid = userResp.user?.id;
  navigation.replace('PackageSelection', { userId: uid, userEmail: email });
  resetFields();
  return;
}
```

---

## ✅ ADIM 2 TAMAMLANDI

Kod değişiklikleri yapıldı!

---

## ADIM 3: DEPENDENCIES YÜKLE VE YENİ BUILD AL

### 3.1. Dependencies Yükle

```bash
cd D:\project\mobile

# IAP dahil tüm dependencies'i yükle
npm install
```

### 3.2. Yeni Build Al

```bash
# Internal testing için production build
eas build --platform android --profile production

# Sorular:
# Application ID: com.basariyolu
# Generate keystore: n (zaten var)
```

**⏱️ Bu build 15-20 dakika sürer.**

Build bitince `.aab` dosyasını indir!

---

## ADIM 4: AAB'Yİ PLAY CONSOLE'A YÜKLE

### 4.1. Internal Testing Track

**Sol menü:** `Sürümler > Internal testing`

**"Yeni sürüm oluştur"**

### 4.2. AAB Yükle

**"App bundle seç"** → İndirdiğin `.aab` dosyasını yükle

### 4.3. Sürüm Notları

```
İlk sürüm - IAP Entegreli

✨ Özellikler:
- Öğrenci kayıt ve giriş
- In-App Purchase (9 paket)
  - Temel: ₺99/₺499/₺899
  - Gelişmiş: ₺199/₺999/₺1799
  - Profesyonel: ₺399/₺1999/₺3599
- Soru bankası
- Performans takibi
- AI destekli analizler

📱 Test için license test hesaplarını kullanın
```

### 4.4. Test Kullanıcıları

**"Testçiler" sekmesi**

E-posta listesi oluştur:
```
your-email@gmail.com
team@example.com
```

**KAYDET**

### 4.5. Sürümü Yayınla

**"İnceleme için gönder"** butonuna tıkla

**⏱️ Google incelemesi: 1-3 gün**

---

## ADIM 5: TEST ETME (Sürüm Onaylandıktan Sonra)

### 5.1. Test Link'ini Al

Sürüm onaylanınca internal testing link alacaksın:
```
https://play.google.com/apps/internaltest/XXXXXXX
```

### 5.2. Android Cihazda Test

**Test cihazında:**

1. License testing'e eklediğin Google hesabıyla giriş yap
2. Test link'ine tıkla
3. "Testçi ol" butonuna bas
4. Play Store'dan uygulamayı indir
5. Uygulamayı aç

### 5.3. IAP Test Senaryosu

**Adımlar:**

1. **Öğrenci Kaydı Yap:**
   - Email: test hesabın
   - Şifre: test123456
   - Ad soyad, okul, sınıf bilgilerini gir
   - "Kayıt Ol" butonuna tıkla

2. **Paket Seçim Ekranı Açılacak:**
   - 9 paket görünmeli
   - Fiyatlar Google Play'den gelecek (gerçek fiyatlar)

3. **Bir Paket Seç:**
   - Örnek: "Gelişmiş - Yıllık" (₺1799)
   - "🛒 Paketi Satın Al" butonuna tıkla

4. **Google Play Satın Alma Ekranı:**
   - "Test satın alma" yazısı görünecek
   - **ÜCRETSİZ** (license test hesabı olduğu için)
   - "Satın Al" butonuna tıkla

5. **Receipt Validation:**
   - Arka planda Supabase Edge Function çağrılacak
   - Receipt doğrulanacak
   - Subscription aktive olacak

6. **Başarılı:**
   - "✅ Satın Alma Başarılı" mesajı
   - Dashboard'a yönlendirilecek
   - Paket aktif olacak

---

## ADIM 6: SORUN GİDERME

### Sorun 1: "Ürünler Görünmüyor"

**Çözüm:**
- Play Console'da ürünler "Active" mi kontrol et
- Internal testing'den indirdin mi? (Direkt APK olmaz!)
- License testing hesabı ile giriş yaptın mı?

### Sorun 2: "Satın Alma Başarısız"

**Çözüm:**
- Log'ları kontrol et: `adb logcat | grep -i iap`
- Edge function çalışıyor mu?
- Receipt validation ayarları doğru mu?

### Sorun 3: "Receipt Validation Hatası"

**Çözüm:**
- Supabase Edge Function deploy edildi mi?
- Environment variables ayarlandı mı?
- Google Service Account doğru mu?

---

## 📊 İLERLEME TAKIP

### ✅ Tamamlananlar:
- [x] Google Play Console'da 9 ürün oluştur
- [x] License testing ayarla
- [x] Kodda IAP'ı aktif et
- [x] Dependencies yükle
- [ ] Production build al
- [ ] AAB'yı Play Console'a yükle
- [ ] Internal testing'e yayınla
- [ ] Google incelemesini bekle
- [ ] Test et

### 🎯 Şu An Hangi Adımdasın?

**ADIM 1 bitti mi?** → 9 ürün Play Console'da oluşturuldu mu?

Hangi adımı tamamladın, söyle devam edelim!

---

## 🔥 HIZLI ÖZET

```bash
# 1. Google Play Console'da (Web):
#    - 9 abonelik ürünü oluştur
#    - License testing hesapları ekle

# 2. Kodda (VS Code):
#    - package.json'a IAP ekle
#    - App.tsx - PackageSelection aktif et
#    - AuthScreen.tsx - navigation aktif et

# 3. Terminal:
cd D:\project\mobile
npm install
eas build --platform android --profile production

# 4. Play Console'da:
#    - .aab yükle
#    - Internal testing'e yayınla

# 5. Test et!
```

---

**HANGİ ADIMDASIN? ŞİMDİ NE YAPMAK İSTİYORSUN?** 🚀

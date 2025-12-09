# Google Play Console - Sıfırdan Test'e Kadar Rehber

## 📱 BaşarıYolu Uygulaması için Tam Kurulum

---

## ⚠️ BAŞLAMADAN ÖNCE

### Gereken Bilgiler:
- **Package Name:** `com.basariyolu` (değiştirme!)
- **App Name:** BaşarıYolu
- **Expo Account:** Hazır olmalı
- **Google Play Developer Account:** $25 ödendi mi? ✅

---

## ADIM 1: EAS BUILD KURULUMU (Mobil Klasöründe)

### 1.1. EAS CLI Kurulumu

```bash
cd mobile

# EAS CLI global olarak yükle
npm install -g eas-cli

# Expo'ya login
eas login
# Email ve şifrenizi girin

# Doğrulama
eas whoami
```

### 1.2. EAS Build Yapılandırması

```bash
# EAS build config oluştur
eas build:configure
```

Bu komut `eas.json` dosyası oluşturacak. Şimdi düzenleyelim:

**`mobile/eas.json` dosyası:**

```json
{
  "cli": {
    "version": ">= 5.9.1"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "gradleCommand": ":app:assembleDebug"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    },
    "production-apk": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### 1.3. app.json Güncellemesi

**`mobile/app.json` düzenle:**

```json
{
  "expo": {
    "name": "BaşarıYolu",
    "slug": "basariyolu",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "android": {
      "package": "com.basariyolu",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ]
    },
    "extra": {
      "eas": {
        "projectId": "YOUR_PROJECT_ID_HERE"
      }
    },
    "plugins": [
      "react-native-iap"
    ]
  }
}
```

**ÖNEMLI:** `YOUR_PROJECT_ID_HERE` yerine gerçek project ID gelecek (EAS otomatik ekler).

### 1.4. İlk Build'i Çalıştır

```bash
# Android AAB (Play Store için)
eas build --platform android --profile production

# Sorular gelecek:
# - Generate a new Android Keystore? → YES
# - Would you like to set up Push Notifications? → NO (şimdilik)
```

**⏱️ Bu işlem 10-15 dakika sürer.** Build tamamlanınca link gelecek:

```
✔ Build complete!
https://expo.dev/accounts/YOUR_ACCOUNT/projects/basariyolu/builds/BUILD_ID

Download: https://expo.dev/artifacts/BUILD_ARTIFACT
```

Build bittikten sonra `.aab` dosyasını indir:

```bash
# Build artifactı indir (link gelecek)
# Veya direkt EAS dashboard'dan indir
```

---

## ADIM 2: GOOGLE PLAY CONSOLE'DA UYGULAMA OLUŞTURMA

### 2.1. Yeni Uygulama Oluştur

1. **Google Play Console'a git:** https://play.google.com/console
2. **"Uygulama oluştur"** butonuna tıkla

#### Form Doldur:

| Alan | Değer |
|------|-------|
| **Uygulama adı** | BaşarıYolu |
| **Varsayılan dil** | Türkçe (Türkiye) |
| **Uygulama veya oyun** | Uygulama |
| **Ücretsiz veya ücretli** | Ücretsiz |

3. **Beyanlar:**
   - ✅ Geliştirici Program Politikalarını kabul ediyorum
   - ✅ ABD ihracat yasalarına uyuyorum

4. **"Uygulama oluştur"** → Tamamla

### 2.2. Uygulama Kontrol Paneli

Artık dashboard'dayız. Sol menüde göreceksin:

```
🏠 Gösterge Tablosu
📱 Sürümler
├── Production
├── Open testing
├── Closed testing
└── Internal testing (BU ÖNEMLİ!)
💰 Para kazanma
├── Ürünler (IAP burada!)
├── Abonelikler
```

---

## ADIM 3: UYGULAMA BİLGİLERİNİ DOLDUR

### 3.1. Mağaza Bilgileri (Store Listing)

**Sol menü:** `Hazırlık > Ana mağaza bilgileri`

#### Uygulama Ayrıntıları:

**Uygulama Adı:**
```
BaşarıYolu
```

**Kısa Açıklama (80 karakter):**
```
Öğrenciler için yapay zeka destekli kişiselleştirilmiş eğitim platformu
```

**Tam Açıklama (4000 karakter):**
```
BaşarıYolu, öğrencilerin akademik başarılarını artırmak için tasarlanmış kapsamlı bir eğitim yönetim sistemidir.

✨ ÖNE ÇIKAN ÖZELLİKLER:

📚 Soru Bankası ve Deneme Sistemi
• Binlerce soru ile pratik yapın
• Gerçek deneme sınavları
• Detaylı performans analizi
• Konu bazlı çalışma

🤖 Yapay Zeka Desteği
• AI-powered soru çözümü
• Kişiselleştirilmiş çalışma planı
• Akıllı konu önerileri
• Fotoğraftan soru tarama

📊 Performans Takibi
• Detaylı analiz grafikleri
• Güçlü/zayıf konular
• İlerleme raporları
• Hedef belirleme

👨‍🏫 Öğretmen ve Kurum Entegrasyonu
• Öğretmenlerle doğrudan iletişim
• Kurum yönetim sistemi
• Sınıf performans analizi
• Ödev ve sınav takibi

👪 Veli Takip Sistemi
• Öğrenci ilerlemesini görüntüle
• Devamsızlık bildirimleri
• Performans raporları
• E-posta/SMS bildirimleri

⏰ Pomodoro Tekniği
• Verimli çalışma seansları
• Mola yönetimi
• Zamanlayıcı

🎯 Hedef ve Motivasyon
• Günlük/haftalık hedefler
• Başarı rozetleri
• İlerleme takibi

💼 PAKETLER:

Temel, Gelişmiş ve Profesyonel paketlerimizle ihtiyacınıza uygun çözümler sunuyoruz. Tüm özellikler web tarayıcıda kullanılabilir.

🔒 GÜVENLİK:
Verileriniz güvenli sunucularda saklanır ve KVKK'ya uygun işlenir.

📞 DESTEK:
destek@basariyolum.com
```

#### Uygulama Simgesi:
- **Gerekli:** 512x512 PNG (Alpha channel olmadan)
- Logonuzu yükleyin

#### Ekran Görüntüleri:

**Telefon (GEREKLİ - en az 2 tane):**
- Boyut: 1080x1920 veya 1080x2340
- Format: PNG veya JPG

**7-inç Tablet (Opsiyonel):**
- İsterseniz ekleyin

**10-inç Tablet (Opsiyonel):**
- İsterseniz ekleyin

**🎬 Tanıtım videosu URL (Opsiyonel):**
```
https://www.youtube.com/watch?v=YOUR_VIDEO_ID
```

#### Grafik varlık (Feature Graphic):
- **Boyut:** 1024x500 PNG/JPG
- Banner görsel (zorunlu)

### 3.2. Kategori ve İletişim

**Uygulama Kategorisi:**
- **Kategori:** Eğitim
- **Alt Kategori:** Eğitim

**E-posta:**
```
destek@basariyolum.com
```

**Telefon (Opsiyonel):**
```
+90 XXX XXX XX XX
```

**Web Sitesi:**
```
https://www.basariyolum.com
```

**Gizlilik Politikası URL (ZORUNLU):**
```
https://www.basariyolum.com/privacy-policy
```

**KAYDET** butonuna tıkla.

---

## ADIM 4: UYGULAMA İÇERİĞİ (App Content)

### 4.1. Gizlilik Politikası

**Sol menü:** `Politika > Uygulama içeriği > Gizlilik politikası`

```
https://www.basariyolum.com/privacy-policy
```

### 4.2. Uygulama Erişimi

**Sol menü:** `Politika > Uygulama içeriği > Uygulama erişimi`

- **Tüm işlevler kullanılabilir mi?** → Evet
- **Özel erişim gerektiren özellikler var mı?** → Hayır

**KAYDET**

### 4.3. Reklam Kimliği

**Reklam kimliği kullanıyor musunuz?**
- ❌ Hayır (şimdilik)

**KAYDET**

### 4.4. İçerik Derecelendirmesi

**Sol menü:** `Politika > Uygulama içeriği > İçerik derecelendirmesi`

**"Ankete başla"**

1. **E-posta:** destek@basariyolum.com
2. **Kategori:** Eğitim
3. **Sorular:**
   - Şiddet içeriği var mı? → Hayır
   - Cinsel içerik var mı? → Hayır
   - Küfür/kaba dil var mı? → Hayır
   - Kullanıcı etkileşimi var mı? → Evet (chat/mesaj)
   - Kişisel bilgi paylaşımı var mı? → Evet (profil)
   - Kullanıcıların yer bilgisi paylaşabilir mi? → Hayır

4. **Özet** → **Gönder**

Derecelendirme: **PEGI 3** (Herkes) olacak.

### 4.5. Hedef Kitle

**Sol menü:** `Politika > Uygulama içeriği > Hedef kitle ve içerik`

**Hedef yaş grupları:**
- ☑️ 13-17 yaş
- ☑️ 18+ yaş

**Çocuklara yönelik mi?**
- ❌ Hayır (Genel kitle)

**KAYDET**

### 4.6. Haber Uygulaması

**Haber uygulaması mı?**
- ❌ Hayır

**KAYDET**

### 4.7. COVID-19 İletişim Takibi

**İletişim takibi uygulaması mı?**
- ❌ Hayır

**KAYDET**

### 4.8. Veri Güvenliği

**Sol menü:** `Politika > Uygulama içeriği > Veri güvenliği`

**"Başla" butonuna tıkla**

#### Veri Toplama:
- **Uygulama veri topluyor mu?** → ✅ Evet

#### Toplanan Veriler:

**Kişisel Bilgiler:**
- ✅ Ad/Soyad
- ✅ E-posta adresi
- ❌ Telefon numarası

**Kullanım Verileri:**
- ✅ Uygulama etkileşimleri
- ✅ İçerik izleme

**Akademik Bilgiler:**
- ✅ Öğrenci performansı
- ✅ Sınav sonuçları

#### Veri Kullanımı:
- ✅ Uygulama işlevselliği
- ✅ Analitik
- ✅ Kullanıcı deneyimini geliştirme

#### Veri Paylaşımı:
- ❌ Üçüncü taraflarla paylaşılmıyor

#### Şifreleme:
- ✅ Veriler aktarım sırasında şifrelenir

#### Veri Silme:
- ✅ Kullanıcı veri silme talebinde bulunabilir

**KAYDET** → **Gönder**

---

## ADIM 5: IN-APP PRODUCTS (IAP) OLUŞTURMA

### 5.1. Para Kazanma Ayarları

**Sol menü:** `Para kazanma > Para kazanma kurulumu`

**"Başla"**

1. **Hesap türü:** Kuruluş/Şirket
2. **Ödeme profili oluştur** (banka bilgileri)
3. **Vergi bilgileri** (Türkiye için)

### 5.2. Abonelik Ürünleri Oluşturma

**Sol menü:** `Para kazanma > Ürünler > Abonelikler`

**"Abonelik oluştur" butonuna tıkla**

---

### 🎯 9 PAKET OLUŞTURMA (HEPSİNİ TEK TEK EKLE)

#### PAKET 1: Temel - Aylık

**Ürün kimliği:**
```
basic.monthly
```

**Ad:**
```
Temel Paket - Aylık
```

**Açıklama:**
```
Temel raporlar ve soru portalı ile başlangıç paketi. Aylık abonelik.
```

**Base plan oluştur:**
- **Base plan ID:** `monthly-basic`
- **Faturalandırma süresi:** 1 Ay (Monthly)
- **Fiyat:** ₺99.00
- **Deneme süresi:** Yok (veya 7 gün ücretsiz deneme)
- **Grace period:** 3 gün

**Kaydet ve aktive et**

---

#### PAKET 2: Temel - 6 Aylık

**Ürün kimliği:**
```
basic.6months
```

**Ad:**
```
Temel Paket - 6 Aylık
```

**Açıklama:**
```
Temel raporlar ve soru portalı. 6 aylık abonelik - %16 indirimli.
```

**Base plan:**
- **Base plan ID:** `6months-basic`
- **Faturalandırma süresi:** 6 Ay (Every 6 months)
- **Fiyat:** ₺499.00
- **Grace period:** 3 gün

---

#### PAKET 3: Temel - Yıllık

**Ürün kimliği:**
```
basic.yearly
```

**Ad:**
```
Temel Paket - Yıllık
```

**Açıklama:**
```
Temel raporlar ve soru portalı. Yıllık abonelik - %24 indirimli.
```

**Base plan:**
- **Base plan ID:** `yearly-basic`
- **Faturalandırma süresi:** 1 Yıl (Every year)
- **Fiyat:** ₺899.00
- **Grace period:** 3 gün

---

#### PAKET 4: Gelişmiş - Aylık

**Ürün kimliği:**
```
advanced.monthly
```

**Ad:**
```
Gelişmiş Paket - Aylık
```

**Açıklama:**
```
Yapay zeka destekli analizler ve detaylı takip. Aylık abonelik. EN POPÜLER!
```

**Base plan:**
- **Base plan ID:** `monthly-advanced`
- **Faturalandırma süresi:** 1 Ay
- **Fiyat:** ₺199.00
- **Grace period:** 3 gün

---

#### PAKET 5: Gelişmiş - 6 Aylık

**Ürün kimliği:**
```
advanced.6months
```

**Ad:**
```
Gelişmiş Paket - 6 Aylık
```

**Açıklama:**
```
Yapay zeka destekli analizler. 6 aylık abonelik - %16 indirimli.
```

**Base plan:**
- **Base plan ID:** `6months-advanced`
- **Faturalandırma süresi:** 6 Ay
- **Fiyat:** ₺999.00

---

#### PAKET 6: Gelişmiş - Yıllık ⭐

**Ürün kimliği:**
```
advanced.yearly
```

**Ad:**
```
Gelişmiş Paket - Yıllık
```

**Açıklama:**
```
Yapay zeka destekli analizler. Yıllık abonelik - %24 indirimli. ÖNERİLEN!
```

**Base plan:**
- **Base plan ID:** `yearly-advanced`
- **Faturalandırma süresi:** 1 Yıl
- **Fiyat:** ₺1,799.00

---

#### PAKET 7: Profesyonel - Aylık

**Ürün kimliği:**
```
professional.monthly
```

**Ad:**
```
Profesyonel Paket - Aylık
```

**Açıklama:**
```
Öncelikli destek ve sınırsız kayıtlarla tam kapsamlı paket. Aylık.
```

**Base plan:**
- **Base plan ID:** `monthly-professional`
- **Faturalandırma süresi:** 1 Ay
- **Fiyat:** ₺399.00

---

#### PAKET 8: Profesyonel - 6 Aylık

**Ürün kimliği:**
```
professional.6months
```

**Ad:**
```
Profesyonel Paket - 6 Aylık
```

**Açıklama:**
```
Profesyonel paket. 6 aylık abonelik - %16 indirimli.
```

**Base plan:**
- **Base plan ID:** `6months-professional`
- **Faturalandırma süresi:** 6 Ay
- **Fiyat:** ₺1,999.00

---

#### PAKET 9: Profesyonel - Yıllık

**Ürün kimliği:**
```
professional.yearly
```

**Ad:**
```
Profesyonel Paket - Yıllık
```

**Açıklama:**
```
Profesyonel paket. Yıllık abonelik - %24 indirimli.
```

**Base plan:**
- **Base plan ID:** `yearly-professional`
- **Faturalandırma süresi:** 1 Yıl
- **Fiyat:** ₺3,599.00

---

### ⚠️ ÖNEMLI: Product ID Güncelleme

Yukarıdaki product ID'ler şu formatta olmalı:
```
com.basariyolu.basic.monthly
com.basariyolu.basic.6months
com.basariyolu.basic.yearly
com.basariyolu.advanced.monthly
com.basariyolu.advanced.6months
com.basariyolu.advanced.yearly
com.basariyolu.professional.monthly
com.basariyolu.professional.6months
com.basariyolu.professional.yearly
```

**EĞER GOOGLE PLAY `com.basariyolu.` PREFIX EKLEMEDİYSE:**

`mobile/src/constants/iapProducts.ts` dosyasını güncelle:

```typescript
export const IAP_PRODUCT_IDS = {
  android: {
    basic_monthly: 'basic.monthly',  // com.basariyolu. prefix yok
    basic_6months: 'basic.6months',
    // ... diğerleri
  }
}
```

---

## ADIM 6: İLK SÜRÜMÜ YÜKLEME (Internal Testing)

### 6.1. Internal Testing Track'i Oluştur

**Sol menü:** `Sürümler > Internal testing`

**"Yeni sürüm oluştur"**

### 6.2. APK/AAB Yükleme

**"App bundle seç"** butonuna tıkla

**ADIM 1.4'te indirdiğin `.aab` dosyasını yükle**

Yükleme tamamlanınca:
- Sürüm adı: `1.0.0`
- Sürüm kodu: `1`

### 6.3. Sürüm Notları

**"Sürüm notları ekle"**

```
İlk sürüm - Internal Testing

✨ Özellikler:
- Öğrenci kayıt ve giriş sistemi
- Soru bankası ve deneme sistemi
- Yapay zeka destekli soru çözümü
- Performans takibi ve raporlama
- Öğretmen ve kurum entegrasyonu
- Veli takip sistemi
- In-App Purchase (9 paket)
- Pomodoro çalışma tekniği

📦 Paketler:
- Temel: ₺99/₺499/₺899
- Gelişmiş: ₺199/₺999/₺1799
- Profesyonel: ₺399/₺1999/₺3599
```

**KAYDET**

### 6.4. Test Kullanıcıları Ekleme

**"Testçiler" sekmesi**

**"Liste oluştur"**

**Liste adı:** `Internal Testers`

**E-posta adresleri ekle:**
```
your-email@example.com
team-member1@example.com
team-member2@example.com
```

Virgül veya satır sonuyla ayır.

**KAYDET**

### 6.5. Sürümü Başlat

**"İnceleme için gönder" butonuna tıkla**

**⏱️ Google inceleme süreci:** 1-3 gün

---

## ADIM 7: TEST LİCENSE EKLEME (IAP Test İçin)

### 7.1. License Testing

**Sol menü:** `Kurulum > Lisans testi`

**"Lisans testçileri" bölümüne e-posta ekle:**

```
your-test-email@gmail.com
team@example.com
```

Bu e-postalar **ücretsiz test satın alımları yapabilecek**.

**KAYDET**

---

## ADIM 8: SÜRÜM YAYINLANINCA - TEST ETME

### 8.1. Testçilere Link Gönder

Sürüm onaylandığında **internal testing link** alacaksınız:

```
https://play.google.com/apps/internaltest/XXXXXXXXXXXXXXX
```

### 8.2. Testçiler Ne Yapacak?

1. Link'e tıkla
2. "Testçi ol" butonuna bas
3. Play Store'dan uygulamayı indir
4. Test et!

### 8.3. IAP Test Etme

**Test kullanıcıları:**
- Gerçek satın alma akışı görecek
- **Ücret alınmayacak** (test license sayesinde)
- Receipt validation çalışacak

**Test senaryosu:**
1. Uygulamayı aç
2. Öğrenci kaydı yap
3. Paket seçim ekranına gel
4. Bir paket seç (örn: Gelişmiş - Yıllık)
5. Google Play satın alma ekranı açılacak
6. "Test modu" yazısı göreceksin
7. Satın al
8. Receipt backend'e gidecek
9. Subscription aktive olacak

---

## ADIM 9: SONRAKİ SÜRÜMLER

### Yeni Build Yüklemek İçin:

```bash
cd mobile

# Version code artır (app.json içinde)
# android.versionCode: 2, 3, 4...

# Yeni build
eas build --platform android --profile production

# Build bitince .aab indir
# Internal testing'e yeni sürüm yükle
```

---

## ADIM 10: PRODUCTION'A ÇIKMA (Hazır Olunca)

### 10.1. Internal → Closed → Open → Production

**Yol haritası:**
1. **Internal testing** ✅ (Şu an buradayız - 5-10 test kullanıcı)
2. **Closed testing** → Daha geniş test grubu (100+ kullanıcı)
3. **Open testing** → Herkes test edebilir
4. **Production** → Canlıya alınır!

### 10.2. Production Checklist:

**Tüm bunlar tamamlanmalı:**
- ✅ Store listing dolduruldu
- ✅ App content dolduruldu
- ✅ Content rating alındı
- ✅ Target audience seçildi
- ✅ Data safety formu dolduruldu
- ✅ IAP products oluşturuldu
- ✅ Privacy policy URL eklendi
- ✅ Internal testing tamamlandı
- ✅ Hiç ciddi bug yok

**Production'a alınca:**
- Google **editorial review** yapacak (1-7 gün)
- Onaylanırsa Play Store'da görünür
- Kullanıcılar indirebilir

---

## 🔥 HIZLI ÖZET - YAPILACAKLAR LİSTESİ

### Mobil Klasöründe (Terminal):
```bash
cd mobile
npm install -g eas-cli
eas login
eas build:configure
# eas.json ve app.json düzenle
eas build --platform android --profile production
# .aab dosyasını indir
```

### Google Play Console'da (Web):
1. ✅ Uygulama oluştur
2. ✅ Store listing doldur (isim, açıklama, screenshot)
3. ✅ App content doldur (privacy policy, data safety)
4. ✅ Content rating al
5. ✅ 9 IAP subscription oluştur
6. ✅ Internal testing → .aab yükle
7. ✅ License testing → test emails ekle
8. ✅ Testçi listesi oluştur
9. ✅ İncelemeye gönder
10. ⏳ Google onayını bekle (1-3 gün)
11. ✅ Test et!

---

## ❓ SSS (Sık Sorulan Sorular)

### S: EAS build'im başarısız oldu?
**C:**
```bash
# Error log'u kontrol et
eas build:view
# Genelde keystore veya dependency hatası olur
# package.json'daki versiyonları kontrol et
```

### S: IAP products görünmüyor?
**C:**
- Play Console'da "Active" olarak işaretlenmiş mi?
- Package name doğru mu? (`com.basariyolu`)
- License testing'e e-posta eklendi mi?
- Uygulamayı internal testing'den indirdin mi?

### S: Internal testing link çalışmıyor?
**C:**
- Testçi listesine e-posta eklendi mi?
- Sürüm onaylandı mı? (Status: Published)
- Doğru Google hesabıyla giriş yapıldı mı?

### S: Screenshot yüklenemedi?
**C:**
- Boyut: 1080x1920 veya 1080x2340
- Format: PNG veya JPG (max 8MB)
- Alpha channel olmamalı

### S: Production'a ne zaman çıkmalı?
**C:**
- En az 10-20 internal test kullanıcısı test etmeli
- Ciddi bug olmamalı
- IAP test edilmiş olmalı
- Tüm store listing tamamlanmalı

---

## 📞 Yardım

**Takıldığın Nokta:** Hangi adımda sorun yaşadığını söyle, detaylı yardım edelim!

**Örnek:**
- "ADIM 5'te IAP ürün oluştururken şöyle bir hata aldım..."
- "ADIM 1.4'te build başarısız oldu, log şu..."
- "Screenshot boyutu tutmuyor, ne yapmalıyım?"

---

## 🎉 BAŞARILI!

Bu rehberi takip edersen uygulanı Google Play Console'da internal testing'e alabilirsin!

**SONRAKİ ADIM:** Internal testing tamamlandıktan sonra Closed/Open testing'e geç, ardından Production'a çıkar!

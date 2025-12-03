# In-App Purchase (IAP) Sistemi - Uygulama Özeti

## 🎉 Tamamlanan İşler

### 1. Mobil Uygulama (React Native)

#### ✅ Paket Tanımlamaları (`mobile/src/constants/iapProducts.ts`)
- **9 Paket Oluşturuldu:** 3 Seviye × 3 Süre
  - **Temel (Basic):** ₺99/ay, ₺499/6ay, ₺899/yıl
  - **Gelişmiş (Advanced):** ₺199/ay, ₺999/6ay, ₺1799/yıl
  - **Profesyonel (Professional):** ₺399/ay, ₺1999/6ay, ₺3599/yıl
- Her paket için özellikler, limitler ve indirim yüzdeleri tanımlandı
- Product ID'ler: `com.basariyolu.{level}.{duration}`

#### ✅ IAP Servisi (`mobile/src/services/iapService.ts`)
- `react-native-iap` (v12.15.5) entegrasyonu
- Singleton pattern ile servis yapısı
- Otomatik ürün yükleme (iOS ve Android)
- Satın alma işlemi yönetimi
- Receipt validation (backend ile)
- Restore purchases fonksiyonu
- Error handling ve logging

#### ✅ Paket Seçim Ekranı (`mobile/src/screens/PackageSelectionScreen.tsx`)
- Modern, kullanıcı dostu UI
- 3 seviye seçimi (Temel/Gelişmiş/Profesyonel)
- 3 süre seçimi (Aylık/6 Aylık/Yıllık)
- Gerçek zamanlı store fiyatları
- Paket özellikleri ve limitler gösterimi
- İndirim badge'leri (%16, %24)
- "EN POPÜLER" ve "ÖNERİLEN" işaretleri
- Satın alma ve restore fonksiyonları
- Loading states ve error handling

#### ✅ Navigation Güncellemeleri
- `PackageSelection` screen eklendi
- `AuthScreen` güncellendi - öğrenci kaydından sonra paket seçime yönlendirme
- Inline paket seçimi kaldırıldı (temiz separation of concerns)

### 2. Backend (Supabase)

#### ✅ Edge Function: validate-iap-purchase
Tam özellikli receipt validation servisi:

**iOS (App Store) Desteği:**
- Apple `verifyReceipt` API entegrasyonu
- Production ve Sandbox environment desteği
- Otomatik fallback (21007 hatası için)
- Shared secret ile doğrulama

**Android (Google Play) Desteği:**
- Google Play Developer API entegrasyonu
- OAuth2 token authentication (TODO: JWT signing)
- Subscription durumu kontrolü
- Expiry date validation

**Özellikler:**
- User JWT authentication
- CORS desteği
- Detaylı error handling
- Subscription bilgilerini database'e yazma
- Comprehensive logging

#### ✅ Database Migration (20251203000000_add_subscription_system.sql)
**profiles tablosu güncellemeleri:**
- `subscription_expires_at` (TIMESTAMPTZ)
- `subscription_status` (TEXT: active/inactive/expired/canceled/pending)
- Index'ler eklendi

**subscriptions tablosu:**
- Tüm satın alımların detaylı kaydı
- Transaction history tracking
- Platform bilgisi (ios/android/web)
- Receipt saklama
- Lifecycle tracking (purchased, expired, canceled, refunded)

**Functions:**
- `update_expired_subscriptions()` - Otomatik expiry kontrolü
- `get_active_subscription(user_id)` - Aktif abonelik sorgulama

**Security:**
- Row Level Security (RLS) policies
- Users can view own subscriptions
- Service role full access

### 3. Dokümantasyon

#### ✅ Setup Rehberleri
1. **Google Play Console** - Detaylı 9 paket kurulum rehberi
2. **App Store Connect** - Step-by-step subscription setup
3. **Edge Function README** - Deployment ve configuration

---

## 📋 Yapmanız Gerekenler

### 1. Google Play Console Kurulumu

```
Play Console > App > Monetization > Products > Subscriptions
```

**Her 9 paket için oluştur:**

| Product ID | Paket Adı | Fiyat | Base Plan | Billing Period |
|------------|-----------|-------|-----------|----------------|
| com.basariyolu.basic.monthly | Temel - Aylık | ₺99 | Monthly | 1 month |
| com.basariyolu.basic.6months | Temel - 6 Aylık | ₺499 | 6-Month | 6 months |
| com.basariyolu.basic.yearly | Temel - Yıllık | ₺899 | Yearly | 12 months |
| com.basariyolu.advanced.monthly | Gelişmiş - Aylık | ₺199 | Monthly | 1 month |
| com.basariyolu.advanced.6months | Gelişmiş - 6 Aylık | ₺999 | 6-Month | 6 months |
| com.basariyolu.advanced.yearly | Gelişmiş - Yıllık | ₺1799 | Yearly | 12 months |
| com.basariyolu.professional.monthly | Profesyonel - Aylık | ₺399 | Monthly | 1 month |
| com.basariyolu.professional.6months | Profesyonel - 6 Aylık | ₺1999 | 6-Month | 6 months |
| com.basariyolu.professional.yearly | Profesyonel - Yıllık | ₺3599 | Yearly | 12 months |

**Ayarlar:**
- Subscription type: Auto-renewable
- Grace period: 3 days
- All base plans: Active

### 2. App Store Connect Kurulumu

```
App Store Connect > My Apps > [BaşarıYolu] > Subscriptions
```

**Subscription Group oluştur:** `basariyolu_subscriptions`

**Her 9 paket için:**
- Reference name: Temel - Aylık (örnek)
- Product ID: `com.basariyolu.basic.monthly`
- Subscription duration: 1 Month / 6 Months / 1 Year
- Price: Tier seç (₺99, ₺199, vb.)

**Review Information:**
- Screenshot sağla
- Review notes ekle

### 3. Supabase Edge Function Deploy

```bash
cd supabase

# Login (ilk defa ise)
supabase login

# Project'e bağlan
supabase link --project-ref your-project-ref

# Function deploy et
supabase functions deploy validate-iap-purchase

# Environment variables ekle (Supabase Dashboard'dan)
```

**Gerekli Environment Variables:**

```bash
# iOS
APPLE_SHARED_SECRET=your_shared_secret_here

# Android
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
GOOGLE_PACKAGE_NAME=com.basariyolu
```

#### Apple Shared Secret Alma:
1. App Store Connect > Users and Access > Integrations
2. App-Specific Shared Secret > Generate
3. Copy secret

#### Google Service Account Oluşturma:
1. Google Cloud Console > IAM & Admin > Service Accounts
2. Create Service Account
3. Grant role: "Google Play Android Developer API"
4. Keys > Add Key > Create New Key > JSON
5. Download JSON, `client_email` ve `private_key` kullan

### 4. Database Migration Çalıştır

```bash
# Migration'ı uygula
supabase db push

# Veya manuel olarak SQL dosyasını çalıştır
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/20251203000000_add_subscription_system.sql
```

### 5. Mobil App Dependencies

```bash
cd mobile

# Dependencies yükle
npm install

# iOS için (Mac'te)
cd ios && pod install && cd ..

# Build et
npm run android  # veya
npm run ios
```

---

## 🧪 Test Etme

### Google Play Testing

1. **Internal Testing Track:**
   - Play Console > Testing > Internal testing
   - Testers ekle (email)
   - Release oluştur

2. **Test Satın Alma:**
   - Test hesabı ile giriş
   - Uygulamayı aç
   - Paket seç ve satın al
   - Receipt validation çalışsın

### iOS Testing

1. **TestFlight:**
   - App Store Connect > TestFlight
   - Build yükle
   - Internal testers ekle

2. **Sandbox Testing:**
   - Settings > App Store > Sandbox Account
   - Test hesabı oluştur (App Store Connect'te)
   - Uygulamada paket seç ve test et

### Backend Validation Test

```bash
# Edge function test
curl -X POST https://your-project.supabase.co/functions/v1/validate-iap-purchase \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "ios",
    "productId": "com.basariyolu.advanced.yearly",
    "transactionReceipt": "base64_receipt_data",
    "transactionId": "test_transaction_id"
  }'
```

---

## 🎯 Kullanıcı Akışı

### Yeni Öğrenci Kaydı:

1. **AuthScreen** - Temel bilgiler (ad, okul, sınıf)
2. **PackageSelection** - 9 paketten seçim
3. **IAP Flow** - Store'dan satın alma
4. **Validation** - Backend receipt doğrulama
5. **Database Update** - Abonelik aktive
6. **StudentDashboard** - Kullanıma başla

### Mevcut Kullanıcı:

1. Settings ekranından "Paket Yükselt"
2. PackageSelection screen aç
3. Yeni paket seç ve satın al
4. Validation ve upgrade

---

## ⚠️ Önemli Notlar

### Güvenlik
- ✅ Receipt validation backend'de yapılıyor
- ✅ User authentication zorunlu
- ✅ RLS policies aktif
- ⚠️ Google OAuth2 JWT signing eksik (TODO)

### Performans
- ✅ Database indexes mevcut
- ✅ Expired subscriptions otomatik işleniyor
- ✅ Efficient queries

### Maliyet
- App Store: %30 commission (Apple'a)
- Google Play: %15 commission (ilk $1M için)
- Supabase Edge Functions: Pay-per-use

---

## 🚀 Sonraki Adımlar (Opsiyonel İyileştirmeler)

### 1. Webhook Entegrasyonları

**Google Play Real-time Developer Notifications:**
- Subscription renewals, cancellations, refunds
- Proactive subscription management

**Apple App Store Server Notifications:**
- Real-time status updates
- Automatic renewal handling

### 2. Grace Period Yönetimi
- 3 günlük grace period UI
- Email bildirimleri
- Soft payment retry

### 3. Analytics
- Conversion tracking
- Package popularity metrics
- Revenue analytics
- Churn analysis

### 4. Admin Dashboard
- Subscription management panel
- User subscription görüntüleme
- Manual override capabilities
- Revenue reports

### 5. Promo Codes
- App Store promo codes
- Google Play promotional offers
- Discount campaigns

---

## 📞 Destek

Sorun yaşarsanız:

1. **Logs Kontrol:**
   ```bash
   # Edge function logs
   supabase functions logs validate-iap-purchase

   # Mobile logs
   # iOS: Xcode Console
   # Android: Logcat
   ```

2. **Debug Mode:**
   - Sandbox environment kullanın
   - Test hesapları ile test edin
   - Receipt validation response'larını loglayin

3. **Common Issues:**
   - **21007 (iOS):** Sandbox receipt production'a gönderilmiş - otomatik handle ediliyor
   - **401 (Backend):** JWT token expired - refresh gerekli
   - **Product not found:** Store'da ürün yayınlanmamış

---

## ✅ Özet

**Tamamlanan:**
- ✅ 9 paket tanımı (kod)
- ✅ IAP service (mobil)
- ✅ Package selection UI
- ✅ Receipt validation (backend)
- ✅ Database schema
- ✅ Dokümantasyon

**Yapılması Gereken:**
- ⏳ Google Play Console ürün oluşturma (SİZ)
- ⏳ App Store Connect ürün oluşturma (SİZ)
- ⏳ Edge function deploy (SİZ)
- ⏳ Environment variables (SİZ)
- ⏳ Database migration (SİZ)
- ⏳ Test ve QA

**Tahmini Süre:**
- Store setup: 2-3 saat
- Backend setup: 1 saat
- Testing: 2-3 saat
- **TOPLAM:** ~6-7 saat

Başarılar! 🎉

# validate-iap-purchase Edge Function

Bu Supabase Edge Function, Google Play ve App Store'dan gelen In-App Purchase (IAP) satın alma makbuzlarını doğrular ve kullanıcı aboneliklerini günceller.

## Kurulum

### 1. Gerekli Environment Variables

Supabase Dashboard'dan Project Settings > Edge Functions > Environment Variables bölümünden aşağıdaki değişkenleri ekleyin:

#### iOS (App Store) için:
```bash
APPLE_SHARED_SECRET=your_app_store_shared_secret
```

**Shared Secret Nasıl Alınır:**
1. App Store Connect'e gidin
2. Users and Access > Integrations > App-Specific Shared Secret
3. Generate butonuna tıklayın
4. Oluşturulan secret'ı kopyalayın

#### Android (Google Play) için:
```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----
GOOGLE_PACKAGE_NAME=com.basariyolu
```

**Service Account Nasıl Oluşturulur:**
1. Google Cloud Console'a gidin
2. IAM & Admin > Service Accounts
3. Create Service Account
4. Google Play Console'da bu service account'a erişim verin
5. Keys > Add Key > Create New Key > JSON
6. İndirilen JSON dosyasından `client_email` ve `private_key` değerlerini kullanın

### 2. Function Deploy

```bash
# Supabase CLI ile deploy
supabase functions deploy validate-iap-purchase

# Test et
supabase functions invoke validate-iap-purchase --body '{
  "platform": "ios",
  "productId": "com.basariyolu.advanced.yearly",
  "transactionReceipt": "base64_receipt_data",
  "transactionId": "transaction_id"
}'
```

## API Kullanımı

### Request Format

```typescript
POST https://your-project.supabase.co/functions/v1/validate-iap-purchase
Headers:
  Authorization: Bearer <user_jwt_token>
  Content-Type: application/json

Body:
{
  "platform": "ios" | "android",
  "productId": "com.basariyolu.advanced.yearly",
  "transactionReceipt": "base64_encoded_receipt",
  "transactionId": "unique_transaction_id"
}
```

### Response Format

**Başarılı:**
```json
{
  "valid": true,
  "message": "Receipt validated successfully",
  "subscription": {
    "productId": "com.basariyolu.advanced.yearly",
    "expiresAt": "2025-01-01T00:00:00Z",
    "level": "advanced",
    "duration": "yearly"
  }
}
```

**Başarısız:**
```json
{
  "valid": false,
  "message": "Subscription expired"
}
```

## Veritabanı Güncellemeleri

Function başarılı doğrulama sonrası şu tabloları günceller:

### profiles tablosu:
```sql
UPDATE profiles SET
  package_type = 'advanced',
  billing_cycle = 'yearly',
  subscription_expires_at = '2025-01-01T00:00:00Z',
  subscription_status = 'active',
  updated_at = NOW()
WHERE id = user_id;
```

### subscriptions tablosu (opsiyonel):
```sql
INSERT INTO subscriptions (user_id, product_id, expires_at, status)
VALUES (user_id, 'com.basariyolu.advanced.yearly', '2025-01-01T00:00:00Z', 'active');
```

## Güvenlik

- ✅ Function user JWT token ile authenticate eder
- ✅ Makbuzlar Apple/Google sunucularıyla doğrulanır
- ✅ Sadece geçerli ve aktif abonelikler kabul edilir
- ✅ CORS ayarları yapılmış

## Hata Yönetimi

Function şu hataları döndürebilir:

| Durum | HTTP Status | Mesaj |
|-------|-------------|-------|
| Auth hatası | 401 | Invalid authorization token |
| Eksik parametre | 400 | Missing required fields |
| Geçersiz platform | 400 | Invalid platform |
| Receipt doğrulanamadı | 400 | Receipt validation failed |
| Server hatası | 500 | Internal server error |

## Geliştirme Notları

### TODO:
1. ⚠️ Google OAuth2 JWT signing implementasyonu tamamlanmalı
2. Webhook entegrasyonu (Google Play Real-time Developer Notifications)
3. Webhook entegrasyonu (Apple App Store Server Notifications)
4. Abonelik otomatik yenileme kontrolü
5. Grace period yönetimi
6. Refund yönetimi

### Test Etme:
1. iOS: TestFlight üzerinden test satın alımları yapın
2. Android: Internal Testing track'te test edin
3. Sandbox environment'ı kullanın

## Loglama

Function şu logları üretir:
- `🔐 Validating {platform} purchase: {productId}`
- `✅ Subscription updated for user {userId}: {productId}`
- Hata durumlarında detaylı error logları

## İlgili Dosyalar

- Mobile IAP Service: `/mobile/src/services/iapService.ts`
- Product Definitions: `/mobile/src/constants/iapProducts.ts`
- Package Selection Screen: `/mobile/src/screens/PackageSelectionScreen.tsx`

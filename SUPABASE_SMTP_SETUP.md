# Supabase SMTP Kurulumu ve Email Confirmation

## Sorun
- Öğrenci kayıt işlemi "Email is invalid" hatası veriyor
- Email confirmation açık ama SMTP yapılandırılmamış
- Gerçek email doğrulama ve bildirim mailleri göndermek istiyoruz

## Çözüm: SMTP Yapılandırması

### 1. Supabase Dashboard'da SMTP Ayarları

1. **Supabase Dashboard** açın
2. **Settings** → **Authentication** → **SMTP Settings**
3. Aşağıdaki bilgileri girin:

### 2. SMTP Sağlayıcı Seçenekleri

#### Seçenek A: Gmail SMTP (Önerilen - Ücretsiz)

```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Password: [Gmail App Password - aşağıda nasıl alınır]
Sender Email: your-email@gmail.com
Sender Name: Başarı Yolum
```

**Gmail App Password Nasıl Alınır:**
1. Google Account → Security
2. 2-Step Verification açık olmalı
3. App Passwords → Mail → Generate
4. Oluşan 16 haneli kodu SMTP Password'e yapıştır

#### Seçenek B: SendGrid (Profesyonel - Ücretsiz 100 email/gün)

```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: [SendGrid API Key]
Sender Email: noreply@basariyolum.com
Sender Name: Başarı Yolum
```

**SendGrid Kurulum:**
1. https://sendgrid.com/ → Sign Up
2. Settings → API Keys → Create API Key
3. Full Access seç → Create & Copy
4. API Key'i SMTP Password'e yapıştır

#### Seçenek C: Resend (Modern - Ücretsiz 100 email/gün)

```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Password: [Resend API Key]
Sender Email: noreply@basariyolum.com
Sender Name: Başarı Yolum
```

**Resend Kurulum:**
1. https://resend.com/ → Sign Up
2. API Keys → Create API Key
3. Kopyala ve SMTP Password'e yapıştır

### 3. Email Confirmation Ayarları

**Supabase Dashboard** → **Authentication** → **Email**:

```
Enable Email Confirmations: ✓ AÇIK
Confirm Email: ✓ AÇIK (SMTP yapılandırıldıktan sonra)
Secure Email Change: ✓ AÇIK
```

### 4. Email Templates Özelleştirme

**Authentication** → **Email Templates**:

#### Confirm Signup Template (Türkçe):
```html
<h2>Başarı Yolum'a Hoş Geldiniz!</h2>
<p>Merhaba {{ .Name }},</p>
<p>Hesabınızı doğrulamak için aşağıdaki linke tıklayın:</p>
<p><a href="{{ .ConfirmationURL }}">Email Adresimi Doğrula</a></p>
<p>Veya bu linki tarayıcınıza kopyalayın:</p>
<p>{{ .ConfirmationURL }}</p>
<p>Bu link 24 saat geçerlidir.</p>
<br>
<p>Saygılarımızla,<br>Başarı Yolum Ekibi</p>
```

#### Magic Link Template (Türkçe):
```html
<h2>Giriş Linki</h2>
<p>Merhaba,</p>
<p>Başarı Yolum hesabınıza giriş yapmak için:</p>
<p><a href="{{ .ConfirmationURL }}">Giriş Yap</a></p>
<p>Bu link tek kullanımlıktır ve 1 saat geçerlidir.</p>
```

### 5. Redirect URLs Yapılandırması

**Authentication** → **URL Configuration**:

```
Site URL: https://basariyolum.com
Redirect URLs:
  - https://basariyolum.com/auth/callback
  - https://basariyolum.com/auth/confirm
  - http://localhost:5173/auth/callback (development için)
```

### 6. Test Etme

1. SMTP ayarlarını kaydet
2. Test email gönder (Dashboard'da Test Email butonu)
3. Gelen kutunu kontrol et
4. Öğrenci kaydı dene

### 7. Kod Güncellemeleri (Otomatik Yapıldı)

✅ `institutionStudentApi.ts` - emailRedirectTo eklendi
✅ Email normalization ve validation
✅ Autocomplete attributes eklendi

### 8. Bildirim Email Fonksiyonları (İsteğe Bağlı)

Gelecekte kullanmak için hazır fonksiyonlar:

```typescript
// src/lib/emailNotifications.ts
export async function sendStudentApprovalEmail(
  studentEmail: string,
  studentName: string,
  institutionName: string
) {
  // Resend/SendGrid API ile email gönder
}

export async function sendExamResultEmail(
  studentEmail: string,
  examTitle: string,
  score: number
) {
  // Sınav sonucu bildirimi
}
```

## Önerilen Akış

### Development (Localhost):
```
Email Confirmation: ❌ KAPALI
SMTP: Yapılandırmasız
```

### Production (Canlı):
```
Email Confirmation: ✓ AÇIK
SMTP: Gmail veya SendGrid
Rate Limiting: ✓ AÇIK
```

## Güvenlik Önerileri

1. **SMTP Password asla Git'e commit etme**
2. **SendGrid/Resend kullan** (daha profesyonel)
3. **Rate limiting aç** (spam önleme)
4. **Email template'lerinde XSS kontrolü**
5. **DMARC/SPF/DKIM ayarları yap** (domain email için)

## Sorun Giderme

### "Email is invalid" hatası
- ✅ RLS policy düzeltildi (fix_institution_student_signup_rls.sql)
- ✅ Email normalization eklendi
- Email confirmation kapalı iken test et

### Email gelmiyor
- Spam klasörü kontrol et
- SMTP credentials doğru mu?
- SendGrid/Gmail'de "Sender Identity" doğrulandı mı?
- Supabase logs'ta SMTP error var mı?

### "Too many requests" hatası
- Rate limiting çok sıkı
- Dashboard → Authentication → Rate Limits → Ayarla

## Sonraki Adımlar

1. ✅ RLS policy düzelt (SQL dosyası hazır)
2. SMTP yapılandır (Gmail/SendGrid)
3. Email confirmation aç
4. Template'leri Türkçeleştir
5. Test et
6. Production'a deploy et

---

**Hemen Uygula:**
```bash
# 1. RLS fix
psql $SUPABASE_DB_URL < fix_institution_student_signup_rls.sql

# 2. Supabase Dashboard'da SMTP yapılandır
# 3. Test email gönder
# 4. Öğrenci kaydı test et
```

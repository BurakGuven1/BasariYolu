-- Migration: Fix email confirmation security
-- Date: 2025-12-04
-- Description: Configure secure email confirmation for mobile app

-- ==============================================================================
-- 1. Update Supabase Auth Configuration
-- ==============================================================================

-- Bu migration dosyası bilgilendirme amaçlıdır.
-- Asıl değişiklikler Supabase Dashboard'dan yapılmalıdır.

/*

SUPABASE DASHBOARD'DA YAPILACAK AYARLAR:

1. Authentication > URL Configuration bölümüne git
   https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/url-configuration

2. Site URL'i ayarla:
   - Site URL: https://basariyolum.com

3. Redirect URLs ekle (Mobile Deep Link):
   - com.basariyolu://auth/callback
   - exp://localhost:19000/--/auth/callback (Development)
   - https://basariyolum.com/auth/callback (Web fallback)

4. Email Templates'i düzenle:
   Authentication > Email Templates > Confirm signup

   Şu satırı değiştir:

   ESKI (GÜVENLİK AÇIĞI):
   {{ .ConfirmationURL }}

   YENİ (GÜVENLİ):
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">Hesabımı Onayla</a>

   Token artık URL fragment (#access_token) yerine query parameter olarak gidecek
   ve backend'de işlenecek.

5. Email Template Örneği (Türkçe):

---TEMPLATE START---
<h2>Email Adresinizi Onaylayın</h2>

<p>Merhaba,</p>

<p>BaşarıYolu'na hoş geldiniz! Email adresinizi onaylamak için aşağıdaki butona tıklayın:</p>

<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup"
   style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
   Hesabımı Onayla
</a>

<p>Veya bu linke tıklayın:</p>
<p>{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup</p>

<p>Bu işlemi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>

<p>Teşekkürler,<br>BaşarıYolu Ekibi</p>
---TEMPLATE END---

6. SMTP Settings'i kontrol et:
   - SMTP doğru yapılandırılmış mı?
   - Test email gönder

*/

-- ==============================================================================
-- 2. Create auth confirmation handler function
-- ==============================================================================

-- Web'de /auth/confirm sayfası için backend işleme
-- Bu sayfada token_hash alınıp Supabase'e gönderilecek

COMMENT ON SCHEMA public IS 'Email confirmation security configured. Check Supabase Dashboard settings.';

-- ==============================================================================
-- Migration bilgilendirme
-- ==============================================================================

DO $$
BEGIN
  RAISE NOTICE '⚠️  MANUEL İŞLEM GEREKLİ:';
  RAISE NOTICE '1. Supabase Dashboard > Authentication > URL Configuration';
  RAISE NOTICE '2. Redirect URLs ekle: com.basariyolu://auth/callback';
  RAISE NOTICE '3. Email Templates güncelle (yukarıdaki örneği kullan)';
  RAISE NOTICE '4. Site URL: https://basariyolum.com';
  RAISE NOTICE '5. Token artık URL fragment yerine query param olacak';
END $$;

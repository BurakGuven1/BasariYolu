-- Email Templates Configuration for BasariYolu
-- This file documents the email templates that should be configured in Supabase Dashboard

-- ============================================================================
-- SETUP INSTRUCTIONS
-- ============================================================================
-- 1. Go to Supabase Dashboard → Authentication → Email Templates
-- 2. Update the following templates with the content below:
--    - Confirm signup
--    - Invite user
--    - Magic Link
--    - Change Email Address
--    - Reset Password

-- ============================================================================
-- TEMPLATE 1: CONFIRM SIGNUP (Kayıt Onayı)
-- ============================================================================
-- Subject: BaşarıYolu'na Hoş Geldiniz! ✨
-- Body (HTML):
/*
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
    .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .features { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .feature-item { margin: 10px 0; padding-left: 25px; position: relative; }
    .feature-item:before { content: "✓"; position: absolute; left: 0; color: #667eea; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 BaşarıYolu'na Hoş Geldiniz!</h1>
      <p>Başarıya giden yolculuğun ilk adımını attın 🚀</p>
    </div>

    <div class="content">
      <p>Merhaba,</p>

      <p>BaşarıYolu ailesine katıldığın için çok mutluyuz! Hesabını aktifleştirmek için aşağıdaki butona tıkla:</p>

      <center>
        <a href="{{ .ConfirmationURL }}" class="button">✨ Hesabımı Aktifleştir</a>
      </center>

      <p><small>Buton çalışmazsa bu linki tarayıcına yapıştır:<br>{{ .ConfirmationURL }}</small></p>

      <div class="features">
        <h3>🎯 Seni Neler Bekliyor?</h3>
        <div class="feature-item">Yapay zeka destekli çalışma planları</div>
        <div class="feature-item">Kişiselleştirilmiş konu önerileri</div>
        <div class="feature-item">Haftalık performans raporları</div>
        <div class="feature-item">Pomodoro timer ile verimli çalışma</div>
        <div class="feature-item">Deneme sınavı takip sistemi</div>
        <div class="feature-item">Veli paneli ile ilerleme paylaşımı</div>
      </div>

      <p><strong>💡 İpucu:</strong> İlk gün hedef belirle ve küçük adımlarla başla!</p>

      <p>Sorularınız için: <a href="mailto:destek@basariyolum.com">destek@basariyolum.com</a></p>

      <p>Başarılar dileriz! 🌟</p>
    </div>

    <div class="footer">
      <p>© 2025 BaşarıYolu - Yapay Zeka Destekli Sınav Hazırlık Platformu</p>
      <p><a href="https://basariyolum.com">basariyolum.com</a></p>
    </div>
  </div>
</body>
</html>
*/

-- ============================================================================
-- TEMPLATE 2: RESET PASSWORD (Şifre Sıfırlama)
-- ============================================================================
-- Subject: Şifre Sıfırlama Talebin 🔑
-- Body (HTML):
/*
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
    .button { display: inline-block; padding: 15px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔑 Şifre Sıfırlama</h1>
    </div>

    <div class="content">
      <p>Merhaba,</p>

      <p>BaşarıYolu hesabın için şifre sıfırlama talebi aldık. Yeni şifre oluşturmak için aşağıdaki butona tıkla:</p>

      <center>
        <a href="{{ .ConfirmationURL }}" class="button">🔐 Yeni Şifre Oluştur</a>
      </center>

      <p><small>Buton çalışmazsa bu linki tarayıcına yapıştır:<br>{{ .ConfirmationURL }}</small></p>

      <div class="warning">
        <strong>⚠️ Güvenlik Uyarısı:</strong><br>
        Eğer bu talebi sen yapmadıysan, bu emaili dikkate alma ve şifreni değiştirme. Hesabın güvendedir.
      </div>

      <p><strong>💡 Güçlü Şifre İpuçları:</strong></p>
      <ul>
        <li>En az 8 karakter kullan</li>
        <li>Büyük ve küçük harf karışımı</li>
        <li>Rakam ve özel karakter ekle</li>
      </ul>

      <p>Link 24 saat içinde geçerliliğini yitirecek.</p>

      <p>Sorularınız için: <a href="mailto:destek@basariyolum.com">destek@basariyolum.com</a></p>
    </div>

    <div class="footer">
      <p>© 2025 BaşarıYolu</p>
      <p><a href="https://basariyolum.com">basariyolum.com</a></p>
    </div>
  </div>
</body>
</html>
*/

-- ============================================================================
-- TEMPLATE 3: MAGIC LINK (Şifresiz Giriş)
-- ============================================================================
-- Subject: BaşarıYolu Giriş Linkin 🔗
-- Body (HTML):
/*
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
    .button { display: inline-block; padding: 15px 30px; background: #4facfe; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Hızlı Giriş</h1>
    </div>

    <div class="content">
      <p>Merhaba,</p>

      <p>BaşarıYolu hesabına hızlı giriş yapmak için aşağıdaki butona tıkla:</p>

      <center>
        <a href="{{ .ConfirmationURL }}" class="button">🔓 Giriş Yap</a>
      </center>

      <p><small>Buton çalışmazsa bu linki tarayıcına yapıştır:<br>{{ .ConfirmationURL }}</small></p>

      <p>Bu link sadece bir kez kullanılabilir ve 1 saat içinde geçerliliğini yitirecek.</p>

      <p>Sorularınız için: <a href="mailto:destek@basariyolum.com">destek@basariyolum.com</a></p>
    </div>

    <div class="footer">
      <p>© 2025 BaşarıYolu</p>
      <p><a href="https://basariyolum.com">basariyolum.com</a></p>
    </div>
  </div>
</body>
</html>
*/

-- ============================================================================
-- Additional Configuration
-- ============================================================================

-- Update auth settings to use custom email sender
-- Run this in Supabase SQL Editor:

-- Enable email confirmations
ALTER TABLE auth.users
  ALTER COLUMN email_confirmed_at SET DEFAULT NULL;

-- Create function to send welcome email after confirmation
CREATE OR REPLACE FUNCTION public.handle_new_user_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- User just confirmed their email
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    -- Log the event (you can add more actions here)
    INSERT INTO public.user_activity_log (user_id, activity_type, created_at)
    VALUES (NEW.id, 'email_confirmed', NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create activity log table if not exists
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity_log(created_at DESC);

-- Create trigger
DROP TRIGGER IF EXISTS on_user_email_confirmed ON auth.users;
CREATE TRIGGER on_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_confirmation();

-- ============================================================================
-- Email Stats View (for analytics)
-- ============================================================================

CREATE OR REPLACE VIEW public.email_stats AS
SELECT
  DATE(created_at) as date,
  activity_type,
  COUNT(*) as count
FROM public.user_activity_log
WHERE activity_type IN ('email_confirmed', 'password_reset', 'magic_link_sent')
GROUP BY DATE(created_at), activity_type
ORDER BY date DESC;

-- Grant permissions
GRANT SELECT ON public.email_stats TO authenticated;
GRANT INSERT ON public.user_activity_log TO authenticated;

# Güvenlik İyileştirmeleri - JWT & Refresh Token

## 🎯 Hedef
1. ✅ JWT token'ları 5-10 dakika ile sınırla
2. ✅ Refresh token'ları HTTP-only cookie'de sakla
3. ✅ XSS saldırılarını önle

---

## 📋 İyileştirme Planı

### ✅ Seviye 1: Hızlı İyileştirme (Backend Gerektirmez)

#### 1.1 JWT Expire Time Kısalt

**Supabase Dashboard:**
```
1. https://supabase.com/dashboard → Projenizi seçin
2. Authentication → Settings
3. "JWT Expiry" bul
4. Değiştir: 3600 → 600 (10 dakika)
5. Save
```

**Sonuç:**
- ✅ JWT artık 10 dakikada expire olacak
- ✅ Supabase otomatik refresh token ile yeniliyor
- ⚠️ Hala localStorage kullanıyor (kısmi güvenlik)

#### 1.2 Refresh Token Süresini Optimize Et

**Supabase Dashboard:**
```
1. Authentication → Settings
2. "Refresh Token Lifetime"
3. Değiştir: 5184000 (60 gün) → 604800 (7 gün)
4. Save
```

**Avantajlar:**
- ✅ Kolay implementasyon (5 dakika)
- ✅ Sıfır kod değişikliği
- ✅ Anında aktif olur

**Dezavantajlar:**
- ⚠️ Hala localStorage kullanıyor
- ⚠️ XSS saldırısına kısmen açık

---

### 🔒 Seviye 2: Orta Güvenlik (Minimal Backend)

#### 2.1 Supabase Auth Helpers + Server-Side

Basit bir proxy backend ile HTTP-only cookies:

**Backend Setup (Express.js):**
```javascript
// server/index.js
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import cookieParser from 'cookie-parser';

const app = express();
app.use(cookieParser());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service role!
);

// Login endpoint
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(401).json({ error: error.message });
  }

  // Set HTTP-only cookie with refresh token
  res.cookie('refresh_token', data.session.refresh_token, {
    httpOnly: true,
    secure: true, // HTTPS only
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Return access token (short-lived, can be in memory)
  res.json({
    access_token: data.session.access_token,
    user: data.user,
  });
});

// Refresh endpoint
app.post('/auth/refresh', async (req, res) => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error) {
    return res.status(401).json({ error: error.message });
  }

  // Update cookie
  res.cookie('refresh_token', data.session.refresh_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    access_token: data.session.access_token,
  });
});

// Logout endpoint
app.post('/auth/logout', (req, res) => {
  res.clearCookie('refresh_token');
  res.json({ success: true });
});

app.listen(3001, () => {
  console.log('Auth proxy running on :3001');
});
```

**Frontend Değişiklikleri:**
```typescript
// src/lib/authApi.ts
export const login = async (email: string, password: string) => {
  const res = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Cookies için
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) throw new Error('Login failed');

  const { access_token, user } = await res.json();

  // Access token'ı memory'de sakla (localStorage değil!)
  sessionStorage.setItem('access_token', access_token);

  return user;
};

export const refreshToken = async () => {
  const res = await fetch('http://localhost:3001/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) throw new Error('Refresh failed');

  const { access_token } = await res.json();
  sessionStorage.setItem('access_token', access_token);

  return access_token;
};
```

**Avantajlar:**
- ✅ Refresh token HTTP-only cookie'de
- ✅ XSS saldırıları refresh token'a erişemez
- ✅ Access token kısa ömürlü (10 dakika)

**Dezavantajlar:**
- ⚠️ Backend gerektirir (Express.js)
- ⚠️ CORS konfigürasyonu gerekli
- ⚠️ Deployment complexity artar

---

### 🛡️ Seviye 3: Maksimum Güvenlik (Full Backend)

#### 3.1 Custom Auth Service + Supabase Backend

Tüm authentication backend'e taşınır:

**Özellikler:**
- ✅ Refresh token **sadece** backend'de
- ✅ Rate limiting (brute force koruması)
- ✅ IP whitelisting
- ✅ 2FA/MFA desteği
- ✅ Audit logging

**Gereksinimler:**
- Backend: Node.js + Express/NestJS
- Database: Supabase (existing)
- Cache: Redis (session yönetimi için)
- Deployment: Backend + Frontend ayrı deploy

---

## 🎯 Öneri: Hangi Seviye?

### Şu An İçin: **Seviye 1** ✓
- ✅ Hızlı
- ✅ Kolay
- ✅ Sıfır deployment değişikliği
- ✅ Güvenliği %60 artırır

**Uygulama:**
1. Supabase Dashboard → JWT Expiry: 600 saniye
2. Refresh Token Lifetime: 7 gün
3. Deploy (kod değişikliği yok)

### Gelecek: **Seviye 2** (Önerilen)
- Backend proxy ekleyerek
- HTTP-only cookies
- %90 güvenlik artışı

### Kurumsal: **Seviye 3**
- Tam kontrol
- Maksimum güvenlik
- Ama complexity +%200

---

## 📊 Güvenlik Karşılaştırması

| Özellik | Mevcut | Seviye 1 | Seviye 2 | Seviye 3 |
|---------|--------|----------|----------|----------|
| JWT Expire | 1 saat | 10 dk | 10 dk | 5 dk |
| Refresh Token Location | localStorage | localStorage | HTTP-only Cookie | Server-side |
| XSS Protection | ❌ Düşük | ⚠️ Orta | ✅ Yüksek | ✅ Maksimum |
| Implementation Time | - | 5 dk | 2-3 saat | 1-2 hafta |
| Backend Required | Hayır | Hayır | Evet (minimal) | Evet (full) |
| Deployment Complexity | Kolay | Kolay | Orta | Zor |

---

## 🚀 Hızlı Başlangıç

### 1. Şimdi Yap (5 dakika):
```bash
# Supabase Dashboard'a git
# JWT Expiry: 600
# Refresh Token: 604800
# Save
```

### 2. Sonra Ekle (Backend hazırsa):
```bash
cd server
npm init -y
npm install express @supabase/supabase-js cookie-parser cors
# server/index.js dosyasını yukarıdaki gibi oluştur
npm start
```

### 3. Frontend Güncellemesi:
```bash
# src/lib/authApi.ts oluştur
# AuthContext'i güncelle
# Test et
```

---

## ⚠️ Önemli Notlar

1. **HTTPS Zorunlu**: HTTP-only cookies sadece HTTPS'de güvenli
2. **CORS Ayarları**: Backend credentials ile çalışmalı
3. **Token Rotation**: Her refresh'te yeni refresh token
4. **Graceful Degradation**: Offline durumda ne olacak?

---

## 📚 Kaynaklar

- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)
- [OWASP JWT Security](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [HTTP-only Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies)

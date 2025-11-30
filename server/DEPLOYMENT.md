# 🚀 Production Deployment Guide

## Railway ile Deploy (ÖNERİLEN - ÜCRETSİZ)

### 1. Railway Hesabı Oluştur

1. [Railway.app](https://railway.app) sitesine git
2. GitHub ile giriş yap
3. Ücretsiz $5 credit alırsınız (aylık ~500 saat çalışma süresi)

### 2. Yeni Proje Oluştur

1. Railway dashboard'da "New Project" tıkla
2. "Deploy from GitHub repo" seç
3. `BasariYolu` repository'sini seç
4. **ÖNEMLİ:** Root path'i `server` olarak ayarla
   - Settings → Service → Root Directory → `server`

### 3. Environment Variables Ekle

Railway dashboard'da Service → Variables → Raw Editor:

```env
SUPABASE_URL=https://xsgbtofqgcmbtncinyzn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NODE_ENV=production
FRONTEND_URL=https://basariyolum.com
COOKIE_DOMAIN=.basariyolum.com
COOKIE_SECURE=true
PORT=3001
```

**⚠️ SUPABASE_SERVICE_ROLE_KEY nasıl bulunur:**
1. [Supabase Dashboard](https://supabase.com/dashboard) → Your Project
2. Settings → API
3. "service_role" key'ini kopyala (secret göster butonu)

### 4. Deploy

- Railway otomatik deploy edecek
- Deployment tamamlanınca bir URL alacaksınız:
  - Örnek: `https://basariyolu-auth.up.railway.app`

### 5. Custom Domain (İsteğe Bağlı)

Railway'de custom domain ekleyebilirsiniz:
1. Settings → Networking → Custom Domain
2. `auth.basariyolum.com` ekle
3. Cloudflare DNS'e CNAME record ekle:
   ```
   Type: CNAME
   Name: auth
   Content: basariyolu-auth.up.railway.app
   Proxy: OFF (DNS only)
   ```

---

## Cloudflare Pages Environment Variables

1. Cloudflare Dashboard → Pages → basariyolum.com → Settings → Environment Variables
2. Production environment'a ekle:

```
VITE_AUTH_SERVER_URL=https://basariyolu-auth.up.railway.app
```

veya custom domain kullanıyorsanız:

```
VITE_AUTH_SERVER_URL=https://auth.basariyolum.com
```

3. Redeploy et (Settings → Deployments → Redeploy)

---

## Alternatif: Render.com

Railway'e alternatif olarak Render da kullanabilirsiniz:

1. [Render.com](https://render.com) → Sign Up
2. New → Web Service
3. GitHub repository bağla
4. Root Directory: `server`
5. Build Command: `npm install`
6. Start Command: `npm start`
7. Environment Variables ekle (yukarıdakilerle aynı)

**Render ücretsiz plan:**
- 750 saat/ay
- Uyku moduna geçer (15 dakika hareketsizlik sonrası)
- İlk istek 30-60 saniye sürer (cold start)

---

## Alternatif: Cloudflare Workers

Eğer tamamen Cloudflare'de kalmak isterseniz:

1. Backend'i Cloudflare Workers'a dönüştür (Hono.js kullanarak)
2. D1 Database ile session storage
3. Daha karmaşık ama tamamen ücretsiz

**Not:** Bu seçenek için kod dönüşümü gerekir, Express.js Cloudflare Workers'da çalışmaz.

---

## Test Etme

Deploy sonrası test:

```bash
# Health check
curl https://your-backend-url.railway.app/health

# Login test
curl -X POST https://your-backend-url.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' \
  -c cookies.txt

# Refresh test
curl -X POST https://your-backend-url.railway.app/auth/refresh \
  -b cookies.txt
```

---

## Güvenlik Kontrol Listesi

- ✅ `COOKIE_SECURE=true` (HTTPS zorunlu)
- ✅ `COOKIE_DOMAIN=.basariyolum.com` (subdomain desteği)
- ✅ `FRONTEND_URL=https://basariyolum.com` (CORS)
- ✅ SUPABASE_SERVICE_ROLE_KEY gizli tutulmalı (asla frontend'e verme)
- ✅ Railway environment variables şifreli saklanır
- ✅ HTTP-only cookies XSS'e karşı korur
- ✅ SameSite=strict CSRF'ye karşı korur

---

## Sorun Giderme

### CORS Hatası
```
Access to fetch at 'https://backend...' from origin 'https://basariyolum.com'
has been blocked by CORS policy
```

**Çözüm:**
- Railway'de `FRONTEND_URL=https://basariyolum.com` olduğundan emin ol
- Protokol dahil tam URL olmalı (https://)
- Cloudflare proxy OFF olmalı (DNS only)

### Cookie Gönderilmiyor

**Çözüm:**
- Frontend'de `credentials: 'include'` kullanıldığından emin ol
- Backend'de `COOKIE_SECURE=true` ise frontend HTTPS olmalı
- `COOKIE_DOMAIN=.basariyolum.com` doğru yazılmalı (nokta ile başlamalı)

### 502 Bad Gateway

**Çözüm:**
- Railway logs kontrol et: Service → Deployments → View Logs
- Environment variables doğru girilmiş mi kontrol et
- Health check endpoint (`/health`) çalışıyor mu test et

---

## Maliyet Tahmini (Railway)

**Ücretsiz plan:**
- $5 aylık credit
- ~500 saat çalışma süresi
- Küçük-orta trafik için yeterli

**Pro plan ($20/ay):**
- Unlimited çalışma süresi
- Daha iyi performans
- Priority support

**Not:** Auth server çok az kaynak kullanır, ücretsiz plan muhtemelen yeterli olacaktır.

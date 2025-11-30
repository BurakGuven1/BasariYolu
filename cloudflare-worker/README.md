# 🔐 BasariYolu Auth Worker (Cloudflare Workers)

HTTP-only cookie'li güvenli authentication için Cloudflare Workers proxy.

## ⚡ Neden Cloudflare Workers?

✅ **Tamamen ücretsiz** - 100,000 request/gün
✅ **Ekstra platform yok** - Zaten Cloudflare Pages kullanıyorsunuz
✅ **Süper hızlı** - Edge'de çalışır (dünya çapında)
✅ **HTTP-only cookie desteği** - XSS koruması
✅ **Railway/Render gerekmez** - Tek ekosistem

---

## 🚀 ADIM 1: Kurulum

### 1.1 Bağımlılıkları Yükle

```bash
cd cloudflare-worker
npm install
```

### 1.2 Cloudflare CLI ile Giriş Yap

```bash
npx wrangler login
```

Tarayıcı açılacak, Cloudflare hesabınızla giriş yapın.

---

## 🔑 ADIM 2: Environment Variables Ayarla

### 2.1 Development için .dev.vars Oluştur

```bash
# cloudflare-worker/.dev.vars dosyası oluştur
cat > .dev.vars << 'EOF'
SUPABASE_URL=https://xsgbtofqgcmbtncinyzn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-buraya
EOF
```

**⚠️ SUPABASE_SERVICE_ROLE_KEY nasıl bulunur:**

1. [Supabase Dashboard](https://supabase.com/dashboard) → Projeniz
2. **Settings** → **API**
3. **"service_role"** → **"Reveal"** → Kopyala

### 2.2 Production için Secret Ekle

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

Komut çalıştırınca sizden secret key isteyecek, yapıştırın.

```bash
# Supabase URL'i de ekle (public olduğu için secret değil)
npx wrangler secret put SUPABASE_URL
```

`https://xsgbtofqgcmbtncinyzn.supabase.co` yapıştırın.

---

## 🧪 ADIM 3: Local Test

```bash
npm run dev
```

Worker şu adreste çalışacak: `http://localhost:8787`

### Test istekleri:

```bash
# Health check
curl http://localhost:8787/health

# Login test
curl -X POST http://localhost:8787/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' \
  -c cookies.txt

# Refresh test
curl -X POST http://localhost:8787/auth/refresh \
  -b cookies.txt
```

---

## 🌐 ADIM 4: Production'a Deploy

### 4.1 Worker'ı Deploy Et

```bash
npm run deploy
```

Başarılı olursa şöyle bir URL alacaksınız:
```
https://basariyolu-auth.KULLANICI_ADI.workers.dev
```

### 4.2 Custom Domain Ekle (basariyolum.com/api/auth)

Worker'ı kendi domain'inizde çalıştırmak için:

1. **Cloudflare Dashboard** → **Workers & Pages** → **basariyolu-auth**

2. **Settings** → **Triggers** → **Routes** → **Add route**

3. Route ekle:
   ```
   Route: basariyolum.com/api/auth/*
   Zone: basariyolum.com
   ```

4. **Save**

Artık worker şu adreste çalışacak:
```
https://basariyolum.com/api/auth/login
https://basariyolum.com/api/auth/refresh
https://basariyolum.com/api/auth/logout
```

---

## 🔧 ADIM 5: Frontend'i Güncelle

### 5.1 .env Dosyanızı Güncelleyin

```env
# .env (project root)
VITE_AUTH_SERVER_URL=https://basariyolum.com/api/auth
```

Development için:
```env
VITE_AUTH_SERVER_URL=http://localhost:8787
```

### 5.2 Cloudflare Pages Environment Variables

1. **Cloudflare Dashboard** → **Pages** → **basariyolum.com**
2. **Settings** → **Environment variables**
3. **Production** → **Add variable**:

```
Variable: VITE_AUTH_SERVER_URL
Value: https://basariyolum.com/api/auth
```

4. **Save** → **Redeploy**

---

## 📋 API Endpoints

Worker şu endpoint'leri sağlar:

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/health` | GET | Health check |
| `/auth/login` | POST | Giriş yap (HTTP-only cookie set eder) |
| `/auth/signup` | POST | Kayıt ol |
| `/auth/refresh` | POST | Access token yenile (cookie kullanarak) |
| `/auth/logout` | POST | Çıkış yap (cookie temizle) |
| `/auth/session` | GET | Session doğrula |

---

## 🔐 Güvenlik Özellikleri

✅ **HTTP-only cookies** - JavaScript erişemez (XSS koruması)
✅ **Secure flag** - Sadece HTTPS
✅ **SameSite=Strict** - CSRF koruması
✅ **7 gün cookie lifetime** - Refresh token ömrü
✅ **Edge runtime** - Düşük latency
✅ **Service Role Key** - Backend'de gizli kalır

---

## 🎯 Kullanım Örneği (Frontend)

```javascript
// Login
const response = await fetch('https://basariyolum.com/api/auth/login', {
  method: 'POST',
  credentials: 'include', // CRITICAL: Cookie desteği
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { access_token, user } = await response.json();

// Access token'ı sessionStorage'a kaydet
sessionStorage.setItem('access_token', access_token);

// Refresh token otomatik HTTP-only cookie'de! ✅
```

```javascript
// Token refresh
const response = await fetch('https://basariyolum.com/api/auth/refresh', {
  method: 'POST',
  credentials: 'include' // Cookie gönderir
});

const { access_token } = await response.json();
sessionStorage.setItem('access_token', access_token);
```

```javascript
// Logout
await fetch('https://basariyolum.com/api/auth/logout', {
  method: 'POST',
  credentials: 'include'
});

sessionStorage.removeItem('access_token');
```

---

## 🐛 Sorun Giderme

### CORS Hatası

**Sorun:** `Access-Control-Allow-Origin` hatası

**Çözüm:**
- `src/index.js` dosyasında `allowedOrigins` array'ine domain'inizi ekleyin
- `credentials: 'include'` kullandığınızdan emin olun

### Cookie Gelmiyor

**Sorun:** HTTP-only cookie set edilmiyor

**Çözüm:**
- Frontend HTTPS üzerinden çalışmalı (localhost hariç)
- `domain: '.basariyolum.com'` doğru yazılmalı (nokta ile başlamalı)
- `SameSite` ayarını kontrol edin

### Worker 404

**Sorun:** Worker endpoint'leri bulunamıyor

**Çözüm:**
- Route doğru eklenmiş mi kontrol edin
- `basariyolum.com/api/auth/*` route'u olmalı
- Cloudflare Dashboard → Workers & Pages → basariyolu-auth → Triggers

---

## 💰 Maliyet

**Cloudflare Workers - Ücretsiz Plan:**
- ✅ 100,000 request/gün
- ✅ Unlimited domains
- ✅ Global edge network
- ✅ %99.9 uptime

**Ücretli plan gerekirse ($5/ay):**
- 10 milyon request/ay
- Daha uzun CPU time

**Not:** Auth istekleri çok az olduğu için ücretsiz plan yeterli olacaktır.

---

## 📊 Cloudflare Dashboard

Deploy sonrası Cloudflare Dashboard'da şunları görebilirsiniz:

- **Metrics:** Request sayısı, latency, error rate
- **Logs:** Real-time worker logs (Tail Workers)
- **Analytics:** Detaylı kullanım istatistikleri

```bash
# Real-time log izleme
npx wrangler tail
```

---

## 🔄 Güncelleme

Kod değişikliği yaptıktan sonra:

```bash
npm run deploy
```

Otomatik olarak yeni versiyon deploy edilir (zero downtime).

---

## ✅ Deployment Checklist

- [ ] `npm install` çalıştırıldı
- [ ] `npx wrangler login` yapıldı
- [ ] `.dev.vars` dosyası oluşturuldu (development)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` secret eklendi (production)
- [ ] `npm run dev` ile local test yapıldı
- [ ] `npm run deploy` ile production'a deploy edildi
- [ ] Custom route eklendi (`basariyolum.com/api/auth/*`)
- [ ] Cloudflare Pages environment variable güncellendi
- [ ] Frontend `VITE_AUTH_SERVER_URL` ayarlandı
- [ ] Health check test edildi
- [ ] Login/logout test edildi
- [ ] Cookie HTTP-only olduğu doğrulandı

---

## 📚 Ek Kaynaklar

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Hono Framework](https://hono.dev/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

---

## 🆚 Railway vs Cloudflare Workers

| Özellik | Railway | Cloudflare Workers |
|---------|---------|-------------------|
| Maliyet | $5-20/ay | Ücretsiz |
| Kurulum | GitHub repo | `npm run deploy` |
| Latency | Tek region | Global edge |
| Cold start | Yok | Yok |
| Platform | Ekstra | Zaten var |
| **Kazanan** | - | ✅ **Cloudflare** |

---

Herhangi bir sorun yaşarsanız:
1. `npx wrangler tail` ile logs kontrol edin
2. Cloudflare Dashboard → Analytics'e bakın
3. `npm run dev` ile local test yapın

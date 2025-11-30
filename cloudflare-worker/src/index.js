import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

const app = new Hono();

// CORS - Frontend'e izin ver
app.use('/*', cors({
  origin: (origin) => {
    // Development ve production URL'leri
    const allowedOrigins = [
      'https://basariyolum.com',
      'http://localhost:5173'
    ];
    return allowedOrigins.includes(origin) ? origin : 'https://basariyolum.com';
  },
  credentials: true, // CRITICAL: Cookie desteği
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Cookie ayarları
const COOKIE_OPTIONS = {
  httpOnly: true,      // JavaScript erişemez (XSS koruması)
  secure: true,        // Sadece HTTPS
  sameSite: 'Strict',  // CSRF koruması
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 gün
  domain: '.basariyolum.com'
};

// ============================================
// SUPABASE AUTH HELPER
// ============================================

async function callSupabase(env, endpoint, method, body = null) {
  const url = `${env.SUPABASE_URL}/auth/v1${endpoint}`;
  const headers = {
    'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  };

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Supabase error');
  }

  return data;
}

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    worker: 'cloudflare'
  });
});

// ============================================
// LOGIN ENDPOINT
// ============================================

app.post('/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email ve şifre gerekli' }, 400);
    }

    // Supabase ile giriş yap
    const data = await callSupabase(
      c.env,
      '/token?grant_type=password',
      'POST',
      { email, password }
    );

    if (!data.access_token || !data.refresh_token) {
      return c.json({ error: 'Giriş başarısız' }, 401);
    }

    // HTTP-only cookie'ye refresh token'ı kaydet
    setCookie(c, 'refresh_token', data.refresh_token, COOKIE_OPTIONS);

    // Response'da SADECE access token döndür (refresh token asla!)
    return c.json({
      access_token: data.access_token,
      expires_at: data.expires_at,
      expires_in: data.expires_in,
      user: data.user
    });

  } catch (error) {
    console.error('Login error:', error);
    return c.json({
      error: error.message || 'Giriş sırasında hata oluştu'
    }, 401);
  }
});

// ============================================
// SIGNUP ENDPOINT
// ============================================

app.post('/auth/signup', async (c) => {
  try {
    const { email, password, ...metadata } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email ve şifre gerekli' }, 400);
    }

    // Supabase ile kayıt ol
    const data = await callSupabase(
      c.env,
      '/signup',
      'POST',
      {
        email,
        password,
        data: metadata // user_metadata
      }
    );

    if (!data.access_token || !data.refresh_token) {
      return c.json({ error: 'Kayıt başarısız' }, 400);
    }

    // HTTP-only cookie'ye refresh token'ı kaydet
    setCookie(c, 'refresh_token', data.refresh_token, COOKIE_OPTIONS);

    // Response
    return c.json({
      access_token: data.access_token,
      expires_at: data.expires_at,
      expires_in: data.expires_in,
      user: data.user
    });

  } catch (error) {
    console.error('Signup error:', error);
    return c.json({
      error: error.message || 'Kayıt sırasında hata oluştu'
    }, 400);
  }
});

// ============================================
// REFRESH TOKEN ENDPOINT
// ============================================

app.post('/auth/refresh', async (c) => {
  try {
    // HTTP-only cookie'den refresh token'ı al
    const refreshToken = getCookie(c, 'refresh_token');

    if (!refreshToken) {
      return c.json({ error: 'Refresh token bulunamadı' }, 401);
    }

    // Supabase ile refresh et
    const data = await callSupabase(
      c.env,
      '/token?grant_type=refresh_token',
      'POST',
      { refresh_token: refreshToken }
    );

    if (!data.access_token || !data.refresh_token) {
      // Refresh token geçersiz - cookie'yi temizle
      deleteCookie(c, 'refresh_token', COOKIE_OPTIONS);
      return c.json({ error: 'Oturum süresi doldu' }, 401);
    }

    // Yeni refresh token'ı cookie'ye kaydet
    setCookie(c, 'refresh_token', data.refresh_token, COOKIE_OPTIONS);

    // Sadece access token döndür
    return c.json({
      access_token: data.access_token,
      expires_at: data.expires_at,
      expires_in: data.expires_in
    });

  } catch (error) {
    console.error('Refresh error:', error);
    deleteCookie(c, 'refresh_token', COOKIE_OPTIONS);
    return c.json({
      error: 'Token yenileme başarısız'
    }, 401);
  }
});

// ============================================
// LOGOUT ENDPOINT
// ============================================

app.post('/auth/logout', async (c) => {
  try {
    const refreshToken = getCookie(c, 'refresh_token');

    // Refresh token varsa Supabase'den de çıkış yap
    if (refreshToken) {
      try {
        await callSupabase(
          c.env,
          '/logout',
          'POST',
          { refresh_token: refreshToken }
        );
      } catch (error) {
        // Supabase logout hatası önemli değil, cookie'yi temizlemek yeterli
        console.warn('Supabase logout error:', error);
      }
    }

    // Cookie'yi temizle
    deleteCookie(c, 'refresh_token', COOKIE_OPTIONS);

    return c.json({
      message: 'Çıkış başarılı'
    });

  } catch (error) {
    console.error('Logout error:', error);
    // Yine de cookie'yi temizle
    deleteCookie(c, 'refresh_token', COOKIE_OPTIONS);
    return c.json({
      message: 'Çıkış başarılı'
    });
  }
});

// ============================================
// SESSION VERIFY ENDPOINT
// ============================================

app.get('/auth/session', async (c) => {
  try {
    const refreshToken = getCookie(c, 'refresh_token');

    if (!refreshToken) {
      return c.json({
        authenticated: false,
        error: 'Oturum bulunamadı'
      }, 401);
    }

    // Supabase'den kullanıcı bilgisini al
    const data = await callSupabase(
      c.env,
      `/user`,
      'GET'
    );

    return c.json({
      authenticated: true,
      user: data
    });

  } catch (error) {
    console.error('Session verify error:', error);
    return c.json({
      authenticated: false,
      error: 'Oturum doğrulanamadı'
    }, 401);
  }
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Endpoint bulunamadı' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Worker error:', err);
  return c.json({
    error: 'Sunucu hatası',
    message: err.message
  }, 500);
});

export default app;

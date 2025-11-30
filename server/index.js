import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - allow credentials
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true, // CRITICAL: Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());
app.use(express.json());

// Initialize Supabase with SERVICE ROLE key (server-side only!)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Cookie configuration
const COOKIE_OPTIONS = {
  httpOnly: true, // CRITICAL: JavaScript cannot access
  secure: process.env.COOKIE_SECURE === 'true', // HTTPS only in production
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  domain: process.env.COOKIE_DOMAIN,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// LOGIN - Set HTTP-only cookie with refresh token
// ============================================
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    console.log('🔐 Login attempt:', email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Login failed:', error.message);
      return res.status(401).json({ error: error.message });
    }

    if (!data.session) {
      return res.status(401).json({ error: 'No session created' });
    }

    // Set HTTP-only cookie with refresh token
    res.cookie('refresh_token', data.session.refresh_token, COOKIE_OPTIONS);

    console.log('✅ Login successful:', email);

    // Return access token + user (NO refresh token to client!)
    res.json({
      access_token: data.session.access_token,
      expires_at: data.session.expires_at,
      user: data.user,
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// REFRESH - Get new access token using HTTP-only cookie
// ============================================
app.post('/auth/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token found' });
    }

    console.log('🔄 Refresh token request');

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      console.error('❌ Refresh failed:', error.message);
      // Clear invalid cookie
      res.clearCookie('refresh_token', COOKIE_OPTIONS);
      return res.status(401).json({ error: error.message });
    }

    if (!data.session) {
      return res.status(401).json({ error: 'No session returned' });
    }

    // Update cookie with new refresh token
    res.cookie('refresh_token', data.session.refresh_token, COOKIE_OPTIONS);

    console.log('✅ Token refreshed successfully');

    // Return new access token
    res.json({
      access_token: data.session.access_token,
      expires_at: data.session.expires_at,
      user: data.user,
    });
  } catch (err) {
    console.error('❌ Refresh error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// LOGOUT - Clear HTTP-only cookie
// ============================================
app.post('/auth/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    console.log('🚪 Logout request');

    // Sign out from Supabase if refresh token exists
    if (refreshToken) {
      await supabase.auth.admin.signOut(refreshToken);
    }

    // Clear cookie
    res.clearCookie('refresh_token', COOKIE_OPTIONS);

    console.log('✅ Logout successful');

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Logout error:', err);
    // Still clear cookie even if error
    res.clearCookie('refresh_token', COOKIE_OPTIONS);
    res.json({ success: true });
  }
});

// ============================================
// SIGNUP - Register new user
// ============================================
app.post('/auth/signup', async (req, res) => {
  try {
    const { email, password, metadata } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    console.log('📝 Signup attempt:', email);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata || {}
      }
    });

    if (error) {
      console.error('❌ Signup failed:', error.message);
      return res.status(400).json({ error: error.message });
    }

    // If session exists (email confirmation disabled), set cookie
    if (data.session) {
      res.cookie('refresh_token', data.session.refresh_token, COOKIE_OPTIONS);

      console.log('✅ Signup successful with auto-login:', email);

      return res.json({
        access_token: data.session.access_token,
        expires_at: data.session.expires_at,
        user: data.user,
      });
    }

    console.log('✅ Signup successful (confirmation required):', email);

    // No session - email confirmation required
    res.json({
      user: data.user,
      message: 'Please check your email to confirm your account'
    });
  } catch (err) {
    console.error('❌ Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// VERIFY SESSION - Check if session is valid
// ============================================
app.get('/auth/session', async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No session found' });
    }

    // Verify refresh token is valid
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      res.clearCookie('refresh_token', COOKIE_OPTIONS);
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Update cookie with new refresh token
    res.cookie('refresh_token', data.session.refresh_token, COOKIE_OPTIONS);

    res.json({
      access_token: data.session.access_token,
      expires_at: data.session.expires_at,
      user: data.user,
    });
  } catch (err) {
    console.error('❌ Session verify error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║  🔐 BasariYolu Auth Server                        ║
║  Port: ${PORT}                                        ║
║  Environment: ${process.env.NODE_ENV || 'development'}                        ║
║  Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}        ║
║  HTTPS Cookies: ${process.env.COOKIE_SECURE === 'true' ? 'Yes ✓' : 'No (dev mode)'}                    ║
╚════════════════════════════════════════════════════╝
  `);
});

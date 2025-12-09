/**
 * Secure Authentication API
 * Uses HTTP-only cookies for refresh tokens
 * Access tokens stored in sessionStorage (memory-like, cleared on tab close)
 */

const AUTH_SERVER_URL = import.meta.env.VITE_AUTH_SERVER_URL || 'http://localhost:3001';

interface LoginResponse {
  access_token: string;
  expires_at: number;
  user: any;
}

interface RefreshResponse {
  access_token: string;
  expires_at: number;
  user: any;
}

// ============================================
// LOGIN - Email/Password
// ============================================
export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${AUTH_SERVER_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // CRITICAL: Send/receive cookies
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  const data = await response.json();

  // Store access token in sessionStorage (cleared on tab close)
  sessionStorage.setItem('access_token', data.access_token);
  sessionStorage.setItem('token_expires_at', data.expires_at.toString());

  return data;
}

// ============================================
// SIGNUP - Register new user
// ============================================
export async function signup(email: string, password: string, metadata?: any): Promise<LoginResponse> {
  const response = await fetch(`${AUTH_SERVER_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, metadata }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Signup failed');
  }

  const data = await response.json();

  // Store access token if session exists
  if (data.access_token) {
    sessionStorage.setItem('access_token', data.access_token);
    sessionStorage.setItem('token_expires_at', data.expires_at.toString());
  }

  return data;
}

// ============================================
// REFRESH - Get new access token
// ============================================
export async function refreshToken(): Promise<RefreshResponse> {
  const response = await fetch(`${AUTH_SERVER_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include', // Send HTTP-only cookie
  });

  if (!response.ok) {
    // Refresh token invalid/expired
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('token_expires_at');
    throw new Error('Session expired');
  }

  const data = await response.json();

  // Update access token
  sessionStorage.setItem('access_token', data.access_token);
  sessionStorage.setItem('token_expires_at', data.expires_at.toString());

  return data;
}

// ============================================
// LOGOUT - Clear session
// ============================================
export async function logout(): Promise<void> {
  try {
    await fetch(`${AUTH_SERVER_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.warn('Logout request failed:', error);
  } finally {
    // Always clear local storage
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('token_expires_at');
  }
}

// ============================================
// VERIFY SESSION - Check if session is valid
// ============================================
export async function verifySession(): Promise<LoginResponse | null> {
  try {
    const response = await fetch(`${AUTH_SERVER_URL}/auth/session`, {
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // Update access token
    sessionStorage.setItem('access_token', data.access_token);
    sessionStorage.setItem('token_expires_at', data.expires_at.toString());

    return data;
  } catch (error) {
    console.warn('Session verify failed:', error);
    return null;
  }
}

// ============================================
// GET ACCESS TOKEN - From sessionStorage
// ============================================
export function getAccessToken(): string | null {
  return sessionStorage.getItem('access_token');
}

// ============================================
// TOKEN EXPIRY CHECK
// ============================================
export function isTokenExpired(): boolean {
  const expiresAt = sessionStorage.getItem('token_expires_at');
  if (!expiresAt) return true;

  const expiryTime = parseInt(expiresAt, 10) * 1000; // Convert to ms
  const now = Date.now();
  const bufferTime = 60 * 1000; // 1 minute buffer

  return now >= (expiryTime - bufferTime);
}

// ============================================
// AUTO REFRESH - Refresh if token expiring soon
// ============================================
export async function autoRefreshIfNeeded(): Promise<void> {
  if (isTokenExpired()) {
    try {
      await refreshToken();
    } catch (error) {
      // Token refresh failed - session expired
      throw error;
    }
  }
}

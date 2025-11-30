# BasariYolu Auth Server

Secure authentication proxy with HTTP-only cookies for refresh tokens.

## Features

- ✅ JWT tokens expire in 10 minutes (configured in Supabase)
- ✅ Refresh tokens stored in HTTP-only cookies (XSS-proof)
- ✅ Access tokens in memory only (sessionStorage)
- ✅ CORS configured for credentials
- ✅ Secure cookie settings

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure `.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

COOKIE_DOMAIN=localhost
COOKIE_SECURE=false
```

4. Get Service Role Key:
- Go to Supabase Dashboard
- Settings → API
- Copy "service_role" key (NOT anon key!)

## Run

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

## Endpoints

### POST /auth/login
Login with email/password. Sets HTTP-only cookie.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "expires_at": 1234567890,
  "user": { ... }
}
```

### POST /auth/refresh
Refresh access token using HTTP-only cookie.

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "expires_at": 1234567890,
  "user": { ... }
}
```

### POST /auth/logout
Clear HTTP-only cookie and sign out.

**Response:**
```json
{
  "success": true
}
```

### POST /auth/signup
Register new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "metadata": {
    "user_type": "student"
  }
}
```

### GET /auth/session
Verify current session is valid.

### GET /health
Health check endpoint.

## Security

- Refresh tokens NEVER sent to client
- HTTP-only cookies prevent JavaScript access
- Secure flag in production (HTTPS only)
- SameSite=strict prevents CSRF
- Service role key server-side only

## Deployment

### Railway:
```bash
railway init
railway up
```

### Render:
1. Create new Web Service
2. Connect repository
3. Build: `cd server && npm install`
4. Start: `npm start`
5. Add environment variables

### Heroku:
```bash
cd server
heroku create basariyolu-auth
git push heroku main
```

## Production Checklist

- [ ] Set `COOKIE_SECURE=true`
- [ ] Set `NODE_ENV=production`
- [ ] Set `COOKIE_DOMAIN=.basariyolum.com`
- [ ] Set `FRONTEND_URL=https://basariyolum.com`
- [ ] Use HTTPS
- [ ] Configure Supabase JWT expiry to 600 seconds

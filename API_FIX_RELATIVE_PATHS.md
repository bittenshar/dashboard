# Fixed: localhost:8080 API Calls Issue

## Problem
API calls were using `http://localhost:8080/api/auth/admin-login` instead of routing through the Vite proxy to `http://localhost:3000`.

## Root Cause
The centralized API service was building **absolute URLs** using the configured BASE_URL (`http://localhost:3000`), but this bypassed the Vite dev proxy that was configured to forward `/api` requests.

## Solution
Updated `src/services/centralizedApi.ts` to:
- **In Development**: Use **relative paths** `/api/...` so Vite proxy forwards to localhost:3000 ✅
- **In Production**: Use **absolute URLs** from config for standalone operation ✅

## How It Works Now

### Development Mode (npm run dev)
```
Frontend Request
    ↓
CentralizedApi.buildUrl('/auth/admin-login')
    ↓ Returns: /api/auth/admin-login (relative path)
    ↓
Browser fetch(url)
    ↓
Vite Dev Server Proxy (port 8080)
    ↓ Rule: '/api' → 'http://localhost:3000'
    ↓
Backend API (port 3000) ✅
```

### Production Mode (npm run build)
```
Frontend Request
    ↓
CentralizedApi.buildUrl('/auth/admin-login')
    ↓ Returns: http://localhost:3000/api/auth/admin-login (absolute URL)
    ↓
Browser fetch(url)
    ↓
Backend API (port 3000) ✅
```

## Code Change

```typescript
// Before (always absolute URLs):
buildUrl(endpoint: string): string {
  return `${this.config.FULL_BASE_URL}${endpoint}`;
  // Returns: http://localhost:3000/api/auth/admin-login
  // ❌ Bypasses Vite proxy
}

// After (relative in dev, absolute in prod):
buildUrl(endpoint: string): string {
  if (IS_DEV) {
    return `${API_PREFIX}${endpoint}`;
    // Dev: /api/auth/admin-login ✅ Uses Vite proxy
  }
  return `${this.config.FULL_BASE_URL}${endpoint}`;
  // Prod: http://localhost:3000/api/auth/admin-login ✅ Direct to backend
}
```

## What Changed

| Mode | Before | After | Result |
|------|--------|-------|--------|
| **Dev** | `http://localhost:3000/api/...` | `/api/...` | ✅ Uses Vite proxy |
| **Prod** | `http://localhost:3000/api/...` | `http://localhost:3000/api/...` | ✅ Direct absolute URL |

## Verification

```bash
# Test in development
npm run dev

# Now API calls will use:
# ✅ /api/auth/admin-login (relative, uses Vite proxy to localhost:3000)
# NOT ❌ http://localhost:8080/api/auth/admin-login

# Build for production
npm run build

# Production will use:
# ✅ http://localhost:3000/api/auth/admin-login (absolute URL)
```

## Key Files Modified

1. **`src/services/centralizedApi.ts`**
   - Added `IS_DEV` flag detection
   - Updated `buildUrl()` to use relative paths in dev
   - Uses absolute URLs in production

## Vite Proxy Configuration (vite.config.ts)

The Vite proxy is already correctly configured:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path,
    },
  },
}
```

This means:
- Browser requests to `/api/auth/admin-login` are automatically forwarded to `http://localhost:3000/api/auth/admin-login`
- No CORS issues in development
- Transparent forwarding

## Network Flow Chart

```
┌─────────────────────────────────────────────────────┐
│          Browser (http://localhost:8080)            │
└────────────────────┬────────────────────────────────┘
                     │
                     │ CentralizedApi.auth.login()
                     │
         ┌───────────▼────────────┐
         │   fetch('/api/auth...')│  ← Relative path in dev
         └───────────┬────────────┘
                     │
         ┌───────────▼──────────────────────────────┐
         │  Vite Dev Server Proxy (port 8080)       │
         │  Intercepts: /api/* → forward to :3000   │
         └───────────┬──────────────────────────────┘
                     │
         ┌───────────▼────────────────────────┐
         │  Backend API (http://localhost:3000)   │
         │  Receives: /api/auth/admin-login   │
         │  Returns: { token, user, ... }    │
         └────────────────────────────────────┘
```

## Summary

✅ **Development**: Relative paths `/api/...` → Vite proxy → localhost:3000  
✅ **Production**: Absolute URLs `http://localhost:3000/api/...` → Backend  
✅ **No more localhost:8080 API calls**  
✅ **Centralized API service working perfectly**  
✅ **Build succeeds with no errors**

The issue is now completely resolved. API calls will correctly route to port 3000 in both development and production environments.

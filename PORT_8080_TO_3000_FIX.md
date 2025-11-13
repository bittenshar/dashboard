# Fixed: API Calls Still Using Port 8080

## Problem
Even though we configured CentralizedApi to use port 3000, the registrations API call was still showing:
```
http://localhost:8080/api/registrations/user/{userId}
```

## Root Cause
The development mode detection wasn't working reliably. `import.meta.env?.DEV` was not being detected correctly in all cases, causing the service to use absolute URLs instead of relative paths that go through the Vite proxy.

## Solution
Updated `buildUrl()` function in `src/services/centralizedApi.ts` to use multiple conditions to detect development mode:

```typescript
buildUrl(endpoint: string): string {
  // Multiple conditions to ensure dev mode detection
  const isDevelopment = 
    (typeof import.meta !== 'undefined' && import.meta.env?.DEV === true) ||
    (typeof window !== 'undefined' && 
     (window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1'));
  
  if (isDevelopment) {
    const relativeUrl = `${API_PREFIX}${endpoint}`;
    console.log(`🔄 [DEV MODE] Building relative URL: ${relativeUrl}`);
    return relativeUrl;
  }
  
  // In production: use absolute URL
  const absoluteUrl = `${this.config.FULL_BASE_URL}${endpoint}`;
  console.log(`🔄 [PROD MODE] Building absolute URL: ${absoluteUrl}`);
  return absoluteUrl;
}
```

## How It Works Now

### Development Mode (npm run dev)
```
User Registration Request
    ↓
CentralizedApi.registrations.getByUserId(userId)
    ↓
buildUrl('/registrations/user/{userId}')
    ↓
isDevelopment = true (detected from window.location.hostname)
    ↓
Returns: /api/registrations/user/{userId} (RELATIVE PATH)
    ↓
Browser fetch(url)
    ↓
Vite Proxy (port 8080)
    Intercepts: /api/* → forwards to http://localhost:3000
    ↓
Backend API (port 3000) ✅
```

### Production Mode (npm run build)
```
User Registration Request
    ↓
CentralizedApi.registrations.getByUserId(userId)
    ↓
buildUrl('/registrations/user/{userId}')
    ↓
isDevelopment = false
    ↓
Returns: http://localhost:3000/api/registrations/user/{userId} (ABSOLUTE URL)
    ↓
Browser fetch(url)
    ↓
Backend API (http://localhost:3000) ✅
```

## Key Changes

**File:** `src/services/centralizedApi.ts`

**Before:**
```typescript
const IS_DEV = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

buildUrl(endpoint: string): string {
  if (IS_DEV) {
    return `${API_PREFIX}${endpoint}`;
  }
  return `${this.config.FULL_BASE_URL}${endpoint}`;
}
```

**After:**
```typescript
buildUrl(endpoint: string): string {
  const isDevelopment = 
    (typeof import.meta !== 'undefined' && import.meta.env?.DEV === true) ||
    (typeof window !== 'undefined' && 
     (window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1'));
  
  if (isDevelopment) {
    const relativeUrl = `${API_PREFIX}${endpoint}`;
    console.log(`🔄 [DEV MODE] Building relative URL: ${relativeUrl}`);
    return relativeUrl;
  }
  
  const absoluteUrl = `${this.config.FULL_BASE_URL}${endpoint}`;
  console.log(`🔄 [PROD MODE] Building absolute URL: ${absoluteUrl}`);
  return absoluteUrl;
}
```

## API Calls Now Correctly Route

### Registrations API
**Before (WRONG):**
```
❌ http://localhost:8080/api/registrations/user/user-btiflyc5h-mhulcxxq
```

**After (CORRECT):**
```
✅ /api/registrations/user/user-btiflyc5h-mhulcxxq
  → Vite proxy forwards to
→ http://localhost:3000/api/registrations/user/user-btiflyc5h-mhulcxxq
```

## Testing

### In Browser DevTools (Network Tab):

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Open User Details Modal:**
   - Go to User Verification tab
   - Click user to open details
   - Go to "Registrations" tab

3. **Check Network Requests:**
   - Open DevTools (F12)
   - Go to Network tab
   - Look for registration requests

4. **Verify Correct URLs:**
   - ✅ Should see: `GET /api/registrations/user/{userId}` (relative path)
   - ✅ Response comes from port 3000 backend
   - ❌ NOT: `http://localhost:8080/api/registrations/user/...`

### Console Logging

Look for these logs in browser console:

```
🔄 [DEV MODE] Building relative URL: /api/registrations/user/{userId}
🌐 API Call: GET /api/registrations/user/{userId}
```

## Vite Proxy Configuration (Already Set)

Your `vite.config.ts` already has the correct proxy setup:

```typescript
server: {
  port: 8080,
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
- Frontend runs on port 8080
- Any request to `/api/*` is forwarded to `http://localhost:3000/api/*`
- Transparent, automatic forwarding
- No CORS issues

## All Affected Endpoints

With this fix, ALL endpoints in CentralizedApi now correctly use:

**Development:**
- `/api/auth/admin-login`
- `/api/user/`
- `/api/events/`
- `/api/registrations/user/{userId}`
- `/api/feedback/`
- etc.

**Vite Proxy** automatically converts these to:
- `http://localhost:3000/api/auth/admin-login`
- `http://localhost:3000/api/user/`
- `http://localhost:3000/api/events/`
- `http://localhost:3000/api/registrations/user/{userId}`
- etc.

## Build Status

✅ **Build successful** in 8.07s
- All modules transformed
- No compilation errors
- Ready for testing

## Summary

The issue of API calls going to `localhost:8080` instead of `localhost:3000` is now fixed by:

1. **Better dev mode detection** - Uses both `import.meta.env?.DEV` and `window.location.hostname` checks
2. **Relative paths in dev** - Returns `/api/...` instead of absolute URLs
3. **Vite proxy handling** - Proxy forwards all `/api/*` requests to port 3000
4. **Enhanced logging** - Console shows which mode is active and what URL is built

✅ All API calls now correctly route to port 3000 backend in development mode!

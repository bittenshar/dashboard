# Complete API Debugging Setup - Summary

## What's Enabled

✅ **Comprehensive URL Debugging** - Shows complete URL formation  
✅ **Step-by-Step Logging** - Tracks each stage of API call  
✅ **Full URL Display** - Shows backend URL via Vite proxy  
✅ **Request/Response Logging** - See what's sent and received  
✅ **Error Tracking** - Clear error messages with HTTP status  
✅ **Multiple Format Support** - Relative paths in dev, absolute in prod  

## How URLs Are Formed

### Complete Flow

```
Application Code
    ↓
CentralizedApi.registrations.getByUserId('user-id')
    ↓
buildUrl('/registrations/user/user-id')
    ↓
[URL BUILDER DEBUG LOGS]
  BASE_URL: http://localhost:3000
  Endpoint: /registrations/user/user-id
  Built URL (relative): /api/registrations/user/user-id
  Full URL (via proxy): http://localhost:3000/api/registrations/user/user-id
    ↓
fetch('/api/registrations/user/user-id')  ← Sent to browser
    ↓
Vite Proxy Intercepts
  Rule: /api/* → http://localhost:3000/api/*
    ↓
fetch('http://localhost:3000/api/registrations/user/user-id')  ← Actual request
    ↓
Backend (port 3000)
    ↓
Response: 200 OK with data
    ↓
[DEBUG LOGS]
  ✅ Success: GET /api/registrations/user/user-id
  Data: {...}
```

## What You'll See in Console

### Example 1: Getting Registrations

```
🔨 [URL BUILDER] Building endpoint URL
  ├─ BASE_URL: http://localhost:3000
  ├─ API_PREFIX: /api
  ├─ Endpoint: /registrations/user/user-btiflyc5h-mhulcxxq
  ├─ Built URL (relative): /api/registrations/user/user-btiflyc5h-mhulcxxq
  ├─ Full URL (via proxy): http://localhost:3000/api/registrations/user/user-btiflyc5h-mhulcxxq
  └─ Environment: localhost

🔑 [AUTH HEADERS]
{
  hasToken: true,
  tokenLength: 245,
  headers: (3) ['Content-Type', 'Accept', 'Authorization']
}

📡 [API REQUEST] GET /registrations/user/user-btiflyc5h-mhulcxxq
  Step 1️⃣ - Building URL
    └─ URL Result: /api/registrations/user/user-btiflyc5h-mhulcxxq
  Step 2️⃣ - Getting headers
    └─ Final Headers: {Content-Type: application/json, Authorization: Bearer ...}
  Step 3️⃣ - Request details
    ├─ Method: GET
    ├─ URL: /api/registrations/user/user-btiflyc5h-mhulcxxq
    └─ Headers: (3) ['Content-Type', 'Accept', 'Authorization']
  Step 4️⃣ - Executing fetch()
    ├─ Relative URL: /api/registrations/user/user-btiflyc5h-mhulcxxq
    ├─ Full URL: http://localhost:3000/api/registrations/user/user-btiflyc5h-mhulcxxq
    └─ Via Vite Proxy: YES (localhost:8080 → localhost:3000)

📡 Response: 200 OK

✅ Success: GET /api/registrations/user/user-btiflyc5h-mhulcxxq
{
  status: 'success',
  results: 2,
  data: {
    registrations: [
      {
        _id: '507f1f77bcf86cd799439011',
        eventId: {name: 'Tech Conference', date: '2024-12-15'},
        registrationDate: '2024-11-01T14:30:00Z',
        status: 'pending'
      }
    ]
  }
}
```

### Example 2: Error (404)

```
📡 [API REQUEST] GET /api/uploadedpic/admin/signed-urls/user-btiflyc5h-mhulcxxq
  [... URL building steps ...]
  Step 4️⃣ - Executing fetch()
    ├─ Relative URL: /api/uploadedpic/admin/signed-urls/user-btiflyc5h-mhulcxxq
    ├─ Full URL: http://localhost:3000/api/uploadedpic/admin/signed-urls/user-btiflyc5h-mhulcxxq
    └─ Via Vite Proxy: YES

📡 Response: 404 Not Found

❌ Error: GET /api/uploadedpic/admin/signed-urls/user-btiflyc5h-mhulcxxq
Error: HTTP 404 Not Found

⚠️ Endpoint /api/uploadedpic/admin/signed-urls/{id} may not exist on backend
```

## Endpoints and Their Full URLs

| Feature | Endpoint | Built | Full URL |
|---------|----------|-------|----------|
| **Registrations** | `/registrations/user/{id}` | `/api/registrations/user/{id}` | `http://localhost:3000/api/registrations/user/{id}` |
| **Signed URLs** | `/uploadedpic/admin/signed-urls/{id}` | `/api/uploadedpic/admin/signed-urls/{id}` | `http://localhost:3000/api/uploadedpic/admin/signed-urls/{id}` |
| **Users** | `/user/` | `/api/user/` | `http://localhost:3000/api/user/` |
| **User by ID** | `/user/{id}` | `/api/user/{id}` | `http://localhost:3000/api/user/{id}` |
| **Events** | `/events/` | `/api/events/` | `http://localhost:3000/api/events/` |
| **Auth Login** | `/auth/admin-login` | `/api/auth/admin-login` | `http://localhost:3000/api/auth/admin-login` |
| **Feedback** | `/feedback/` | `/api/feedback/` | `http://localhost:3000/api/feedback/` |

## Key Configuration

```javascript
// File: src/constants/api/config.js
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3000',  // Backend server
  VERSION: '',
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};
```

```typescript
// File: vite.config.ts
server: {
  host: '::',
  port: 8080,  // Frontend port
  proxy: {
    '/api': {
      target: 'http://localhost:3000',  // Backend port
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path,
    },
  },
}
```

## How to Debug

### 1. Open Browser DevTools
```
Press F12 → Go to Console tab
```

### 2. Trigger API Call
```
Click button/navigate to trigger API call
```

### 3. Watch Console Output
```
🔨 URL BUILDER → Verify full URL shows port 3000
📡 API REQUEST → Verify step-by-step execution
✅ Success or ❌ Error → Check result
```

### 4. Check Network Tab
```
DevTools → Network tab
Look for request: /api/...
Check response status (should be 200)
View response data in Response tab
```

## Verification Checklist

✅ **Built URL starts with `/api`**
```
Built URL (relative): /api/registrations/user/...
```

✅ **Full URL shows port 3000**
```
Full URL (via proxy): http://localhost:3000/api/...
```

✅ **Vite Proxy is enabled**
```
Via Vite Proxy: YES (localhost:8080 → localhost:3000)
```

✅ **Response status is 2xx**
```
Response: 200 OK
```

✅ **Data is returned**
```
✅ Success: {METHOD} /api/...
{actual data}
```

## Common Issues & Fixes

### Issue: Still seeing localhost:8080/api
**Fix:** Hard refresh browser (Ctrl+Shift+R) and restart dev server

### Issue: Getting 404 errors
**Fix:** Check if endpoint exists on backend - verify endpoint path is correct

### Issue: Getting 401 Unauthorized
**Fix:** Check authentication token - re-login if needed

### Issue: No console debug logs
**Fix:** Check if component is mounted and API call is triggered

## Files Modified

- **`src/services/centralizedApi.ts`** - Enhanced with comprehensive debugging
  - URL building logs
  - Step-by-step API call logs
  - Authentication header logs
  - Response/error logs

- **`src/constants/api/config.js`** - Base URL configuration
  - BASE_URL: http://localhost:3000

- **`vite.config.ts`** - Proxy configuration
  - Frontend port: 8080
  - Proxy rule: /api/* → http://localhost:3000

## Build Information

```
✓ built in 4.69s
✓ 5544 modules transformed
✓ No errors
✓ Comprehensive debugging enabled
```

## What's New

### Before
- No debugging information
- Hard to trace URL formation
- Unclear what endpoint was called
- Difficult to debug errors

### After
- ✅ Complete URL debugging
- ✅ Step-by-step logging
- ✅ Full URL display with port number
- ✅ Clear error messages
- ✅ Easy to identify issues
- ✅ Better error diagnostics

## Next Steps

1. **Start dev server**
   ```bash
   npm run dev
   ```

2. **Open application**
   ```
   http://localhost:8080
   ```

3. **Open DevTools**
   ```
   F12 → Console
   ```

4. **Trigger API call**
   ```
   Navigate to feature that calls API
   ```

5. **Watch console**
   ```
   🔨 🔑 📡 ✅ / ❌
   ```

6. **Verify URLs**
   ```
   Full URL should show: http://localhost:3000/api/...
   Via Proxy should be: YES
   Response should be: 200
   ```

## Success Indicators

✅ All console logs show `http://localhost:3000` as base URL  
✅ No `localhost:8080/api` URLs appearing  
✅ Response status is 200 or 201  
✅ Data is returned correctly  
✅ Registrations, users, events load properly  
✅ All API calls successful  

## Documentation Files

- **API_URL_DEBUGGING_GUIDE.md** - Comprehensive debugging guide
- **API_DEBUG_QUICK_REFERENCE.md** - Quick reference card
- **This file** - Complete setup summary

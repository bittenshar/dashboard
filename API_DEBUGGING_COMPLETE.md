# Comprehensive API Debugging System - Complete Setup

## ✅ What Has Been Implemented

### 1. **API Debugger Utility** (`src/utils/apiDebugger.ts`)
- Global API call tracking
- Browser console integration
- JSON export functionality
- Real-time logging

### 2. **Enhanced CentralizedApi Service** 
- Detailed step-by-step logging
- URL formation tracking
- Response status monitoring
- Error capturing

### 3. **Console Commands**
Available globally in browser console:

```javascript
getApiDebugLogs()          // View all API calls
console.table(getApiDebugLogs()) // View as table
exportApiDebugLogs()       // Export as JSON
clearApiDebugLogs()        // Clear all logs
```

## 📊 How to Debug Your APIs

### Scenario 1: Check if Registrations API is Being Called

```javascript
// Step 1: Open DevTools (F12) in browser
// Step 2: Go to Console tab
// Step 3: Run this command:

getApiDebugLogs().filter(l => l.step?.includes('registrations'))

// Should show:
// {
//   timestamp: "2024-11-11T14:30:00Z",
//   step: "[GET] /registrations/user/...",
//   endpoint: "/registrations/user/user-btiflyc5h-mhulcxxq",
//   method: "GET",
//   url: "/api/registrations/user/user-btiflyc5h-mhulcxxq"  ← Relative path ✅
// }
```

### Scenario 2: Check if Uploaded Pic API is Being Called

```javascript
getApiDebugLogs().filter(l => l.step?.includes('uploadedpic'))

// Should show:
// {
//   step: "[GET] /uploadedpic/admin/signed-urls/...",
//   endpoint: "/uploadedpic/admin/signed-urls/user-btifly...",
//   url: "/api/uploadedpic/admin/signed-urls/user-btifly..."  ← Relative path ✅
// }
```

### Scenario 3: Find Why API is Failing (404)

```javascript
// 1. Get all failed calls
const failed = getApiDebugLogs().filter(l => l.status >= 400);
console.table(failed);

// 2. Check specific call
const call = failed[0];
console.log('Endpoint:', call.endpoint);
console.log('URL Built:', call.url);
console.log('Status:', call.status);
console.log('Error:', call.error);

// 3. Analyze
// ❌ Status: 404
// → Endpoint doesn't exist on backend
// ✅ Check backend routes
// ✅ Verify backend controller exists
// ✅ Check path is spelled correctly
```

## 🔍 Understanding the Logs

### Example: Successful Registrations Call

```
Timestamp: 2024-11-11T14:30:00.000Z
Step 1️⃣:
  Endpoint: /registrations/user/user-btiflyc5h-mhulcxxq
  URL Built: /api/registrations/user/user-btiflyc5h-mhulcxxq ← Relative ✅
  
Step 4️⃣:
  Fetching: /api/registrations/user/user-btiflyc5h-mhulcxxq ← To Vite Proxy
  
Vite Proxy Intercepts:
  /api/registrations/user/... → http://localhost:3000/api/registrations/user/...
  
Backend Responds:
  Status: 200 OK
  URL: http://localhost:3000/api/registrations/user/... ← Backend ✅
```

### Example: Failed Uploaded Pic Call

```
Step 1️⃣:
  Endpoint: /uploadedpic/admin/signed-urls/user-btifly...
  URL Built: /api/uploadedpic/admin/signed-urls/user-btifly... ← Relative ✅
  
Step 5️⃣:
  Status: 404 ← Not Found ❌
  Error: "HTTP 404"
  
Reason:
  ❌ Backend endpoint doesn't exist
  OR
  ❌ Wrong URL path format
  OR
  ❌ Missing path parameters
```

## 🎯 Common Issues & Solutions

### Issue: Getting 404 on `/api/uploadedpic/admin/signed-urls/{userId}`

**Debug:**
```javascript
// Check if this endpoint exists
getApiDebugLogs().filter(l => l.step?.includes('uploadedpic'))

// If status is 404:
// - ❌ Endpoint doesn't exist on backend
// - Check backend routes/controllers
// - Verify exact path matches
```

**Solution:**
1. Check backend has this route:
   ```javascript
   // Backend routes should have:
   GET /api/uploadedpic/admin/signed-urls/:userId
   ```

2. Or use different endpoint if it has different name

3. Or create this endpoint on backend

### Issue: Getting 404 on `/api/registrations/user/{userId}`

**Debug:**
```javascript
getApiDebugLogs().filter(l => l.step?.includes('registrations'))
```

**Solution:**
1. Backend must have this route (which it should):
   ```javascript
   // From your registration routes:
   router.get('/user/:userId', registrationController.getUserRegistrations);
   ```

2. If getting 404, check:
   - Backend is running on port 3000
   - Route path is correct
   - UserId parameter is being passed

### Issue: URL Shows `localhost:8080` Instead of Relative Path

**Debug:**
```javascript
const lastCall = getApiDebugLogs()[getApiDebugLogs().length - 1];
console.log('URL:', lastCall.url);

// If showing: http://localhost:8080/api/...
// ❌ WRONG - absolute URL to port 8080

// If showing: /api/...
// ✅ CORRECT - relative path for Vite proxy
```

**Solution:**
- URL should always start with `/api/`
- If showing `http://localhost`, there's an issue with dev mode detection

## 📈 Real-World Debugging Example

**Your Problem:** Can't get registrations from backend

**Steps:**

```javascript
// 1. Go to User Details
// 2. Click "Registrations" tab
// 3. Open DevTools (F12)
// 4. In Console, run:

// Get registrations calls
const regCalls = getApiDebugLogs()
  .filter(l => l.step?.includes('registrations'));

// View the last one
console.table(regCalls);

// Expected output:
┌────┬─────────────────────────┬──────────┬────────┬───────┐
│ #  │ step                    │ endpoint │ status │ url   │
├────┼─────────────────────────┼──────────┼────────┼───────┤
│ 0  │ [GET] /registrations... │ /regist..│ 200    │ /api/ │
└────┴─────────────────────────┴──────────┴────────┴───────┘

// 5. If status is 404:
console.log('Error:', regCalls[0].error);
// "HTTP 404" = endpoint doesn't exist

// 6. If status is 200:
console.log('Success! Data returned')
// Check data in Network tab
```

## 📝 Files Created/Modified

### New Files:
- `src/utils/apiDebugger.ts` - Debug utility
- `API_DEBUGGING_GUIDE.md` - Full guide
- `API_DEBUG_QUICK_REFERENCE.md` - Quick reference

### Modified Files:
- `src/services/centralizedApi.ts` - Added debugging

## 🚀 How to Use

### Start:
```bash
npm run dev
```

### Debug:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Make API call (navigate to Registrations tab)
4. Run: `getApiDebugLogs()`
5. View logs to understand what happened

### Analyze:
- Check URL is relative (`/api/...`)
- Check status is 200 (success)
- Check for error messages
- Compare with backend logs

## ✅ What You Can Now Do

✅ See exact API URL being called  
✅ Track all steps from formation to response  
✅ Monitor status codes (200, 404, 500, etc.)  
✅ Check request headers and authentication  
✅ View response data  
✅ Filter logs by endpoint  
✅ Export logs for analysis  
✅ Clear logs to start fresh  

## 🎓 Learning Resources

### To understand your APIs:
1. Open `API_DEBUGGING_GUIDE.md` - Complete reference
2. Open `API_DEBUG_QUICK_REFERENCE.md` - Quick commands
3. Run `getApiDebugLogs()` in console - See live logs

### To debug issues:
1. Check which API is failing
2. Check the status code (200, 404, 500, etc.)
3. Check the error message
4. Compare with backend endpoint
5. Fix endpoint or request

## 🆘 Troubleshooting

### Logs Not Appearing
- Refresh page (Ctrl+Shift+R)
- Check DevTools is open
- Make an API call to trigger logs

### Can't Find Function
- Ensure page loaded completely
- Try `window.getApiDebugLogs()`
- Check for console errors

### Still Getting 404s
- Check backend is running on 3000
- Check backend routes exist
- Check path matches exactly
- Check backend controller exists

## 🎉 Summary

You now have a complete debugging system that tracks:

1. **URL Formation** - How each API URL is built
2. **Request Details** - Headers, method, data
3. **Fetch Execution** - When/where request is sent
4. **Response Status** - HTTP status code
5. **Final URL** - Where request actually went
6. **Errors** - Any error messages

All tracked in browser console with global functions for analysis!

**Status: ✅ COMPLETE AND READY TO DEBUG**

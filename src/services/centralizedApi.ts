/**
 * CENTRALIZED API SERVICE
 * 
 * This is the single source of truth for all API endpoints.
 * All endpoints are defined here with their methods and paths.
 * No hardcoded URLs anywhere else in the codebase.
 */

import { API_CONFIG } from '@/constants/api/config';
import { debugApiCall } from '@/utils/apiDebugger';

// Base configuration
const BASE_URL = API_CONFIG.BASE_URL;
const API_PREFIX = '/api';

// In development mode, use relative paths with Vite proxy
// In production, use absolute URLs from config
const IS_DEV = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

/**
 * Main API Service - All endpoints defined here
 */
export const CentralizedApi = {
  // ===================================================================
  // CONFIGURATION
  // ===================================================================
  
  config: {
    BASE_URL,
    API_PREFIX,
    FULL_BASE_URL: `${BASE_URL}${API_PREFIX}`,
    IS_DEV,
    TIMEOUT: 15000,
  },

  // ===================================================================
  // UTILITY FUNCTIONS
  // ===================================================================

  /**
   * Build URL for API call
   * - Uses relative paths for Vite proxy in dev
   * - Vite proxy configured to forward /api/* to http://localhost:3000
   * - Production builds have no proxy, so they call BASE_URL directly
   */
  buildUrl(endpoint: string): string {
    const relativeUrl = `${API_PREFIX}${endpoint}`;
    
    // Calculate what the full URL would be (for debugging)
    const fullUrl = `http://localhost:3000${relativeUrl}`;
    
    console.group(`🔨 [URL BUILDER] Building endpoint URL`);
    console.log(`  ├─ BASE_URL: ${this.config.BASE_URL}`);
    console.log(`  ├─ API_PREFIX: ${API_PREFIX}`);
    console.log(`  ├─ Endpoint: ${endpoint}`);
    console.log(`  ├─ Built URL (relative): ${relativeUrl}`);
    console.log(`  ├─ Full URL (via proxy): ${fullUrl}`);
    console.log(`  └─ Environment: ${typeof window !== 'undefined' ? window.location.hostname : 'Node'}`);
    console.groupEnd();
    
    return IS_DEV ? relativeUrl : `${BASE_URL}${relativeUrl}`;
  },

  /**
   * Get authorization headers
   */
  getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
    console.log(`🔑 [AUTH HEADERS]`, {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      headers: Object.keys(headers),
    });
    return headers;
  },

  /**
   * Make a generic API call with comprehensive debugging
   */
  async call<T>(
    method: string,
    endpoint: string,
    data?: any,
    options?: { headers?: Record<string, string>; withAuth?: boolean }
  ): Promise<T> {
    // Step 1: Build URL
    console.group(`📡 [API REQUEST] ${method} ${endpoint}`);
    console.log(`  Step 1️⃣ - Building URL`);
    const url = this.buildUrl(endpoint);
    console.log(`    └─ URL Result: ${url}`);
    
    // Debug: Log to global debug store
    debugApiCall(`[${method}] ${endpoint} - Step 1: URL Built`, {
      endpoint,
      method,
      url,
      BASE_URL: this.config.BASE_URL,
      isDevelopment: url.startsWith('/api')
    });

    // Step 2: Get headers
    console.log(`  Step 2️⃣ - Getting headers`);
    const headers = {
      ...this.getAuthHeaders(),
      ...options?.headers,
    };
    console.log(`    └─ Final Headers:`, headers);

    // Step 3: Log request details
    console.log(`  Step 3️⃣ - Request details`);
    console.log(`    ├─ Method: ${method}`);
    console.log(`    ├─ URL: ${url}`);
    console.log(`    ├─ Headers:`, Object.keys(headers));
    if (data) {
      console.log(`    └─ Body: ${JSON.stringify(data).substring(0, 100)}...`);
    }

    try {
      // Step 4: Make fetch call
      console.log(`  Step 4️⃣ - Executing fetch()`);
      const fullUrlPath = `http://localhost:3000${url}`;
      console.log(`    ├─ Relative URL: ${url}`);
      console.log(`    ├─ Full URL: ${fullUrlPath}`);
      console.log(`    └─ Via Vite Proxy: YES (localhost:8080 → localhost:3000)`);
      
      debugApiCall(`[${method}] ${endpoint} - Step 4: Executing Fetch`, {
        relativeUrl: url,
        fullUrl: fullUrlPath,
        viaProxy: true,
        proxyConfig: 'localhost:8080/api/* → localhost:3000/api/*',
        method,
        timestamp: new Date().toISOString()
      });
      
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      console.log(`  Step 5️⃣ - Response received`);
      console.log(`    ├─ Status: ${response.status}`);
      console.log(`    ├─ StatusText: ${response.statusText}`);
      console.log(`    ├─ URL: ${response.url}`);
      console.log(`    └─ OK: ${response.ok}`);
      
      debugApiCall(`[${method}] ${endpoint} - Step 5: Response Received`, {
        status: response.status,
        statusText: response.statusText,
        responseUrl: response.url,
        ok: response.ok
      });

      if (!response.ok) {
        console.log(`  Step 6️⃣ - Error response`);
        const error = await response.json().catch(() => ({}));
        console.error(`    └─ Error message: ${error.message || `HTTP ${response.status}`}`);
        
        debugApiCall(`[${method}] ${endpoint} - Step 6: ERROR Response`, {
          status: response.status,
          error: error.message || `HTTP ${response.status}`,
          endpoint,
          method
        });
        
        const apiError = new Error(error.message || `HTTP ${response.status}`) as Error & { status?: number };
        apiError.status = response.status;
        throw apiError;
      }

      // Step 7: Parse response
      console.log(`  Step 7️⃣ - Parsing response`);
      const result = await response.json();
      console.log(`    └─ Parsed successfully, data keys:`, Object.keys(result));

      console.log(`✅ [SUCCESS] ${method} ${url}`);
      console.groupEnd();
      return result;
    } catch (error) {
      console.error(`❌ [ERROR] ${method} ${url}`);
      console.error(`  Error Details:`, error);
      console.groupEnd();
      throw error;
    }
  },

  // ===================================================================
  // HTTP METHODS
  // ===================================================================

  async get<T>(endpoint: string, options?: any): Promise<T> {
    return this.call('GET', endpoint, undefined, options) as Promise<T>;
  },

  async post<T>(endpoint: string, data?: any, options?: any): Promise<T> {
    return this.call('POST', endpoint, data, options) as Promise<T>;
  },

  async put<T>(endpoint: string, data?: any, options?: any): Promise<T> {
    return this.call('PUT', endpoint, data, options) as Promise<T>;
  },

  async patch<T>(endpoint: string, data?: any, options?: any): Promise<T> {
    return this.call('PATCH', endpoint, data, options) as Promise<T>;
  },

  async delete<T>(endpoint: string, options?: any): Promise<T> {
    return this.call('DELETE', endpoint, undefined, options) as Promise<T>;
  },

  // ===================================================================
  // AUTHENTICATION ENDPOINTS
  // ===================================================================

  auth: {
    login(credentials: { email: string; password: string }) {
      console.log(`🔐 [AUTH] login() called`);
      console.log(`  ├─ Email: ${credentials.email}`);
      console.log(`  └─ Endpoint: /auth/admin-login`);
      return CentralizedApi.post('/auth/admin-login', credentials);
    },

    googleLogin(credential: string) {
      console.log(`🔐 [AUTH] googleLogin() called - Endpoint: /auth/admin-login/google`);
      return CentralizedApi.post('/auth/admin-login/google', { credential });
    },

    sendLoginOtp(email: string) {
      console.log(`🔐 [AUTH] sendLoginOtp() called - Endpoint: /auth/admin-login/otp/send`);
      return CentralizedApi.post('/auth/admin-login/otp/send', { email });
    },

    verifyLoginOtp(email: string, otp: string) {
      console.log(`🔐 [AUTH] verifyLoginOtp() called - Endpoint: /auth/admin-login/otp/verify`);
      return CentralizedApi.post('/auth/admin-login/otp/verify', { email, otp });
    },

    logout() {
      console.log(`🔐 [AUTH] logout() called - Endpoint: /auth/admin-logout`);
      return CentralizedApi.post('/auth/admin-logout', {});
    },

    validateToken() {
      console.log(`🔐 [AUTH] validateToken() called - Endpoint: /auth/validate-token`);
      return CentralizedApi.get('/auth/validate-token');
    },

    getProfile() {
      console.log(`🔐 [AUTH] getProfile() called - Endpoint: /auth/admin`);
      return CentralizedApi.get('/auth/admin');
    },

    refreshToken() {
      console.log(`🔐 [AUTH] refreshToken() called - Endpoint: /auth/refresh-token`);
      return CentralizedApi.post('/auth/refresh-token', {});
    },
  },

  // ===================================================================
  // USER ENDPOINTS
  // ===================================================================

  // ===================================================================
  // USER ENDPOINTS
  // ===================================================================

  users: {
    getAll() {
      console.log(`👥 [USERS] getAll() called - Endpoint: /users/`);
      return CentralizedApi.get('/users/');
    },

    getById(id: string) {
      console.log(`👥 [USERS] getById(${id}) called - Endpoint: /users/${id}`);
      return CentralizedApi.get(`/users/${id}`);
    },

    create(data: any) {
      console.log(`👥 [USERS] create() called - Endpoint: /users/`);
      console.log(`  └─ User data:`, { email: (data as any).email, name: (data as any).name });
      return CentralizedApi.post('/users/', data);
    },

    update(id: string, data: any) {
      console.log(`👥 [USERS] update(${id}) called - Endpoint: /users/${id}`);
      console.log(`  └─ Update data keys:`, Object.keys(data));
      return CentralizedApi.put(`/users/${id}`, data);
    },

    delete(id: string) {
      console.log(`👥 [USERS] delete(${id}) called - Endpoint: /users/${id}`);
      return CentralizedApi.delete(`/users/${id}`);
    },

    verify(userId: string, status: string = 'verified') {
      console.log(`👥 [USERS] verify(${userId}, ${status}) called - Endpoint: /users/${userId}/verify`);
      return CentralizedApi.patch(`/users/${userId}/verify`, { verificationStatus: status });
    },
  },

  // ===================================================================
  // FACE ID CHECK (admin)
  // ===================================================================

  faceReview: {
    /** Face state for a user (Mongo _id): review status and AWS face records. */
    getUser(id: string) {
      return CentralizedApi.get(`/admin/face-review/users/${encodeURIComponent(id)}`);
    },

    /**
     * Which registered user a photo matches. Search only — the backend never
     * stores the photo. Sent as multipart, which call() can't do: it always
     * JSON-encodes the body.
     */
    async search(image: File, userMongoId?: string) {
      const form = new FormData();
      form.append('image', image);
      // The backend looks the user up and compares against every ID their
      // face may be filed under (userId, or _id for users without one).
      if (userMongoId) form.append('id', userMongoId);

      // Let the browser set the multipart Content-Type (with its boundary).
      const { 'Content-Type': _json, ...headers } = CentralizedApi.getAuthHeaders();
      const response = await fetch(CentralizedApi.buildUrl('/admin/face-review/search'), {
        method: 'POST',
        headers,
        body: form,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || `HTTP ${response.status}`);
      return result;
    },

    /** Delete the user's face ID from AWS so they can enrol again. */
    removeFace(id: string, reason?: string) {
      return CentralizedApi.call('DELETE', `/admin/face-review/users/${encodeURIComponent(id)}/face`, { reason });
    },

    /** Face-recognition calls and their estimated cost, per event. Needs an MPIN unlock. */
    usage(costToken: string) {
      return CentralizedApi.get('/admin/face-review/usage', { headers: { 'X-Cost-Token': costToken } });
    },

    /** Rates behind the cost estimate: US$ per check, ₹ per US$. Needs an MPIN unlock. */
    saveCostRates(rates: { usdPerCheck?: number; inrPerUsd?: number }, costToken: string) {
      return CentralizedApi.patch('/admin/face-review/cost-rates', rates, { headers: { 'X-Cost-Token': costToken } });
    },

    // ---- MPIN in front of the cost figures ----
    costPinStatus() {
      return CentralizedApi.get('/admin/face-review/cost-pin');
    },
    setupCostPin(pin: string) {
      return CentralizedApi.post('/admin/face-review/cost-pin/setup', { pin });
    },
    unlockCost(pin: string) {
      return CentralizedApi.post('/admin/face-review/cost-pin/unlock', { pin });
    },
    changeCostPin(currentPin: string, newPin: string) {
      return CentralizedApi.post('/admin/face-review/cost-pin/change', { currentPin, newPin });
    },
    forgotCostPin() {
      return CentralizedApi.post('/admin/face-review/cost-pin/forgot', {});
    },
    resetCostPin(code: string, newPin: string) {
      return CentralizedApi.post('/admin/face-review/cost-pin/reset', { code, newPin });
    },

    /** IDs (userId or _id) that own a face in the face system. */
    faceOwners() {
      return CentralizedApi.get('/admin/face-review/face-owners');
    },

    /** Send one message to chosen users (push + in-app Notifications list). */
    notify(payload: { userIds: string[]; title: string; body: string; purpose?: string }) {
      return CentralizedApi.post('/admin/face-review/notify', payload);
    },

    /** Clear the user's DigiLocker data and notify them to verify with DigiLocker again. */
    resetDigilocker(id: string, reason?: string) {
      return CentralizedApi.call('DELETE', `/admin/face-review/users/${encodeURIComponent(id)}/digilocker`, { reason });
    },
  },

  // ===================================================================
  // BROADCASTS (admin)
  // ===================================================================

  broadcasts: {
    /** Per platform: how many phones an update push reaches, and the store it points to. */
    appUpdatePreview() {
      return CentralizedApi.get('/admin/notifications/app-update');
    },

    /** Change the latest version, force update or store link the app checks at start-up. */
    saveAppVersion(changes: Partial<Record<'ios' | 'android', { latestVersion?: string; forceUpdate?: boolean; storeUrl?: string }>>) {
      return CentralizedApi.patch('/admin/notifications/app-version', changes);
    },

    /**
     * Which users a push can reach: every phone is checked with a Firebase dry
     * run (nothing is sent), and dead registrations are removed.
     */
    reachCheck() {
      return CentralizedApi.post('/admin/notifications/reach-check');
    },

    /** Push "update the app": iPhones get the App Store link, the rest the Play Store. */
    sendAppUpdate(payload: { title: string; body: string; platforms: ('ios' | 'android')[] }) {
      return CentralizedApi.post('/admin/notifications/app-update', payload);
    },
  },

  // ===================================================================
  // EVENT NOTIFICATIONS (admin, per event)
  // ===================================================================

  eventNotifications: {
    /** What has gone out for an event, who each push would reach, and its default wording. */
    get(eventId: string) {
      return CentralizedApi.get(`/admin/notifications/events/${eventId}`);
    },

    /** Send now: "announcement" to every app user, "update" to the event's ticket holders. */
    send(eventId: string, payload: { kind: 'announcement' | 'update'; title?: string; body?: string }) {
      return CentralizedApi.post(`/admin/notifications/events/${eventId}/send`, payload);
    },
  },

  // ===================================================================
  // EVENT ENDPOINTS
  // ===================================================================

  events: {
    getAll() {
      return CentralizedApi.get('/events/');
    },

    getById(id: string) {
      return CentralizedApi.get(`/events/${id}`);
    },

    create(data: any) {
      return CentralizedApi.post('/events/', data);
    },

    update(id: string, data: any) {
      return CentralizedApi.put(`/events/${id}`, data);
    },

    delete(id: string) {
      return CentralizedApi.delete(`/events/${id}`);
    },

    getStats() {
      return CentralizedApi.get('/events/stats');
    },
  },

  // ===================================================================
  // ORGANIZER ENDPOINTS
  // ===================================================================

  organizers: {
    getAll() {
      return CentralizedApi.get('/organizers/');
    },

    getById(id: string) {
      return CentralizedApi.get(`/organizers/${id}`);
    },

    create(data: any) {
      return CentralizedApi.post('/organizers/', data);
    },

    update(id: string, data: any) {
      return CentralizedApi.put(`/organizers/${id}`, data);
    },

    delete(id: string) {
      return CentralizedApi.delete(`/organizers/${id}`);
    },
  },

  // ===================================================================
  // REGISTRATION ENDPOINTS
  // ===================================================================

  registrations: {
    getAll() {
      console.log(`📋 [REGISTRATIONS] getAll() called - Endpoint: /registrations/`);
      return CentralizedApi.get('/registrations/');
    },

    getById(id: string) {
      console.log(`📋 [REGISTRATIONS] getById(${id}) called - Endpoint: /registrations/${id}`);
      return CentralizedApi.get(`/registrations/${id}`);
    },

    create(data: any) {
      console.log(`📋 [REGISTRATIONS] create() called - Endpoint: /registrations/`);
      return CentralizedApi.post('/registrations/', data);
    },

    getByEventId(eventId: string) {
      console.log(`📋 [REGISTRATIONS] getByEventId(${eventId}) called - Endpoint: /registrations/event/${eventId}`);
      return CentralizedApi.get(`/registrations/event/${eventId}`);
    },

    getByUserId(userId: string) {
      console.log(`📋 [REGISTRATIONS] getByUserId(${userId}) called`);
      console.log(`  ├─ User ID: ${userId}`);
      console.log(`  └─ Endpoint: /registrations/users/${userId}`);
      return CentralizedApi.get(`/registrations/users/${userId}`);
    },

    checkIn(registrationId: string) {
      console.log(`📋 [REGISTRATIONS] checkIn(${registrationId}) called - Endpoint: /registrations/${registrationId}/checkin`);
      return CentralizedApi.patch(`/registrations/${registrationId}/checkin`, {});
    },
  },

  // ===================================================================
  // FEEDBACK ENDPOINTS
  // ===================================================================

  feedback: {
    getAll() {
      return CentralizedApi.get('/feedback/');
    },

    getById(id: string) {
      return CentralizedApi.get(`/feedback/${id}`);
    },

    create(data: any) {
      return CentralizedApi.post('/feedback/', data);
    },

    update(id: string, data: any) {
      return CentralizedApi.put(`/feedback/${id}`, data);
    },

    delete(id: string) {
      return CentralizedApi.delete(`/feedback/${id}`);
    },

    getByEventId(eventId: string) {
      return CentralizedApi.get(`/feedback/event/${eventId}`);
    },
  },

  // ===================================================================
  // EMPLOYEE ENDPOINTS
  // ===================================================================

  employees: {
    getAll() {
      return CentralizedApi.get('/employees/');
    },

    getById(id: string) {
      return CentralizedApi.get(`/employees/${id}`);
    },

    create(data: any) {
      return CentralizedApi.post('/employees/', data);
    },

    update(id: string, data: any) {
      return CentralizedApi.put(`/employees/${id}`, data);
    },

    delete(id: string) {
      return CentralizedApi.delete(`/employees/${id}`);
    },
  },

  // ===================================================================
  // TICKET ENDPOINTS
  // ===================================================================

  tickets: {
    getAll() {
      console.log(`🎫 [TICKETS] getAll() called - Endpoint: /tickets/`);
      return CentralizedApi.get('/tickets/');
    },

    getById(id: string) {
      console.log(`🎫 [TICKETS] getById(${id}) called - Endpoint: /tickets/${id}`);
      return CentralizedApi.get(`/tickets/${id}`);
    },

    /**
     * A user's tickets. They live in bookings — there is no /tickets route on
     * the backend. `userMongoId` is the user's _id: bookings reference that.
     * Returns { data: { bookings } }, each with its event and attendees.
     */
    getByUserId(userMongoId: string) {
      return CentralizedApi.get(`/booking/user/${encodeURIComponent(userMongoId)}`);
    },

    /**
     * Admin books tickets for a user without payment. The backend issues and
     * sends one ticket per attendee, as for a paid booking. `attendees` is
     * needed only for more than one ticket; the first should be the user.
     */
    adminBook(payload: {
      userId: string;
      eventId: string;
      seatingId: string;
      seatType: string;
      quantity: number;
      attendees?: { name: string; phone: string }[];
      adminNotes?: string;
    }) {
      return CentralizedApi.post('/booking/admin/book-without-payment', payload);
    },

    /** Send one ticket again (WhatsApp/SMS/email and an app notification). */
    resend(bookingId: string, attendeeId: string) {
      return CentralizedApi.post(
        `/booking/${encodeURIComponent(bookingId)}/attendees/${encodeURIComponent(attendeeId)}/resend`
      );
    },

    create(data: any) {
      console.log(`🎫 [TICKETS] create() called - Endpoint: /tickets/`);
      return CentralizedApi.post('/tickets/', data);
    },

    validate(ticketId: string) {
      console.log(`🎫 [TICKETS] validate(${ticketId}) called - Endpoint: /tickets/${ticketId}/validate`);
      return CentralizedApi.get(`/tickets/${ticketId}/validate`);
    },
  },

  // ===================================================================
  // FACE IMAGE ENDPOINTS
  // ===================================================================

  // ===================================================================
  // FACE IMAGE ENDPOINTS
  // ===================================================================

  faceImages: {
    getAll() {
      console.log(`🖼️ [FACE IMAGES] getAll() called - Endpoint: /uploadedpic/`);
      return CentralizedApi.get('/uploadedpic/');
    },

    getById(id: string) {
      console.log(`🖼️ [FACE IMAGES] getById(${id}) called - Endpoint: /uploadedpic/${id}`);
      return CentralizedApi.get(`/uploadedpic/${id}`);
    },

    upload(data: FormData) {
      console.log(`🖼️ [FACE IMAGES] upload() called - Endpoint: /uploadedpic/upload`);
      return CentralizedApi.post('/uploadedpic/upload', data);
    },

    delete(id: string) {
      console.log(`🖼️ [FACE IMAGES] delete(${id}) called - Endpoint: /uploadedpic/${id}`);
      return CentralizedApi.delete(`/uploadedpic/${id}`);
    },

    compare(imageId1: string, imageId2: string) {
      console.log(`🖼️ [FACE IMAGES] compare(${imageId1}, ${imageId2}) called - Endpoint: /uploadedpic/compare`);
      return CentralizedApi.post(`/uploadedpic/compare`, { imageId1, imageId2 });
    },

    getSignedUrl(userId: string, expiresIn: number = 3600) {
      const endpoint = `/users/${userId}/signed-urls/`;
      console.log(`🖼️ [FACE IMAGES] getSignedUrl(${userId}, ${expiresIn}) called`);
      console.log(`  ├─ User ID: ${userId}`);
      console.log(`  ├─ Expires In: ${expiresIn}s`);
      console.log(`  └─ Endpoint: ${endpoint}`);
      return CentralizedApi.get(endpoint);
    },
  },

  // ===================================================================
  // ANALYTICS ENDPOINTS
  // ===================================================================

  analytics: {
    getDashboardStats() {
      return CentralizedApi.get('/analytics/dashboard-stats');
    },

    getEventAnalytics(eventId: string) {
      return CentralizedApi.get(`/analytics/events/${eventId}`);
    },

    getUserAnalytics() {
      return CentralizedApi.get('/analytics/users');
    },

    getVerificationAnalytics() {
      return CentralizedApi.get('/analytics/verification');
    },
  },

  // ===================================================================
  // ADS MANAGEMENT ENDPOINTS
  // ===================================================================

  ads: {
    getAll() {
      console.log(`📺 [ADS] getAll() called - Endpoint: /ads/`);
      return CentralizedApi.get('/ads/');
    },

    getById(id: string) {
      console.log(`📺 [ADS] getById(${id}) called - Endpoint: /ads/${id}`);
      return CentralizedApi.get(`/ads/${id}`);
    },

    getByOrganizer(organizerId: string) {
      console.log(`📺 [ADS] getByOrganizer(${organizerId}) called - Endpoint: /ads/organizer/${organizerId}`);
      return CentralizedApi.get(`/ads/organizer/${organizerId}`);
    },

    getPending() {
      console.log(`📺 [ADS] getPending() called - Endpoint: /ads/admin/pending-ads`);
      return CentralizedApi.get('/ads/admin/pending-ads');
    },

    create(data: any) {
      console.log(`📺 [ADS] create() called - Endpoint: /ads/`);
      return CentralizedApi.post('/ads/', data);
    },

    update(id: string, data: any) {
      console.log(`📺 [ADS] update(${id}) called - Endpoint: /ads/${id}`);
      return CentralizedApi.patch(`/ads/${id}`, data);
    },

    delete(id: string) {
      console.log(`📺 [ADS] delete(${id}) called - Endpoint: /ads/${id}`);
      return CentralizedApi.delete(`/ads/${id}`);
    },

    approve(id: string) {
      console.log(`📺 [ADS] approve(${id}) called - Endpoint: /ads/${id}/approve`);
      return CentralizedApi.patch(`/ads/${id}/approve`, {});
    },

    reject(id: string, rejectionReason: string) {
      console.log(`📺 [ADS] reject(${id}) called - Endpoint: /ads/${id}/reject`);
      return CentralizedApi.patch(`/ads/${id}/reject`, { rejectionReason });
    },

    recordClick(id: string) {
      console.log(`📺 [ADS] recordClick(${id}) called - Endpoint: /ads/${id}/click`);
      return CentralizedApi.post(`/ads/${id}/click`, {});
    },

    getAnalytics(id: string) {
      console.log(`📺 [ADS] getAnalytics(${id}) called - Endpoint: /ads/${id}/analytics`);
      return CentralizedApi.get(`/ads/${id}/analytics`);
    },

    getActiveAds(targetAudience?: string) {
      const query = targetAudience ? `?targetAudience=${targetAudience}` : '';
      console.log(`📺 [ADS] getActiveAds(${targetAudience || 'all'}) called - Endpoint: /ads/active${query}`);
      return CentralizedApi.get(`/ads/active${query}`);
    },
  },

  // ===================================================================
  // ADMIN ENDPOINTS
  // ===================================================================

  admin: {
    getActivityLog() {
      return CentralizedApi.get('/admin/activity-log');
    },

    getSystemStats() {
      return CentralizedApi.get('/admin/system-stats');
    },

    getHealthStatus() {
      return CentralizedApi.get('/admin/health');
    },
  },
};

export default CentralizedApi;

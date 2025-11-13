/**
 * API DEBUG CONSOLE
 * 
 * Use this to track all API calls and debug URL formation
 * Run in browser console: console.table(window.__API_DEBUG__)
 */

// Global debug storage
if (typeof window !== 'undefined') {
  (window as any).__API_DEBUG__ = [];
  (window as any).__API_LOG__ = true;
}

/**
 * Log API call with all details
 */
export const debugApiCall = (step: string, details: any) => {
  const timestamp = new Date().toISOString();
  const log = {
    timestamp,
    step,
    ...details
  };
  
  if (typeof window !== 'undefined') {
    (window as any).__API_DEBUG__.push(log);
  }
  
  // Also log to console with styling
  console.group(`📡 ${step}`);
  console.log('Timestamp:', timestamp);
  Object.entries(details).forEach(([key, value]) => {
    console.log(`%c${key}:`, 'color: #0066cc; font-weight: bold;', value);
  });
  console.groupEnd();
};

/**
 * Get all API debug logs
 */
export const getApiDebugLogs = () => {
  if (typeof window !== 'undefined') {
    return (window as any).__API_DEBUG__;
  }
  return [];
};

/**
 * Clear API debug logs
 */
export const clearApiDebugLogs = () => {
  if (typeof window !== 'undefined') {
    (window as any).__API_DEBUG__ = [];
    console.log('✅ API debug logs cleared');
  }
};

/**
 * Export API debug logs as JSON
 */
export const exportApiDebugLogs = () => {
  const logs = getApiDebugLogs();
  const json = JSON.stringify(logs, null, 2);
  console.log(json);
  return json;
};

// Make functions available globally for console access
if (typeof window !== 'undefined') {
  (window as any).getApiDebugLogs = getApiDebugLogs;
  (window as any).clearApiDebugLogs = clearApiDebugLogs;
  (window as any).exportApiDebugLogs = exportApiDebugLogs;
}

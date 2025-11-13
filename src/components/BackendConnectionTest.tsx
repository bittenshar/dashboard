/**
 * import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Auth } from '@/services/auth';
import { buildUrl, API_CONFIG } from '@/constants/api/config';CKEND CONNECTION TEST COMPONENT
 * 
 * This component tests the connection to all backend APIs
 * Use this to verify that your backend integration is working
 */

import React, { useState, useEffect } from 'react';
import { api, Auth } from '../services/apiServices.js';

// Define API configuration constants
const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000'
};

// Helper function to build URLs
const buildUrl = (path: string): string => {
  return `${API_CONFIG.BASE_URL}${path}`;
};

interface TestResult {
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: any;
}

interface TestResults {
  [key: string]: TestResult;
}

const BackendConnectionTest = () => {
  const [testResults, setTestResults] = useState<TestResults>({});
  const [loading, setLoading] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'pending' | 'testing' | 'success' | 'partial' | 'failed'>('pending');

  const runTests = async () => {
    setLoading(true);
    setOverallStatus('testing');
    const results: TestResults = {};

    // Test 1: Basic connectivity (public endpoint)
    try {
      console.log('Testing basic connectivity...');
      const response = await fetch(buildUrl('/events/stats'));
      if (response.ok) {
        results.connectivity = { status: 'success', message: 'Backend server is reachable' };
      } else {
        results.connectivity = { status: 'error', message: `Server responded with ${response.status}` };
      }
    } catch (error: any) {
      results.connectivity = { status: 'error', message: `Cannot connect to backend: ${error.message}` };
    }

    // Test 2: Events API
    try {
      console.log('Testing Events API...');
      const events = await api.events.getAll();
      results.events = { 
        status: 'success', 
        message: `Events API working. Found ${Array.isArray(events) ? events.length : 0} events.`,
        data: events
      };
    } catch (error: any) {
      results.events = { status: 'error', message: `Events API error: ${error.message}` };
    }

    // Test 3: Registrations API
    try {
      console.log('Testing Registrations API...');
      const registrations = await api.registrations.getAll();
      results.registrations = { 
        status: 'success', 
        message: `Registrations API working. Found ${Array.isArray(registrations) ? registrations.length : 0} registrations.`,
        data: registrations
      };
    } catch (error: any) {
      results.registrations = { status: 'error', message: `Registrations API error: ${error.message}` };
    }

    // Test 4: Users API
    try {
      console.log('Testing Users API...');
      const users = await api.users.getAll();
      results.users = { 
        status: 'success', 
        message: `Users API working. Found ${Array.isArray(users) ? users.length : 0} users.`,
        data: users
      };
    } catch (error: any) {
      results.users = { status: 'error', message: `Users API error: ${error.message}` };
    }

    // Test 5: Organizers API
    try {
      console.log('Testing Organizers API...');
      const organizers = await api.organizers.getAll();
      results.organizers = { 
        status: 'success', 
        message: `Organizers API working. Found ${Array.isArray(organizers) ? organizers.length : 0} organizers.`,
        data: organizers
      };
    } catch (error: any) {
      results.organizers = { status: 'error', message: `Organizers API error: ${error.message}` };
    }

    // Test 6: Face Images API
    try {
      console.log('Testing Face Images API...');
      const faceImages = await api.faceImages.getAll();
      results.faceImages = { 
        status: 'success', 
        message: `Face Images API working. Found ${Array.isArray(faceImages) ? faceImages.length : 0} face images.`,
        data: faceImages
      };
    } catch (error: any) {
      results.faceImages = { status: 'error', message: `Face Images API error: ${error.message}` };
    }

    // Test 7: Feedback API
    try {
      console.log('Testing Feedback API...');
      const feedback = await api.feedback.getAll();
      results.feedback = { 
        status: 'success', 
        message: `Feedback API working. Found ${Array.isArray(feedback) ? feedback.length : 0} feedback entries.`,
        data: feedback
      };
    } catch (error: any) {
      results.feedback = { status: 'error', message: `Feedback API error: ${error.message}` };
    }

    // Test 8: Tickets API (requires auth, might fail without login)
    try {
      console.log('Testing Tickets API...');
      const tickets = await api.tickets.getAll();
      results.tickets = { 
        status: 'success', 
        message: `Tickets API working. Found ${Array.isArray(tickets) ? tickets.length : 0} tickets.`,
        data: tickets
      };
    } catch (error: any) {
      results.tickets = { status: 'warning', message: `Tickets API: ${error.message} (may require authentication)` };
    }

    // Test 9: Admin API (requires auth and admin role, will likely fail)
    try {
      console.log('Testing Admin API...');
      const activityLog = await api.admin.getActivityLog();
      results.admin = { 
        status: 'success', 
        message: `Admin API working. Activity log accessible.`,
        data: activityLog
      };
    } catch (error: any) {
      results.admin = { status: 'warning', message: `Admin API: ${error.message} (requires admin authentication)` };
    }

    // Determine overall status
    const successCount = Object.values(results).filter(r => r.status === 'success').length;
    const errorCount = Object.values(results).filter(r => r.status === 'error').length;

    if (errorCount === 0 && successCount > 5) {
      setOverallStatus('success');
    } else if (errorCount <= 2 && successCount >= 3) {
      setOverallStatus('partial');
    } else {
      setOverallStatus('failed');
    }

    setTestResults(results);
    setLoading(false);
  };

  const testAuthFlow = async () => {
    try {
      console.log('Testing authentication flow...');
      
      // Try to login with test credentials
      const response = await api.auth.login('test@example.com', 'password');
      
      if (response.success) {
        alert('Authentication test successful! You are now logged in.');
        // Refresh tests to see authenticated endpoints
        await runTests();
      } else {
        alert('Authentication test failed: ' + response.message);
      }
    } catch (error: any) {
      alert('Authentication test error: ' + error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'error': return '#F44336';
      case 'testing': return '#2196F3';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'testing': return '🔄';
      default: return '⏳';
    }
  };

  useEffect(() => {
    // Auto-run tests on component mount
    runTests();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Backend API Connection Test</h1>
      <p>This component tests the connection to all backend APIs to verify integration.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runTests} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#2196F3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Run Tests'}
        </button>
        
        <button 
          onClick={testAuthFlow}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Authentication
        </button>
        
        {Auth.isAuthenticated() && (
          <button 
            onClick={async () => {
              await api.auth.logout();
              alert('Logged out successfully');
              await runTests();
            }}
            style={{ 
              padding: '10px 20px', 
              marginLeft: '10px',
              backgroundColor: '#FF5722', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        )}
      </div>

      <div style={{ 
        padding: '15px', 
        borderRadius: '8px', 
        backgroundColor: getStatusColor(overallStatus) + '20',
        border: `2px solid ${getStatusColor(overallStatus)}`,
        marginBottom: '20px'
      }}>
        <h2>
          {getStatusIcon(overallStatus)} Overall Status: {overallStatus.toUpperCase()}
        </h2>
        {overallStatus === 'success' && <p>🎉 All critical APIs are working correctly!</p>}
        {overallStatus === 'partial' && <p>⚠️ Most APIs are working, but some may require authentication.</p>}
        {overallStatus === 'failed' && <p>❌ Multiple APIs are failing. Check your backend server.</p>}
        {overallStatus === 'testing' && <p>🔄 Running tests...</p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
        {Object.entries(testResults).map(([apiName, result]) => (
          <div 
            key={apiName}
            style={{
              padding: '15px',
              border: `2px solid ${getStatusColor(result.status)}`,
              borderRadius: '8px',
              backgroundColor: getStatusColor(result.status) + '10'
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', textTransform: 'capitalize' }}>
              {getStatusIcon(result.status)} {apiName} API
            </h3>
            <p style={{ margin: '0', fontSize: '14px' }}>{result.message}</p>
            {result.data && (
              <details style={{ marginTop: '10px' }}>
                <summary style={{ cursor: 'pointer', fontSize: '12px', color: '#666' }}>
                  View data ({Array.isArray(result.data) ? result.data.length : 'object'} items)
                </summary>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '10px', 
                  fontSize: '11px', 
                  overflow: 'auto',
                  maxHeight: '200px',
                  marginTop: '5px'
                }}>
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h3>Backend Server Information</h3>
        <p><strong>Base URL:</strong> {API_CONFIG.BASE_URL}</p>
        <p><strong>Authentication:</strong> {Auth.isAuthenticated() ? 'Logged in' : 'Not authenticated'}</p>
        {Auth.isAuthenticated() && (
          <p><strong>Current User:</strong> {JSON.stringify(Auth.getUser())}</p>
        )}
        
        <h4>Next Steps:</h4>
        <ul>
          <li>If all tests pass: Your backend integration is working correctly! ✅</li>
          <li>If connectivity fails: Make sure your backend server is running on http://localhost:3002</li>
          <li>If authentication-required APIs fail: Use the "Test Authentication" button or login through your app</li>
          <li>If specific APIs fail: Check the backend logs for more details</li>
        </ul>
        
        <h4>Available API Services:</h4>
        <ul>
          <li><code>api.auth</code> - Authentication (login, register, logout, upload)</li>
          <li><code>api.events</code> - Events management</li>
          <li><code>api.registrations</code> - User registrations and check-ins</li>
          <li><code>api.users</code> - User management</li>
          <li><code>api.organizers</code> - Organizer management</li>
export default BackendConnectionTest;
        </ul>
      </div>
    </div>
  );
};

export default BackendConnectionTest;

import { useState, useEffect } from 'react';
import { useApiContext } from "@/contexts/ApiIntegrationContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HttpClient } from '@/services/httpClient';
import { buildUrl } from '@/constants/api/config';

const OrganizersDebug = () => {
  const api = useApiContext();

  const handleFetchOrganizers = () => {
    console.log('🔄 Manually fetching organizers...');
    api.fetchOrganizers();
  };

  const checkAuthStatus = () => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('admin_user');
    console.log('🔐 Auth Status:', { token: !!token, user: !!user });
    return { token: !!token, user: !!user };
  };

  const testDirectApiCall = async () => {
    console.log('🧪 Testing direct API call...');
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(buildUrl('/organizers'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('📡 Direct API response status:', response.status);
      const data = await response.json();
      console.log('📦 Direct API response data:', data);
    } catch (error) {
      console.error('❌ Direct API call failed:', error);
    }
  };

  const authStatus = checkAuthStatus();

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Organizers Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold">Authentication Status:</h3>
          <p>Token: {authStatus.token ? '✅ Present' : '❌ Missing'}</p>
          <p>User: {authStatus.user ? '✅ Present' : '❌ Missing'}</p>
        </div>
        
        <div>
          <h3 className="font-semibold">Loading State:</h3>
          <p>{api.loading?.organizers ? 'Loading...' : 'Not loading'}</p>
        </div>
        
        <div>
          <h3 className="font-semibold">Organizers Count:</h3>
          <p>{api.organizers?.length || 0} organizers</p>
        </div>
        
        <div>
          <h3 className="font-semibold">Error State:</h3>
          <p className="text-red-600">{api.errors?.organizers || 'No errors'}</p>
        </div>
        
        <div>
          <h3 className="font-semibold">Raw Data:</h3>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
            {JSON.stringify(api.organizers || [], null, 2)}
          </pre>
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={handleFetchOrganizers}>
            Fetch Organizers
          </Button>
          <Button onClick={testDirectApiCall} variant="outline">
            Test Direct API
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrganizersDebug;

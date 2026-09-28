// src/components/MainContent.tsx

import { Routes, Route, Link } from "react-router-dom";
import { countByVerificationState, unwrapUsers } from "@/lib/verification";
import { Badge } from "@/components/ui/badge";
import { Shield, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useApiContext } from "@/contexts/ApiIntegrationContext";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Dashboard from "@/components/Dashboard";
import { buildUrl } from "../constants/api/config";
import UserVerificationPanelRedesigned from "@/components/UserVerificationPanelRedesigned";
import EventManagement from "@/components/EventManagement";
import OrganiserManagement from "@/components/OrganiserManagement_new";
import BusinessAnalytics from "@/components/BusinessAnalytics";
import AdminProfile from "@/components/AdminProfile";
import PermissionGuard from "./PermissionGuard";
import UserFeedbackSystem from "./UserFeedbackSystem";
import AdminPanel from "./AdminPanel";
import AdsManagement from "./AdsManagement";
import FaceIdCheck from "./FaceIdCheck";
import Notifications from "./Notifications";

const MainContent = () => {
  const api = useApiContext();
  const headerUsers = useMemo(() => unwrapUsers(api.users), [api.users]);
  const verificationCounts = useMemo(() => countByVerificationState(headerUsers), [headerUsers]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Check backend connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log('Attempting to connect to backend...');
        // Try to fetch the simple health endpoint instead of stats
        const response = await fetch(buildUrl('/health'), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok || response.status === 304) {
          // 304 means "Not Modified" - still a successful response
          const data = response.status === 304 ? null : await response.json();
          console.log('Health check data received:', data);
          
          setConnectionStatus('connected');
          setLastSyncTime(new Date().toLocaleTimeString());
          console.log('Backend connection successful');
          
          // If you have state for stats data, you can set it here
          // For example: if (data) setStatsData(data);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Backend connection failed:', error);
        setConnectionStatus('disconnected');
      }
    };

    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle manual refresh
  const handleRefresh = async () => {
    setConnectionStatus('checking');
    try {
      // Only refresh data if authenticated
      if (api.isAuthenticated()) {
        await api.refreshAllData();
        setConnectionStatus('connected');
        setLastSyncTime(new Date().toLocaleTimeString());
      } else {
        console.log('User not authenticated, skipping data refresh');
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      console.error('Failed to refresh data:', error);
    }
  };

  // Get connection status display
  const getConnectionBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <Badge variant="outline" className="gradient-success text-white border-none px-4 py-2 hover-glow">
            <Wifi className="h-4 w-4 mr-2" />
            Backend Connected
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge variant="destructive" className="px-4 py-2">
            <WifiOff className="h-4 w-4 mr-2" />
            Backend Offline
          </Badge>
        );
      case 'checking':
        return (
          <Badge variant="outline" className="px-4 py-2">
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Checking...
          </Badge>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header with Backend Connection Status */}
      <header className="glass sticky top-0 z-40 border-b border-border/20">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold gradient-text">
                Admin Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Facial Recognition Management System
                {lastSyncTime && (
                  <span className="ml-2 text-xs">
                    • Last sync: {lastSyncTime}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {getConnectionBadge()}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={connectionStatus === 'checking'}
              className="px-3 py-1"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${connectionStatus === 'checking' ? 'animate-spin' : ''}`} />
              Sync
            </Button>
            <Badge variant="outline" className="gradient-success text-white border-none px-4 py-2 hover-glow">
              <Shield className="h-4 w-4 mr-2" />
              Secure Access
            </Badge>
            <AdminProfile />
          </div>
        </div>

        {/* Connection Error Alert */}
        {connectionStatus === 'disconnected' && (
          <Alert className="mx-6 mb-4 border-destructive">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Unable to connect to backend server. 
              Please ensure the server is running and try refreshing.
            </AlertDescription>
          </Alert>
        )}

        {/* Data Loading Indicators */}
        {(api.loading.users || api.loading.events || 
          api.loading.registrations || api.loading.organizers) && (
          <div className="px-6 pb-2">
            <div className="text-xs text-muted-foreground flex items-center">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Loading data...
              {api.loading.users && " Users"}
              {api.loading.events && " Events"}
              {api.loading.registrations && " Registrations"}
              {api.loading.organizers && " Organizers"}
            </div>
          </div>
        )}

        {/* Quick Stats Bar — counted live from the loaded lists */}
        {connectionStatus === 'connected' && (
          <div className="px-6 pb-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <span>Users: {headerUsers.length}</span>
              <span>Events: {Array.isArray(api.events) ? api.events.length : 0}</span>
              <Link
                to="/users"
                className={verificationCounts.to_verify > 0 ? "font-semibold text-amber-700 hover:underline" : "hover:underline"}
              >
                To verify: {verificationCounts.to_verify}
              </Link>
              <span>No selfie yet: {verificationCounts.no_selfie}</span>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={
            <PermissionGuard requiredPermission="all">
              <AdminProfile />
            </PermissionGuard>
          } />
          <Route path="/users" element={
            <PermissionGuard requiredPermission="users">
              <UserVerificationPanelRedesigned />
            </PermissionGuard>
          } />
          <Route path="/notifications" element={
            <PermissionGuard requiredPermission="admin">
              <Notifications />
            </PermissionGuard>
          } />
          <Route path="/face-check" element={
            <PermissionGuard requiredPermission="admin">
              <FaceIdCheck />
            </PermissionGuard>
          } />
          <Route path="/events" element={
            <PermissionGuard requiredPermission="events">
              <EventManagement />
            </PermissionGuard>
          } />
          
          <Route path="/ads" element={
            <PermissionGuard requiredPermission="admin">
              <AdsManagement />
            </PermissionGuard>
          } />

          <Route path="/admin" element={
            <PermissionGuard requiredPermission="admin">
              <AdminPanel />
            </PermissionGuard>
          } />
          <Route path="/organisers" element={
            <PermissionGuard requiredPermission="organizers">
              <OrganiserManagement />
            </PermissionGuard>
          } />
          <Route path="/feedback" element={
            <PermissionGuard requiredPermission="feedback">
              <UserFeedbackSystem />
            </PermissionGuard>
          } />
          <Route path="/analytics" element={
            <PermissionGuard requiredPermission="analytics">
              <BusinessAnalytics />
            </PermissionGuard>
          } />
        </Routes>
      </main>
    </div>
  );
};

export default MainContent;

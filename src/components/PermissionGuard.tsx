import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission: string;
  fallback?: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  children, 
  requiredPermission, 
  fallback 
}) => {
  const { user, isLoading } = useAuth();

  // Show loading state while auth is loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Ensure permissions array exists, default to empty array
  const userPermissions = user.permissions || [];

  // Admin has access to everything
  if (user.role === 'Admin' || userPermissions.includes('all')) {
    return <>{children}</>;
  }

  // Check specific permission
  if (userPermissions.includes(requiredPermission)) {
    return <>{children}</>;
  }

  // Show fallback or default unauthorized message
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Alert className="max-w-md mx-auto mt-8">
      <Shield className="h-4 w-4" />
      <AlertDescription>
        You don't have permission to access this section. Contact your administrator for access.
      </AlertDescription>
    </Alert>
  );
};

export default PermissionGuard;
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Edit, 
  Save, 
  X, 
  Shield, 
  Mail, 
  Calendar, 
  Settings, 
  Plus, 
  Users, 
  Trash2,
  Eye,
  Camera,
  BarChart3,
  Briefcase,
  MessageSquare,
  UserCheck,
  Loader2,
  AlertCircle,
  Search,
  Check,
  ChevronsUpDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminService } from '@/services/adminService';
import { testBackendConnection } from '@/utils/testConnection';

interface Employee {
  id: string;
  userId: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  role: 'user' | 'employee' | 'admin';
  permissions: string[];
  avatar?: string;
  faceId?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  aadhaarPhoto?: string;
  uploadedPhoto?: string;
  lastLogin?: string;
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

const availablePermissions = [
  { id: 'user_verification', label: 'User Verification', icon: Camera, description: 'Facial recognition management' },
  { id: 'events', label: 'Event Management', icon: Calendar, description: 'Manage events and tickets' },
  { id: 'organisers', label: 'Organisers', icon: Briefcase, description: 'Manage event organisers' },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare, description: 'User feedback management' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Business insights and reports' },
];

const AdminProfile = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [editedEmail, setEditedEmail] = useState(user?.email || '');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showCreateEmployee, setShowCreateEmployee] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New employee form state
  const [newEmployee, setNewEmployee] = useState({
    userId: '',
    name: '',
    email: '',
    password: '',
    phone: '',
    permissions: [] as string[]
  });

  // Users dropdown state
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserData, setSelectedUserData] = useState<any>(null);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [overrideSelectedUserFields, setOverrideSelectedUserFields] = useState(false);

  // Load employees from backend
  const loadEmployees = async () => {
    setEmployeesLoading(true);
    setError(null);
    try {
      const response = await adminService.getAllEmployees();
      if (response.status === 'success') {
        // Transform backend response to frontend format
        const transformedEmployees = response.data.employees.map((emp: any) => ({
          id: emp._id || emp.userId,
          userId: emp.userId,
          name: emp.name,
          email: emp.email,
          phone: emp.phone || '',
          role: emp.role,
          permissions: emp.permissions || [],
          avatar: emp.avatar,
          faceId: emp.faceId,
          verificationStatus: emp.verificationStatus || 'pending',
          aadhaarPhoto: emp.aadhaarPhoto,
          uploadedPhoto: emp.uploadedPhoto,
          lastLogin: emp.lastLogin,
          status: emp.status || 'active',
          createdAt: emp.createdAt,
          updatedAt: emp.updatedAt
        }));
        setEmployees(transformedEmployees);
        // Also save to localStorage as backup
        localStorage.setItem('employees', JSON.stringify(transformedEmployees));
      }
    } catch (err: any) {
      console.error('Failed to load employees:', err);
      setError(err.message);
      // Fallback to localStorage if backend fails
      const savedEmployees = localStorage.getItem('employees');
      if (savedEmployees) {
        try {
          setEmployees(JSON.parse(savedEmployees));
          toast({
            title: "Offline Mode",
            description: "Using cached employee data. Backend connection failed.",
            variant: "destructive"
          });
        } catch (parseError) {
          console.error('Error parsing localStorage employees:', parseError);
        }
      }
    } finally {
      setEmployeesLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
    loadAvailableUsers();
  }, []);

  // Load available users for dropdown
  const loadAvailableUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await adminService.getAllUsers();
      if (response.status === 'success') {
        // Filter out users who are already employees
        const nonEmployeeUsers = response.data.users?.filter((user: any) => 
          user.role !== 'employee' && user.role !== 'admin'
        ) || [];
        setAvailableUsers(nonEmployeeUsers);
      }
    } catch (err: any) {
      console.error('Failed to load users:', err);
      // Fallback: could add cached users here if needed
    } finally {
      setUsersLoading(false);
    }
  };

  // Handle user selection from dropdown
  const handleUserSelection = async (userId: string) => {
    if (!userId) {
      setSelectedUserData(null);
      setOverrideSelectedUserFields(false);
      setNewEmployee(prev => ({ 
        ...prev, 
        userId: '', 
        name: '', 
        email: '', 
        phone: '' 
      }));
      return;
    }

    try {
      // Find user in available users list first
      const user = availableUsers.find(u => u.userId === userId || u._id === userId);
      if (user) {
        setSelectedUserData(user);
        setOverrideSelectedUserFields(false);
        setNewEmployee(prev => ({
          ...prev,
          userId: user.userId || user._id,
          name: user.fullName || user.name || '',
          email: user.email || '',
          phone: user.phone || ''
        }));
      } else {
        // If not found, fetch from backend
        const response = await adminService.getUserById(userId);
        if (response.status === 'success') {
          const userData = response.data.user;
          setSelectedUserData(userData);
          setOverrideSelectedUserFields(false);
          setNewEmployee(prev => ({
            ...prev,
            userId: userData.userId || userData._id,
            name: userData.fullName || userData.name || '',
            email: userData.email || '',
            phone: userData.phone || ''
          }));
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch user details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user details. Please try again.",
        variant: "destructive"
      });
    }
  };

  const saveEmployees = (updatedEmployees: Employee[]) => {
    setEmployees(updatedEmployees);
    localStorage.setItem('employees', JSON.stringify(updatedEmployees));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Try to update profile via backend
      await adminService.updateAdminProfile({
        name: editedName,
        email: editedEmail
      });
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditing(false);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast({
        title: "Profile Updated Locally",
        description: "Profile saved locally. Backend sync will happen when connection is restored.",
        variant: "destructive"
      });
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async () => {
    if (!newEmployee.userId || !newEmployee.name || !newEmployee.email || !newEmployee.password) {
      toast({
        title: "Error",
        description: "Please select a user and fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setEmployeesLoading(true);
    try {
      // Create employee via backend API
      const response = await adminService.createEmployee({
        userId: newEmployee.userId,
        name: newEmployee.name,
        email: newEmployee.email,
        password: newEmployee.password,
        phone: newEmployee.phone,
        permissions: newEmployee.permissions
      });

      if (response.status === 'success') {
        // Transform backend response to frontend format
        const createdEmployee: Employee = {
          id: response.data.user._id || response.data.user.userId,
          userId: response.data.user.userId,
          name: response.data.user.name,
          email: response.data.user.email,
          phone: response.data.user.phone || newEmployee.phone,
          role: response.data.user.role,
          permissions: response.data.user.permissions || [],
          verificationStatus: 'pending',
          status: 'active',
          createdAt: response.data.user.createdAt || new Date().toISOString(),
          updatedAt: response.data.user.updatedAt || new Date().toISOString(),
        };

        const updatedEmployees = [...employees, createdEmployee];
        saveEmployees(updatedEmployees);

        toast({
          title: "Employee Created",
          description: `${newEmployee.name} has been added successfully.`,
        });

        // Reset form
        setNewEmployee({ userId: '', name: '', email: '', password: '', phone: '', permissions: [] });
        setSelectedUserData(null);
        setShowCreateEmployee(false);
      }
    } catch (error: any) {
      console.error('Failed to create employee:', error);
      
      // Fallback: create employee locally if backend fails
      const employee: Employee = {
        id: Date.now().toString(),
        userId: newEmployee.userId || `user-${Math.random().toString(36).substr(2, 9)}-${Date.now().toString(36)}`,
        name: newEmployee.name,
        email: newEmployee.email,
        phone: newEmployee.phone,
        role: 'employee',
        permissions: newEmployee.permissions,
        verificationStatus: selectedUserData?.verificationStatus || 'pending',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedEmployees = [...employees, employee];
      saveEmployees(updatedEmployees);

      toast({
        title: "Employee Created Locally",
        description: `${newEmployee.name} added locally. Will sync with backend when connection is restored.`,
        variant: "destructive"
      });

      // Reset form
      setNewEmployee({ userId: '', name: '', email: '', password: '', phone: '', permissions: [] });
      setSelectedUserData(null);
      setShowCreateEmployee(false);
    } finally {
      setEmployeesLoading(false);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    setEmployeesLoading(true);
    try {
      await adminService.deleteEmployee(employeeId);
      
      const updatedEmployees = employees.filter(emp => emp.id !== employeeId);
      saveEmployees(updatedEmployees);
      
      toast({
        title: "Employee Deleted",
        description: "Employee has been removed successfully.",
      });
    } catch (error: any) {
      console.error('Failed to delete employee:', error);
      
      // Fallback: delete locally if backend fails
      const updatedEmployees = employees.filter(emp => emp.id !== employeeId);
      saveEmployees(updatedEmployees);
      
      toast({
        title: "Employee Deleted Locally",
        description: "Employee removed locally. Will sync with backend when connection is restored.",
        variant: "destructive"
      });
    } finally {
      setEmployeesLoading(false);
    }
  };

  const handleUpdateEmployeePermissions = async (employeeId: string, permissions: string[]) => {
    try {
      await adminService.updateEmployeePermissions(employeeId, permissions);
      
      const updatedEmployees = employees.map(emp => 
        emp.id === employeeId ? { ...emp, permissions, updatedAt: new Date().toISOString() } : emp
      );
      saveEmployees(updatedEmployees);
      
      toast({
        title: "Permissions Updated",
        description: "Employee permissions have been updated successfully.",
      });
    } catch (error: any) {
      console.error('Failed to update employee permissions:', error);
      
      // Fallback: update locally if backend fails
      const updatedEmployees = employees.map(emp => 
        emp.id === employeeId ? { ...emp, permissions, updatedAt: new Date().toISOString() } : emp
      );
      saveEmployees(updatedEmployees);
      
      toast({
        title: "Permissions Updated Locally",
        description: "Permissions updated locally. Will sync with backend when connection is restored.",
        variant: "destructive"
      });
    }
  };

  const handlePermissionToggle = (permissionId: string, isForNewEmployee = false) => {
    if (isForNewEmployee) {
      setNewEmployee(prev => ({
        ...prev,
        permissions: prev.permissions.includes(permissionId)
          ? prev.permissions.filter(p => p !== permissionId)
          : [...prev.permissions, permissionId]
      }));
    } else if (selectedEmployee) {
      const updatedPermissions = selectedEmployee.permissions.includes(permissionId)
        ? selectedEmployee.permissions.filter(p => p !== permissionId)
        : [...selectedEmployee.permissions, permissionId];
      
      setSelectedEmployee({ ...selectedEmployee, permissions: updatedPermissions });
      handleUpdateEmployeePermissions(selectedEmployee.id, updatedPermissions);
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const handleTestConnection = async () => {
    const result = await testBackendConnection();
    
    toast({
      title: result.success ? "Connection Test Passed" : "Connection Test Failed",
      description: result.message,
      variant: result.success ? "default" : "destructive"
    });
  };

  const handleRefreshEmployees = () => {
    loadEmployees();
  };

  const handleRefreshUsers = () => {
    loadAvailableUsers();
  };

  const handleCloseCreateEmployee = () => {
    setNewEmployee({ userId: '', name: '', email: '', password: '', phone: '', permissions: [] });
    setSelectedUserData(null);
    setOverrideSelectedUserFields(false);
    setUserSearchOpen(false);
    setShowCreateEmployee(false);
  };

  if (!user) return null;

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Admin Profile</h1>
          <p className="text-muted-foreground">Manage your profile and employee access</p>
        </div>
        <Badge variant="outline" className="gradient-success text-white border-none px-4 py-2">
          <Shield className="h-4 w-4 mr-2" />
          Administrator
        </Badge>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>My Profile</span>
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Employee Management</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Profile Information</span>
              </CardTitle>
              <CardDescription>Manage your admin account details and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
                <div className="relative">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="h-20 w-20 rounded-full object-cover border-4 border-background shadow-lg"
                    />
                  ) : (
                    <div className="h-20 w-20 bg-gradient-to-r from-primary to-primary/70 rounded-full flex items-center justify-center">
                      <User className="h-10 w-10 text-primary-foreground" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-success rounded-full border-4 border-background flex items-center justify-center">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{user.name}</h3>
                  <Badge variant="secondary" className="mt-1">
                    {user.role}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    Last login: {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Profile Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={isEditing ? editedName : user.name}
                      onChange={(e) => setEditedName(e.target.value)}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      value={isEditing ? editedEmail : user.email}
                      onChange={(e) => setEditedEmail(e.target.value)}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={user.role}
                      disabled
                      className="pl-10 bg-muted/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Account Status</Label>
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-3 h-4 w-4 text-success" />
                    <Input
                      value="Active"
                      disabled
                      className="pl-10 bg-muted/50"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4 border-t">
                <div className="space-x-2">
                  {isEditing ? (
                    <>
                      <Button onClick={handleSaveProfile} className="hover-scale" disabled={loading}>
                        {loading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                      <Button 
                        onClick={() => setIsEditing(false)} 
                        variant="outline"
                        disabled={loading}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)} variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
                
                <Button 
                  onClick={handleLogout} 
                  variant="destructive"
                  className="hover-scale"
                >
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Employee Management</h2>
              <p className="text-muted-foreground">Create and manage employee accounts with custom permissions</p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleTestConnection} variant="outline" size="sm">
                Test Backend
              </Button>
              <Button onClick={handleRefreshEmployees} variant="outline" size="sm" disabled={employeesLoading}>
                {employeesLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
              </Button>
              <Button onClick={() => setShowCreateEmployee(true)} className="hover-scale" disabled={employeesLoading}>
                <Plus className="h-4 w-4 mr-2" />
                Create Employee
              </Button>
            </div>
          </div>

            <div className="grid gap-6">
            {employeesLoading && employees.length === 0 && (
              <Card className="glass">
                <CardContent className="p-12 text-center">
                  <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-semibold mb-2">Loading Employees</h3>
                  <p className="text-muted-foreground">Please wait while we fetch employee data...</p>
                </CardContent>
              </Card>
            )}

            {error && !employeesLoading && employees.length === 0 && (
              <Card className="glass border-destructive">
                <CardContent className="p-12 text-center">
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-destructive">Error Loading Employees</h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button onClick={handleRefreshEmployees} variant="outline">
                    <Loader2 className={`h-4 w-4 mr-2 ${employeesLoading ? 'animate-spin' : ''}`} />
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            {!employeesLoading && !error && employees.length > 0 && employees.map((employee) => (
              <Card key={employee.id} className="glass">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        {employee.avatar ? (
                          <img 
                            src={employee.avatar} 
                            alt={employee.name}
                            className="h-16 w-16 rounded-full object-cover border-2 border-primary/20"
                          />
                        ) : (
                          <div className="h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <User className="h-8 w-8 text-white" />
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-background ${
                          employee.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{employee.name}</h3>
                        <p className="text-muted-foreground">{employee.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {employee.role}
                          </Badge>
                          <Badge variant={employee.verificationStatus === 'verified' ? 'default' : 
                                        employee.verificationStatus === 'pending' ? 'secondary' : 'destructive'} 
                                 className="text-xs">
                            {employee.verificationStatus}
                          </Badge>
                          <Badge variant={employee.status === 'active' ? 'default' : 'destructive'} 
                                 className="text-xs">
                            {employee.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedEmployee(employee)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Manage Permissions
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteEmployee(employee.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">User ID</p>
                      <p className="text-sm font-mono bg-muted/50 p-1 rounded text-xs">{employee.userId}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Phone</p>
                      <p className="text-sm">{employee.phone || 'Not provided'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Face ID</p>
                      <p className="text-sm">{employee.faceId ? 'Registered' : 'Not registered'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Last Login</p>
                      <p className="text-sm">{employee.lastLogin ? new Date(employee.lastLogin).toLocaleDateString() : 'Never'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Created</p>
                      <p className="text-sm">{new Date(employee.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Updated</p>
                      <p className="text-sm">{new Date(employee.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {(employee.aadhaarPhoto || employee.uploadedPhoto) && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Documents</p>
                      <div className="flex space-x-2">
                        {employee.aadhaarPhoto && (
                          <Badge variant="outline" className="text-xs">
                            Aadhaar Photo
                          </Badge>
                        )}
                        {employee.uploadedPhoto && (
                          <Badge variant="outline" className="text-xs">
                            Uploaded Photo
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <Separator className="my-4" />
                  
                  <div>
                    <h4 className="font-medium mb-2">Current Permissions:</h4>
                    <div className="flex flex-wrap gap-2">
                      {employee.permissions.length > 0 ? (
                        employee.permissions.map((permission) => {
                          const permissionData = availablePermissions.find(p => p.id === permission);
                          return (
                            <Badge key={permission} variant="secondary">
                              {permissionData?.icon && <permissionData.icon className="h-3 w-3 mr-1" />}
                              {permissionData?.label || permission}
                            </Badge>
                          );
                        })
                      ) : (
                        <span className="text-muted-foreground text-sm">No permissions assigned</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {!employeesLoading && !error && employees.length === 0 && (
              <Card className="glass">
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Employees Yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first employee account to get started.</p>
                  <Button onClick={() => setShowCreateEmployee(true)} disabled={employeesLoading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Employee
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Employee Dialog */}
      <Dialog open={showCreateEmployee} onOpenChange={handleCloseCreateEmployee}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Employee</DialogTitle>
            <DialogDescription>
              Select an existing user and assign employee permissions for different sections.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* User Selection Section */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Label className="text-base font-semibold">Select User to Convert to Employee</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose from existing users in the system
                  </p>
                </div>
                <Button onClick={handleRefreshUsers} variant="outline" size="sm" disabled={usersLoading}>
                  {usersLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh Users"}
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="user-select">User Selection with Search *</Label>
                <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={userSearchOpen}
                      className="w-full justify-between h-auto min-h-[40px] p-3"
                      disabled={usersLoading}
                    >
                      <div className="flex items-center space-x-2 flex-1 text-left">
                        {newEmployee.userId ? (
                          <>
                            <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                              {newEmployee.userId}
                            </span>
                            <span className="font-medium">
                              {selectedUserData?.fullName || selectedUserData?.name || "Unknown User"}
                            </span>
                            <span className="text-muted-foreground">
                              ({selectedUserData?.email || "No email"})
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            {usersLoading ? "Loading users..." : "Search and select a user..."}
                          </span>
                        )}
                      </div>
                      {usersLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Search users by name, email, or user ID..." 
                        className="h-9"
                      />
                      <CommandEmpty>
                        <div className="p-4 text-center">
                          <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No users found.</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Try adjusting your search or refresh users list.
                          </p>
                        </div>
                      </CommandEmpty>
                      <CommandList className="max-h-[300px] overflow-y-auto">
                        <CommandGroup>
                          {usersLoading ? (
                            <div className="p-4 text-center">
                              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">Loading users...</p>
                            </div>
                          ) : (
                            availableUsers.map((user) => (
                              <CommandItem
                                key={user._id || user.userId}
                                value={`${user.fullName || user.name} ${user.email} ${user.userId || user._id}`}
                                onSelect={() => {
                                  handleUserSelection(user.userId || user._id);
                                  setUserSearchOpen(false);
                                }}
                                className="cursor-pointer"
                              >
                                <div className="flex items-center space-x-2 w-full">
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      newEmployee.userId === (user.userId || user._id)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    }`}
                                  />
                                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                                    <span className="font-mono text-xs bg-muted px-1 rounded shrink-0">
                                      {user.userId || user._id}
                                    </span>
                                    <span className="font-medium truncate">
                                      {user.fullName || user.name}
                                    </span>
                                    <span className="text-muted-foreground text-sm truncate">
                                      ({user.email})
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1 shrink-0">
                                    <Badge variant="outline" className="text-xs">
                                      {user.verificationStatus || 'pending'}
                                    </Badge>
                                    {user.status && user.status !== 'active' && (
                                      <Badge variant="destructive" className="text-xs">
                                        {user.status}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </CommandItem>
                            ))
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                
                {/* Quick Stats */}
                {!usersLoading && availableUsers.length > 0 && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                    <span>📊 {availableUsers.length} users available</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleRefreshUsers}
                      className="h-auto p-1 text-xs"
                    >
                      🔄 Refresh
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* User Details Section - Auto-filled */}
            {selectedUserData && (
              <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-green-800 text-lg">Selected User Complete Profile</h3>
                  <Badge variant="outline" className="bg-white">
                    ID: {selectedUserData.userId || selectedUserData._id}
                  </Badge>
                </div>
                
                {/* User Avatar and Basic Info */}
                <div className="flex items-center space-x-4 mb-6 p-4 bg-white rounded-lg shadow-sm">
                  <div className="relative">
                    {selectedUserData.uploadedPhoto ? (
                      <div className="relative">
                        <img 
                          src={selectedUserData.uploadedPhoto} 
                          alt={selectedUserData.fullName || selectedUserData.name}
                          className="h-20 w-20 rounded-full object-cover border-4 border-green-200"
                          onError={(e) => {
                            // Hide image and show fallback avatar
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.querySelector('.fallback-avatar') as HTMLElement;
                            if (fallback) {
                              fallback.style.display = 'flex';
                            }
                          }}
                        />
                        <div className="fallback-avatar hidden h-20 w-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full items-center justify-center absolute top-0 left-0 border-4 border-green-200">
                          <User className="h-10 w-10 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="h-20 w-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center border-4 border-green-200">
                        <User className="h-10 w-10 text-white" />
                      </div>
                    )}
                    <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-white ${
                      selectedUserData.status === 'active' ? 'bg-green-500' : 
                      selectedUserData.status === 'suspended' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-800">
                      {selectedUserData.fullName || selectedUserData.name}
                    </h4>
                    <p className="text-gray-600">{selectedUserData.email}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant={selectedUserData.role === 'user' ? 'secondary' : 'default'}>
                        {selectedUserData.role}
                      </Badge>
                      <Badge variant={
                        selectedUserData.verificationStatus === 'verified' ? 'default' : 
                        selectedUserData.verificationStatus === 'pending' ? 'secondary' : 'destructive'
                      }>
                        {selectedUserData.verificationStatus || 'pending'}
                      </Badge>
                      <Badge variant={selectedUserData.status === 'active' ? 'default' : 'destructive'}>
                        {selectedUserData.status || 'active'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Detailed Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <div className="space-y-1 p-3 bg-white rounded-lg">
                    <p className="text-xs font-medium text-green-700 flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      User ID
                    </p>
                    <p className="text-sm font-mono bg-green-100 p-2 rounded text-xs break-all">
                      {selectedUserData.userId || selectedUserData._id}
                    </p>
                  </div>
                  
                  <div className="space-y-1 p-3 bg-white rounded-lg">
                    <p className="text-xs font-medium text-green-700 flex items-center">
                      <Mail className="h-3 w-3 mr-1" />
                      Email Address
                    </p>
                    <p className="text-sm break-all">{selectedUserData.email}</p>
                  </div>
                  
                  <div className="space-y-1 p-3 bg-white rounded-lg">
                    <p className="text-xs font-medium text-green-700">Phone Number</p>
                    <p className="text-sm">{selectedUserData.phone || 'Not provided'}</p>
                  </div>
                  
                  <div className="space-y-1 p-3 bg-white rounded-lg">
                    <p className="text-xs font-medium text-green-700">Full Name</p>
                    <p className="text-sm font-medium">{selectedUserData.fullName || selectedUserData.name}</p>
                  </div>
                  
                  <div className="space-y-1 p-3 bg-white rounded-lg">
                    <p className="text-xs font-medium text-green-700 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Last Login
                    </p>
                    <p className="text-sm">
                      {selectedUserData.lastLogin ? 
                        new Date(selectedUserData.lastLogin).toLocaleString() : 
                        'Never logged in'
                      }
                    </p>
                  </div>
                  
                  <div className="space-y-1 p-3 bg-white rounded-lg">
                    <p className="text-xs font-medium text-green-700">Account Created</p>
                    <p className="text-sm">
                      {selectedUserData.createdAt ? 
                        new Date(selectedUserData.createdAt).toLocaleDateString() : 
                        'Unknown'
                      }
                    </p>
                  </div>
                  
                  <div className="space-y-1 p-3 bg-white rounded-lg">
                    <p className="text-xs font-medium text-green-700">Last Updated</p>
                    <p className="text-sm">
                      {selectedUserData.updatedAt ? 
                        new Date(selectedUserData.updatedAt).toLocaleDateString() : 
                        'Unknown'
                      }
                    </p>
                  </div>
                  
                  <div className="space-y-1 p-3 bg-white rounded-lg">
                    <p className="text-xs font-medium text-green-700 flex items-center">
                      <Camera className="h-3 w-3 mr-1" />
                      Profile Photo
                    </p>
                    <p className="text-sm">
                      {selectedUserData.uploadedPhoto ? 'Available' : 'Not uploaded'}
                    </p>
                  </div>
                </div>

                {/* Additional Information */}
                {selectedUserData.permissions && selectedUserData.permissions.length > 0 && (
                  <div className="mt-4 p-3 bg-white rounded-lg">
                    <p className="text-xs font-medium text-green-700 mb-2">Current Permissions</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedUserData.permissions.map((permission, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

               
              </div>
            )}

            {/* Employee Details Form */}

              {selectedUserData && (
                <div className="flex items-center justify-end -mt-2 mb-2">
                  <Label htmlFor="override-fields" className="mr-2 text-sm">Edit selected user details</Label>
                  <Switch
                    id="override-fields"
                    checked={overrideSelectedUserFields}
                    onCheckedChange={(v) => setOverrideSelectedUserFields(!!v)}
                  />
                </div>
              )}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              <div className="space-y-2">
                <Label htmlFor="emp-name">Full Name *</Label>
                <Input
                  id="emp-name"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter employee name"
                  disabled={!!selectedUserData && !overrideSelectedUserFields}
                  className={!!selectedUserData && !overrideSelectedUserFields ? "bg-muted" : ""}
                />
              </div>
              
             

              <div className="space-y-2">
                <Label htmlFor="emp-email">Email Address *</Label>
                <Input
                  id="emp-email"
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                  disabled={!!selectedUserData && !overrideSelectedUserFields}
                  className={!!selectedUserData && !overrideSelectedUserFields ? "bg-muted" : ""}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emp-phone">Phone Number</Label>
                <Input
                  id="emp-phone"
                  value={newEmployee.phone}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                  disabled={!!selectedUserData && !overrideSelectedUserFields}
                  className={!!selectedUserData && !overrideSelectedUserFields ? "bg-muted" : ""}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emp-password">Employee Password *</Label>
                <Input
                  id="emp-password"
                  value={newEmployee.password}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Set employee access password"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Assign Permissions</Label>
              <p className="text-sm text-muted-foreground">
                Select which sections this employee can access:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availablePermissions.map((permission) => (
                  <div key={permission.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={permission.id}
                      checked={newEmployee.permissions.includes(permission.id)}
                      onCheckedChange={() => handlePermissionToggle(permission.id, true)}
                    />
                    <div className="flex items-center space-x-2 flex-1">
                      <permission.icon className="h-4 w-4 text-primary" />
                      <div>
                        <Label htmlFor={permission.id} className="font-medium cursor-pointer">
                          {permission.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{permission.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={handleCloseCreateEmployee} disabled={employeesLoading}>
                Cancel
              </Button>
              <Button onClick={handleCreateEmployee} className="hover-scale" disabled={employeesLoading || !newEmployee.userId}>
                {employeesLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create Employee
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Permissions Dialog */}
      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Manage Permissions - {selectedEmployee?.name}</DialogTitle>
            <DialogDescription>
              Update permissions for this employee account.
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-4">
              <div className="grid gap-3">
                {availablePermissions.map((permission) => (
                  <div key={permission.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={`edit-${permission.id}`}
                      checked={selectedEmployee.permissions.includes(permission.id)}
                      onCheckedChange={() => handlePermissionToggle(permission.id)}
                    />
                    <div className="flex items-center space-x-2 flex-1">
                      <permission.icon className="h-4 w-4 text-primary" />
                      <div>
                        <Label htmlFor={`edit-${permission.id}`} className="font-medium cursor-pointer">
                          {permission.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{permission.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={() => setSelectedEmployee(null)}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProfile;

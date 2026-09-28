/**
 * User Verification Panel (Admin Version)
 *
 * - Only fetches pre-signed URLs for users with verificationStatus = "pending"
 * - Uses admin JWT token for authentication
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ScanFace } from "lucide-react";
import { verificationState } from "@/lib/verification";
import { useFaceOwners } from "@/hooks/useFaceOwners";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CentralizedApi from "@/services/centralizedApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Mail,
  Phone,
  User,
  UserPlus,
  List,
  Users,
  RefreshCw,
} from "lucide-react";
import UserDetailsModal from "./UserDetailsModal";
import CreateUserModal from "./CreateUserModal";
import { useApiContext } from "@/contexts/ApiIntegrationContext";
import { useToast } from "@/hooks/use-toast";

// User interface
interface User {
  userId: string;
  email: string;
  phone?: string;
  fullName?: string;
  name?: string;
  role: "user" | "employee" | "admin";
  faceId?: boolean | number | null;
  verificationStatus: "pending" | "verified" | "rejected";
  aadhaarPhoto?: string | null;
  uploadedPhoto?: string | null;
  status: "active" | "suspended";
  createdAt?: string | Date;
  lastLogin?: string | Date;
  lastLoginFormatted?: string;
  _id?: string;
}

// Component
const UserVerificationPanel = () => {
  const api = useApiContext();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Debugging function for consistent logging
  const debugLog = (message: string, data: any = {}) => {
    console.log(`🔍 UserVerificationPanel - ${message}:`, {
      timestamp: new Date().toISOString(),
      ...data
    });
  };
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const navigate = useNavigate();
  const { hasFaceId } = useFaceOwners();
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [aadhaarPreviews, setAadhaarPreviews] = useState<{
    [key: string]: string | null;
  }>({});

  // 🟢 Filter users from API
  useEffect(() => {
    let usersArray: any[] = [];

    if (Array.isArray(api.users)) {
      usersArray = api.users;
    } else if (api.users && typeof api.users === "object") {
      const obj = api.users as any;
      if (Array.isArray(obj.users)) {
        usersArray = obj.users;
      } else if (obj.data && Array.isArray(obj.data.users)) {
        usersArray = obj.data.users;
      } else if (Array.isArray(obj.data)) {
        usersArray = obj.data;
      }
    }

    // Keep a copy for header counts and lookups
    setAllUsers(usersArray);

    let filtered = [...usersArray];
    // Cards are for the admin's actual queue: pending with a selfie to review.
    let pending = filtered.filter((user) => verificationState(user) === "to_verify");

    if (searchTerm) {
      filtered = filtered.filter((user) => {
        const displayName = getUserDisplayName(user).toLowerCase();
        const email = user.email?.toLowerCase() || "";
        const phone = user.phone?.toLowerCase() || "";
        const userId = getUserId(user).toLowerCase();

        return (
          displayName.includes(searchTerm.toLowerCase()) ||
          email.includes(searchTerm.toLowerCase()) ||
          phone.includes(searchTerm.toLowerCase()) ||
          userId.includes(searchTerm.toLowerCase())
        );
      });
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (user) => user.verificationStatus === statusFilter
      );
    }

    setFilteredUsers(filtered);
    setPendingUsers(pending);
  }, [api.users, searchTerm, statusFilter]);

  const getUserId = (user: any): string => user.userId || user._id || "";

  const handleVerifyUser = async (userId: string) => {
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      await api.verifyUser(userId);
      await api.fetchUsers();
    } catch (error) {
      console.error("Failed to verify user:", error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleRejectUser = async (userId: string) => {
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      await api.updateUser(userId, { verificationStatus: "rejected" });
      await api.fetchUsers();
    } catch (error) {
      console.error("Failed to reject user:", error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      switch (newStatus) {
        case "verified":
          await api.verifyUser(userId);
          break;
        case "rejected":
          await api.updateUser(userId, { verificationStatus: "rejected" });
          break;
        case "pending":
          await api.updateUser(userId, { verificationStatus: "pending" });
          break;
      }
      await api.fetchUsers();
    } catch (error) {
      console.error("Failed to update user status:", error);
    }
  };

  const handleViewDetails = (user: any) => {
    // Track where this function is being called from
    const callerInfo = new Error().stack?.split('\n')[2] || 'unknown caller';
    debugLog(`handleViewDetails called from ${callerInfo}`, { rawUser: user });
    
    // Process and normalize the user data before passing to modal
    // This ensures consistent faceId handling
    if (!user) {
      toast({
        title: "Error",
        description: "Cannot display user details - missing data",
        variant: "destructive",
      });
      debugLog("Attempted to view details of null user!", { stack: new Error().stack });
      return;
    }
    
    try {
      // Create a deep copy to avoid reference issues
      const normalizedUser = JSON.parse(JSON.stringify(user));
      
      // Ensure faceId is properly normalized as a boolean
      normalizedUser.faceId = isFaceGenerated(user);
      
      // Double-check we have minimum required fields
      if (!normalizedUser.userId && normalizedUser._id) {
        normalizedUser.userId = normalizedUser._id;
      }
      
      debugLog("User data normalized for modal", {
        userId: getUserId(user),
        originalFaceId: user.faceId,
        originalType: typeof user.faceId,
        evaluatedValue: isFaceGenerated(user),
        normalizedFaceId: normalizedUser.faceId,
      });
      
      // First set the user, then open the modal to ensure data is ready
      setSelectedUser(normalizedUser);
      // Use a small timeout to ensure React has processed the state update
      setTimeout(() => setIsModalOpen(true), 10);
    } catch (error) {
      debugLog("Error normalizing user data", { error, user });
      toast({
        title: "Error",
        description: "Failed to prepare user data for display",
        variant: "destructive",
      });
    }
  };

  const handleAadhaarFileChange = (userId: string, file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setAadhaarPreviews((prev) => ({ ...prev, [userId]: previewUrl }));
    toast({
      title: "Aadhaar Image Selected",
      description: `${file.name} ready for verification`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            Verified
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        );
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getOutlineColor = (status: string) => {
    if (status === "verified") return "border-green-500";
    if (status === "pending") return "border-yellow-500";
    if (status === "rejected") return "border-red-500";
    return "border-gray-300";
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  // Whether the user really has a face in the face system (not whether a
  // photo is on file). False until the shared list has loaded.
  const isFaceGenerated = (user: any): boolean => hasFaceId(user) === true;

  const getLastLoginText = (user: any): string => {
    if (user?.lastLoginFormatted) return user.lastLoginFormatted;
    return formatDate(user?.lastLogin);
  };

  const getUserDisplayName = (user: any): string => {
    if (user.fullName) return user.fullName;
    if (user.name) return user.name;
    if (user.email) {
      const emailName = user.email.split("@")[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    const id = getUserId(user);
    return `User ${id.substring(0, 6)}...`;
  };

  // Effect to ensure modal state is correctly managed
  useEffect(() => {
    // Reset modal state on component mount
    setIsModalOpen(false);
    setSelectedUser(null);
    
    // Clean up on unmount
    return () => {
      setIsModalOpen(false);
      setSelectedUser(null);
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">
            User Verification Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage facial recognition verification for event attendees
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="px-3 py-1">
            Total: {allUsers.length}
          </Badge>
          <Badge className="bg-green-100 text-green-800 px-3 py-1">
            Verified:{" "}
            {allUsers.filter((u) => u.verificationStatus === "verified").length}
          </Badge>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 px-3 py-1">
            To verify: {pendingUsers.length || 0}
          </Badge>
          <Badge variant="destructive" className="px-3 py-1">
            Rejected:{" "}
            {allUsers.filter((u) => u.verificationStatus === "rejected").length}
          </Badge>

          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Create New User
          </Button>
        </div>
      </div>

      

      {/* Pending Verification Cards Section */}
      {pendingUsers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <h2 className="text-2xl font-bold text-yellow-600">Waiting for Verification</h2>
            <Badge className="bg-yellow-100 text-yellow-800">{pendingUsers.length}</Badge>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {pendingUsers.map((user) => {
              const status = user.verificationStatus || 'pending';
              const userId = getUserId(user);
              
              return (
                <Card key={userId} className="card-enhanced hover-lift border-yellow-200 bg-yellow-50/50">
                  <CardContent className="p-6">
                    {/* Header with name and status */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {getUserDisplayName(user)}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center space-x-2 mt-1">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{user.phone}</span>
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>

                    {/* User Info */}
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Role:</span>
                        <span className="capitalize">{user.role || 'user'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span className="capitalize">{user.status || 'active'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Face ID:</span>
                        <span className="flex items-center">
                          {hasFaceId(user) === null ? (
                            <span className="text-gray-400">Checking…</span>
                          ) : hasFaceId(user) ? (
                            <><CheckCircle className="h-3 w-3 text-green-500 mr-1" /> Active</>
                          ) : (
                            <><XCircle className="h-3 w-3 text-red-500 mr-1" /> None</>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Registered:</span>
                        <span>{formatDate(user.createdAt)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1" 
                        onClick={() => handleViewDetails(user)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 gradient-success text-white border-none hover-glow"
                        onClick={() => navigate(`/face-check?user=${encodeURIComponent(user._id || user.id || userId)}`)}
                      >
                        <ScanFace className="h-4 w-4 mr-1" />
                        Review in Face ID Check
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* All Users Table Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <List className="h-5 w-5 text-gray-600" />
            <h2 className="text-2xl font-bold">All Users</h2>
            <Badge variant="outline">{api.users?.length || 0} users</Badge>
          </div>
          
          {/* Filters */}
          <Card className="w-fit">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    className="pl-10 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  onClick={() => {
                    console.log('🔄 Manual refresh triggered');
                    api.forceRefreshUsers();
                  }} 
                  variant="outline"
                  disabled={api.loading.users}
                >
                  {api.loading.users ? 'Loading...' : 'Refresh'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {api.loading.users && (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <div className="animate-pulse">Loading users...</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {api.errors.users && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <p className="text-red-600">Error loading users: {api.errors.users}</p>
              <Button onClick={() => api.fetchUsers()} className="mt-2">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        {!api.loading.users && !api.errors.users && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verification</TableHead>
                    
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const userId = getUserId(user);
                    const status = user.verificationStatus || 'pending';
                    
                    return (
                      <TableRow key={userId} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-400" />
                            </div>
                            <span>{getUserDisplayName(user)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {user.role || 'user'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                            {user.status || 'active'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={status} 
                            onValueChange={(newStatus) => handleStatusChange(userId, newStatus)}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue>{getStatusBadge(status)}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">
                                <div className="flex items-center space-x-2">
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
                                </div>
                              </SelectItem>
                              <SelectItem value="verified">
                                <div className="flex items-center space-x-2">
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Verified</Badge>
                                </div>
                              </SelectItem>
                              <SelectItem value="rejected">
                                <div className="flex items-center space-x-2">
                                  <Badge variant="destructive">Rejected</Badge>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{getLastLoginText(user)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleViewDetails(user)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            
                            {status === "pending" && (
                              <>
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => handleVerifyUser(userId)}
                                  disabled={actionLoading[userId]}
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleRejectUser(userId)}
                                  disabled={actionLoading[userId]}
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                            
                            {status === "rejected" && (
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleVerifyUser(userId)}
                                disabled={actionLoading[userId]}
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Empty State */}
              {filteredUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No users found</h3>
                  <p className="text-gray-500 text-center">
                    {searchTerm || statusFilter !== "all" 
                      ? "Try adjusting your search or filter criteria"
                      : "No users have been registered yet"
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Only render modal when we have a selected user */}
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            // Clear selected user after modal closes to prevent stale data
            setTimeout(() => setSelectedUser(null), 300);
          }}
        />
      )}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={() => setShowCreateModal(false)}
      />
    </div>
  );
};

export default UserVerificationPanel;

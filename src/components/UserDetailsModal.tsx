import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CentralizedApi from "@/services/centralizedApi";
import { Input } from "@/components/ui/input";
import { useApiContext } from "@/contexts/ApiIntegrationContext";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  CreditCard, 
  Calendar, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle,
  Download,
  Eye,
  Ticket,
  AlertCircle,
  QrCode
} from "lucide-react";

interface UserDetailsModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

const UserDetailsModal = ({ user, isOpen, onClose }: UserDetailsModalProps) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [signedUrlLoading, setSignedUrlLoading] = useState(false);
  const [signedUrlError, setSignedUrlError] = useState<string | null>(null);
  const [hasUserData, setHasUserData] = useState<boolean>(false);
  const [userRegistrations, setUserRegistrations] = useState<any[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const api = useApiContext();
  const { toast } = useToast();
  const currentUser = api.getCurrentUser?.();
  const isAdmin = (currentUser?.role || '').toLowerCase() === 'admin';
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState<string>("");
  const [editPhone, setEditPhone] = useState<string>("");
  const [saving, setSaving] = useState(false);
  
  // Enhanced debugging
  const debugLog = (message: string, data: any = {}) => {
    console.log(`📊 UserDetailsModal - ${message}:`, {
      timestamp: new Date().toISOString(),
      isModalOpen: isOpen,
      ...data
    });
  };
  
  // When the component mounts or user prop changes, check and log the data
  useEffect(() => {
    debugLog("User data received", {
      userId: user?.userId || user?._id,
      faceId: user?.faceId,
      faceIdType: typeof user?.faceId,
      isTruthy: !!user?.faceId,
      hasData: !!user,
      stack: new Error().stack
    });

    setHasUserData(!!user);
    // Initialize edit fields on user change
    setEditName(user?.name || user?.fullName || user?.FullName || "");
    setEditPhone(user?.phone || "");
    setIsEditing(false);
  }, [user]);
  
  // Safety check - if modal is open but no user data is available
  useEffect(() => {
    if (isOpen && !hasUserData) {
      debugLog('Modal opened with no user data!', { stack: new Error().stack });
      // Close the modal after a short delay to avoid UI flickering
      setTimeout(() => onClose(), 100);
    }
  }, [isOpen, hasUserData, onClose]);
  
  // Enhanced function to handle API inconsistency and ensure correct display
  const isFaceGenerated = (): boolean => {
    // Safety check for missing user data
    if (!user) {
      console.warn('⚠️ Attempting to check faceId for null user');
      return false;
    }
    
    // Check for direct boolean values first (most reliable)
    if (user.faceId === true) return true;
    
    // Check all possible field variations with different naming conventions
    const possibleFields = ['faceId', 'faceID', 'face_id', 'rekognitionId', 'rekognition_id', 'faceid'];
    for (const field of possibleFields) {
      // Exact boolean match
      if (user[field] === true) return true;
      
      // Type conversion for non-boolean truthy values
      const val = user[field];
      if (val && typeof val === 'number' && val === 1) return true;
      if (val && typeof val === 'string' && 
          ['true', '1', 'yes', 't'].includes(val.trim().toLowerCase())) return true;
    }
    
    // Check for presence of uploaded photos which implies face ID exists
    if (user.uploadedPhoto && typeof user.uploadedPhoto === 'string' && 
        (user.uploadedPhoto.includes('amazonaws.com') || 
         user.uploadedPhoto.includes('s3.') || 
         user.uploadedPhoto.includes('nfacialimagescollections'))) {
      return true;
    }
    
    return false;
  };

  // Prefer backend-provided formatted text if available
  const getLastSeenText = (): string => {
    if (user?.lastLoginFormatted) return user.lastLoginFormatted;
    const raw = user?.lastLogin || user?.updatedAt || user?.createdAt;
    if (!raw) return 'Unknown';
    try {
      return new Date(raw).toLocaleString();
    } catch {
      return String(raw);
    }
  };

  // Define the response type for signed URLs
  interface SignedUrlResponse {
    images: boolean;
    success?: boolean;
    urls?: { uploadedPhoto?: string };
    signedUrl?: string;
    signedurl?: string;
    data?: {
      signedUrl?: string;
      signedurl?: string;
    };
    url?: string;
    message?: string;
  }

  // Fetch a short-lived signed URL for the user's uploaded image when modal opens
  useEffect(() => {
    let cancelled = false;
    const fetchSigned = async () => {
      setSignedUrlError(null);
      setSignedUrl(null);
      if (!isOpen) return;
      setSignedUrlLoading(true);
      try {
        // Use admin route to fetch a presigned URL for this user's photo
        const uid = user?.userId || user?._id || user?.id;
        if (!uid) {
          throw new Error('Missing userId for signed URL request');
        }

        // CentralizedApi.buildUrl() already prepends the /api prefix - passing
        // it here too produced /api/api/users/... and always 404'd.
        // Use the resolved uid: user.userId can be undefined when the record
        // only carries _id.
        const resp = await CentralizedApi.call<SignedUrlResponse>(
          'GET',
          `/users/${encodeURIComponent(uid)}/presigned-urls?expires=3600`
        );
        
        // Extract URL from new images array format
        let url = null;
        if (resp?.images && Array.isArray(resp.images) && resp.images.length > 0) {
          url = resp.images[0]?.url;
        }
        
        // Fallback to old format if new format not available
        if (!url) {
          url = resp?.urls?.uploadedPhoto
            || resp?.signedUrl
            || resp?.signedurl
            || resp?.data?.signedUrl
            || resp?.data?.signedurl
            || resp?.url
            || user?.uploadedPhoto;
        }

        if (!cancelled && resp && (resp.success === true) && url) {
          setSignedUrl(url);
        } else if (!cancelled) {
          setSignedUrlError(resp?.message || 'Failed to obtain signed URL');
        }
      } catch (e: any) {
        if (!cancelled) setSignedUrlError(e?.message || 'Failed to obtain signed URL');
      } finally {
        if (!cancelled) setSignedUrlLoading(false);
      }
    };
    fetchSigned();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Fetch user registrations from backend
  useEffect(() => {
    let cancelled = false;
    const fetchUserRegistrations = async () => {
      if (!isOpen || !user) return;
      
      setRegistrationsLoading(true);
      try {
        const userId = user?.userId || user?._id || user?.id;
        if (!userId) {
          console.warn('No userId available for fetching registrations');
          return;
        }

        console.log('📋 Fetching registrations for userId:', userId);
        const response = await CentralizedApi.registrations.getByUserId(userId);
        
        if (!cancelled) {
          // Handle different response structures
          let registrationsArray: any[] = [];
          
          if (Array.isArray(response)) {
            registrationsArray = response;
          } else if ((response as any).registrations && Array.isArray((response as any).registrations)) {
            registrationsArray = (response as any).registrations;
          } else if ((response as any).data && Array.isArray((response as any).data)) {
            registrationsArray = (response as any).data;
          } else if ((response as any).data && (response as any).data.registrations) {
            registrationsArray = (response as any).data.registrations;
          }

          console.log('📋 Registrations fetched:', registrationsArray);
          setUserRegistrations(registrationsArray);
        }
      } catch (error) {
        console.error('Failed to fetch registrations:', error);
        if (!cancelled) {
          setUserRegistrations([]);
        }
      } finally {
        if (!cancelled) setRegistrationsLoading(false);
      }
    };

    fetchUserRegistrations();
    return () => {
      cancelled = true;
    };
  }, [isOpen, user]);

  // Early return if user is null or undefined - keep after hooks to preserve consistent hook order
  if (!user) {
    return null;
  }

  // Admin: handle saving edited name/phone
  const handleSaveEdits = async () => {
    const id = user?.userId || user?._id || user?.id;
    if (!id) {
      toast({ title: 'Missing ID', description: 'Cannot update without user ID', variant: 'destructive' });
      return;
    }
    if (!editName?.trim()) {
      toast({ title: 'Name required', description: 'Please enter a name', variant: 'destructive' });
      return;
    }
    if (editPhone && !/^\+?[0-9\-()\s]{7,20}$/.test(editPhone)) {
      toast({ title: 'Invalid phone', description: 'Enter a valid phone number', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await api.updateUser(id, {  fullName: editName, phone: editPhone }, true);
      toast({ title: 'Saved', description: 'User details updated successfully' });
      setIsEditing(false);
    } catch (e1: any) {
      try {
        await CentralizedApi.call(
          'PATCH',
          `/admin/employees/${encodeURIComponent(id)}`,
          { fullName: editName, name: editName, phone: editPhone }
        );
        toast({ title: 'Saved', description: 'Employee details updated successfully' });
        setIsEditing(false);
      } catch (e2: any) {
        console.error('Failed to update user', { primary: e1, fallback: e2 });
        toast({ title: 'Update failed', description: e2?.message || e1?.message || 'Unable to save changes', variant: 'destructive' });
      }
    } finally {
      setSaving(false);
      setTimeout(() => api.fetchUsers?.(), 100);
    }
  };

  // Fetch user tickets from backend
  useEffect(() => {
    let cancelled = false;
    const fetchUserTickets = async () => {
      if (!isOpen || !user) return;
      
      setTicketsLoading(true);
      try {
        const userId = user?.userId || user?._id || user?.id;
        if (!userId) {
          console.warn('No userId available for fetching tickets');
          return;
        }

        console.log('🎫 Fetching tickets for userId:', userId);
        const response = await CentralizedApi.tickets.getByUserId(userId);
        
        if (!cancelled) {
          let ticketsArray: any[] = [];
          
          if (Array.isArray(response)) {
            ticketsArray = response;
          } else if ((response as any).tickets && Array.isArray((response as any).tickets)) {
            ticketsArray = (response as any).tickets;
          } else if ((response as any).data && Array.isArray((response as any).data)) {
            ticketsArray = (response as any).data;
          } else if ((response as any).data && (response as any).data.tickets) {
            ticketsArray = (response as any).data.tickets;
          }

          console.log('🎫 Tickets fetched:', ticketsArray);
          setUserTickets(ticketsArray);
        }
      } catch (error) {
        console.error('Failed to fetch tickets:', error);
        if (!cancelled) {
          setUserTickets([]);
        }
      } finally {
        if (!cancelled) setTicketsLoading(false);
      }
    };

    fetchUserTickets();
    return () => {
      cancelled = true;
    };
  }, [isOpen, user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="gradient-success text-white border-none">Active</Badge>;
      case "checked-in":
        return <Badge className="gradient-primary text-white border-none">Checked-In</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500 text-white border-none">Cancelled</Badge>;
      case "verified":
        return <Badge className="gradient-success text-white border-none">Verified</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500 text-white border-none">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-600 text-white border-none">Rejected</Badge>;
      case "confirmed":
        return <Badge className="gradient-success text-white border-none">Confirmed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalSpent = userTickets
    .filter(ticket => ticket.status !== "cancelled")
    .reduce((sum, ticket) => sum + ticket.price, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden glass-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl gradient-text">
            <User className="h-5 w-5" />
            <span>User Details & Tickets</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Complete user information, tickets, and event registrations
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 glass rounded-xl">
            <TabsTrigger 
              value="profile" 
              className="flex items-center space-x-2 data-[state=active]:gradient-primary data-[state=active]:text-black"
            >
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger 
              value="tickets"
              className="flex items-center space-x-2 data-[state=active]:gradient-secondary data-[state=active]:text-black"
            >
              <CreditCard className="h-4 w-4" />
              <span>Tickets</span>
            </TabsTrigger>
            <TabsTrigger 
              value="registrations"
              className="flex items-center space-x-2 data-[state=active]:gradient-accent data-[state=active]:text-black"
            >
              <Calendar className="h-4 w-4" />
              <span>Registrations</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <TabsContent value="profile" className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Information */}
                <div className="lg:col-span-2">
                  <Card className="glass-card border-primary/20">
                    <CardHeader>
                      <CardTitle className="gradient-text">User Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                          <AvatarImage src={signedUrl || user?.uploadedPhoto || user?.profileImage} alt={user?.name || 'User'} />
                          <AvatarFallback className="gradient-primary text-primary-foreground text-lg">
                            {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('') : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          {isEditing ? (
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Full name"
                              className="text-lg"
                            />
                          ) : (
                            <h3 className="text-2xl font-bold gradient-text">{user?.name || user?.fullName || user?.FullName || (user?.email ? user.email.split('@')[0] : 'Unknown User')}</h3>
                          )}
                          <p className="text-muted-foreground">User ID: {user?.userId || user?.id || user?._id || 'N/A'}</p>
                          {(user?.status === "verified" || user?.verificationStatus === "verified") && (
                            <Badge className="gradient-success text-white border-none">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <Mail className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-sm text-muted-foreground">Email</p>
                              <p className="font-medium">{user?.email || 'Not provided'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Phone className="h-4 w-4 text-primary" />
                            <div className="w-full">
                              <p className="text-sm text-muted-foreground">Phone</p>
                              {isEditing ? (
                                <Input
                                  value={editPhone}
                                  onChange={(e) => setEditPhone(e.target.value)}
                                  placeholder="Phone number"
                                />
                              ) : (
                                <p className="font-medium">{user?.phone || 'Not provided'}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <Calendar className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-sm text-muted-foreground">Join Date</p>
                              <p className="font-medium">{user?.registrationDate || user?.createdAt || 'Unknown'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Eye className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-sm text-muted-foreground">Last Seen</p>
                              <p className="font-medium">{getLastSeenText()}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <Button onClick={handleSaveEdits} disabled={saving} className="gradient-success text-white border-none">
                                {saving ? 'Saving...' : 'Save'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsEditing(false);
                                  setEditName(user?.name || user?.fullName || user?.FullName || '');
                                  setEditPhone(user?.phone || '');
                                }}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <Button variant="outline" onClick={() => setIsEditing(true)} className="hover-glow">Edit</Button>
                          )}
                        </div>
                      )}

                      <div className="space-y-4">
                        <h4 className="font-semibold gradient-text">Facial Recognition Data</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-m text-muted-foreground">Face ID</p>
                            <p className="font-mono text-sm bg-muted/50 px-2 py-1 rounded flex items-center">
                              {isFaceGenerated() ? (
                                <><CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5" /> Generated</>
                              ) : (
                                <><XCircle className="h-3.5 w-3.5 text-red-500 mr-1.5" /> Not Generated</>
                              )}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Uploaded Photo</p>
                            <div className="border rounded-md overflow-hidden">
                              {signedUrlLoading ? (
                                <div className="w-full h-24 flex items-center justify-center text-xs text-muted-foreground">Loading image…</div>
                              ) : (
                                <img
                                  src={signedUrl || user?.uploadedPhoto || "/placeholder.svg"}
                                  alt="User uploaded"
                                  className="w-full h-24 object-cover"
                                  onError={(e) => {
                                    if (e.currentTarget.dataset.fallbackApplied) return;
                                    e.currentTarget.dataset.fallbackApplied = 'true';
                                    e.currentTarget.src = '/placeholder.svg';
                                  }}
                                />
                              )}
                            </div>
                            {signedUrlError && (
                              <p className="text-xs text-red-500">{signedUrlError}</p>
                            )}
                          </div>
              
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Statistics */}
                <div>
                  <Card className="glass-card border-primary/20">
                    <CardHeader>
                      <CardTitle className="gradient-text">Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold gradient-text">{userRegistrations.length}</div>
                        <p className="text-sm text-muted-foreground">Registered Events</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">{userTickets.length}</div>
                        <p className="text-sm text-muted-foreground">Total Tickets</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">${totalSpent}</div>
                        <p className="text-sm text-muted-foreground">Total Spent</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tickets" className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold gradient-text">🎫 User Tickets</h3>
                <Button variant="outline" size="sm" className="hover-glow" disabled={userTickets.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Tickets
                </Button>
              </div>
              
              {ticketsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Loading tickets...</p>
                </div>
              ) : userTickets && userTickets.length > 0 ? (
                <div className="space-y-4">
                  {userTickets.map((ticket) => {
                    const ticketId = ticket._id || ticket.id || ticket.ticketId;
                    const eventName = ticket.eventName || ticket.event?.name || 'Unknown Event';
                    const purchaseDate = ticket.purchaseDate ? new Date(ticket.purchaseDate).toLocaleDateString() : 'Unknown';
                    const checkInTime = ticket.checkInTime ? new Date(ticket.checkInTime).toLocaleString() : 'Not checked in';
                    const status = ticket.status || 'active';
                    const price = ticket.price || 'N/A';
                    const paymentId = ticket.paymentId || 'N/A';

                    return (
                      <Card key={ticketId} className="glass-card border-primary/20 hover-lift">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-lg font-semibold gradient-text">{eventName}</h4>
                              <p className="text-sm text-muted-foreground">Ticket ID: {ticketId}</p>
                              <p className="text-sm text-muted-foreground mt-1">Payment ID: {paymentId}</p>
                            </div>
                            {getStatusBadge(status)}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center space-x-2">
                              <Ticket className="h-4 w-4 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">Price</p>
                                <p className="text-sm font-medium">₹{price}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">Purchase Date</p>
                                <p className="text-sm font-medium">{purchaseDate}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">Check-in Time</p>
                                <p className="text-sm font-medium">{checkInTime}</p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Status</p>
                              <p className="font-medium capitalize">{status}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">User Email</p>
                              <p className="font-medium text-xs">{ticket.userEmail || user?.email || 'N/A'}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 border border-dashed rounded-lg">
                  <div className="text-center">
                    <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No tickets found</p>
                    <p className="text-xs text-muted-foreground mt-1">User has not purchased any tickets yet</p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="registrations" className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold gradient-text">📋 Event Registrations</h3>
                <Button variant="outline" size="sm" className="hover-glow" disabled={userRegistrations.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Registrations
                </Button>
              </div>

              {registrationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Loading registrations...</p>
                </div>
              ) : userRegistrations && userRegistrations.length > 0 ? (
                <div className="space-y-4">
                  {userRegistrations.map((registration) => {
                    // Map backend fields to display format
                    const eventId = registration.eventId?._id || registration.eventId || 'N/A';
                    const eventName = registration.eventId?.name || registration.eventName || 'Unknown Event';
                    const registeredOn = registration.registrationDate ? new Date(registration.registrationDate).toLocaleDateString() : 'Unknown';
                    const status = registration.status || 'pending';
                    const regId = registration._id || registration.id || registration.registrationId;
                    const faceVerificationStatus = registration.faceVerificationStatus;
                    const ticketAvailabilityStatus = registration.ticketAvailabilityStatus;
                    const ticketIssued = registration.ticketIssued;

                    return (
                      <Card key={regId} className="glass-card border-primary/20 hover-lift">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-lg font-semibold gradient-text">{eventName}</h4>
                              <p className="text-sm text-muted-foreground">Registration ID: {regId}</p>
                              <p className="text-sm text-muted-foreground mt-1">Registered on: {registeredOn}</p>
                            </div>
                            {getStatusBadge(status)}
                          </div>

                          {/* Auto-Calculated Status Fields */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-muted/30 rounded-lg">
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground uppercase">Face Verification</p>
                              <div className="flex items-center gap-2">
                                {faceVerificationStatus ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-sm font-medium text-green-600">Verified ✅</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4 text-red-500" />
                                    <span className="text-sm font-medium text-red-600">Pending</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground uppercase">Ticket Availability</p>
                              <div className="flex items-center gap-2">
                                {ticketAvailabilityStatus === 'available' ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-sm font-medium text-green-600">Available ✅</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                                    <span className="text-sm font-medium text-yellow-600">Sold Out</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground uppercase">Ticket Issued</p>
                              <div className="flex items-center gap-2">
                                {ticketIssued ? (
                                  <>
                                    <Ticket className="h-4 w-4 text-green-500" />
                                    <span className="text-sm font-medium text-green-600">Yes ✅</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-4 w-4 text-yellow-500" />
                                    <span className="text-sm font-medium text-yellow-600">Pending</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                            <div>
                              <p className="text-muted-foreground">Registration Status</p>
                              <p className="font-medium capitalize">{status}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Event ID</p>
                              <p className="font-mono text-xs bg-muted/50 px-2 py-1 rounded">{eventId.substring(0, 12)}...</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 border border-dashed rounded-lg">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No registrations found</p>
                    <p className="text-xs text-muted-foreground mt-1">User has not registered for any events</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end pt-4 border-t border-border/20">
          <Button onClick={onClose} variant="outline" className="hover-glow">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsModal;

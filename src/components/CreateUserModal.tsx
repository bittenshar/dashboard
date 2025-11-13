import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Phone, Shield, Eye, EyeOff, Plus, Camera } from "lucide-react";
import { useApiContext } from "@/contexts/ApiIntegrationContext";
import { useToast } from "@/hooks/use-toast";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated?: () => void; // Callback to refresh users list
}

// User interface matching backend schema
interface UserData {
  FullName: string | number | readonly string[];
  userId?: string;
  name: string;  // Backend expects 'name' field
  email: string;
  password: string;
  phone: string;
  faceId?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  status: 'active' | 'suspended';
}

const CreateUserModal = ({ isOpen, onClose, onUserCreated }: CreateUserModalProps) => {
  const api = useApiContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState<UserData>({
    FullName: "",
    name: "",
    email: "",
    password: "",
    phone: "",
    faceId: "",
    verificationStatus: "pending",
    status: "active"
  });

  const [errors, setErrors] = useState<Partial<UserData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<UserData> = {};

    // Required field validation
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone number format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateUserId = () => {
    const id = `usr_${Date.now()}${Math.floor(Math.random() * 1000)}`;
    setFormData(prev => ({ ...prev, userId: id }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors below",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create user via API
      const { FullName, ...rest } = formData;
      const userData = {
        ...rest,
        FullName: typeof FullName === "string"
          ? FullName
          : Array.isArray(FullName)
            ? FullName.join(" ")
            : String(FullName),
        fullName: typeof FullName === "string"
          ? FullName
          : Array.isArray(FullName)
            ? FullName.join(" ")
            : String(FullName),
      };

      await api.createUser(userData);
      
      toast({
        title: "Success",
        description: "User created successfully",
      });
      
      // Reset form
      setFormData({
          FullName: "",
          email: "",
          password: "",
          phone: "",
          faceId: "",
          verificationStatus: "pending",
          status: "active",
          name: ""
      });
      
      setErrors({});
      
      // Callback to refresh users list
      if (onUserCreated) {
        onUserCreated();
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to create user:', error);
      toast({
        title: "Error",
        description: `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
          FullName: "",
          email: "",
          password: "",
          phone: "",
          faceId: "",
          verificationStatus: "pending",
          status: "active",
          name: ""
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-card">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-2xl gradient-text">
            <Plus className="h-6 w-6" />
            <span>Create New User</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add a new user to the system with facial recognition capabilities. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User ID (Auto-generated) */}
            <div className="space-y-2">
              <Label htmlFor="userId" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>User ID</span>
              </Label>
              <div className="flex space-x-2">
                <Input
                  id="userId"
                  value={formData.userId || ""}
                  onChange={(e) => handleInputChange("userId", e.target.value)}
                  placeholder="Auto-generated on submission"
                  className="glass-input"
                  disabled
                />
                <Button type="button" onClick={generateUserId} variant="outline" className="hover-glow">
                  Generate
                </Button>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="FullName">Full Name *</Label>
              <Input
                id="FullName"
                value={formData.FullName}
                onChange={(e) => handleInputChange("FullName", e.target.value)}
                placeholder="John Doe"
                className={`glass-input ${errors.FullName ? 'border-red-500' : ''}`}
                required
              />
              {errors.FullName && (
                <p className="text-sm text-red-500">{errors.FullName}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Email *</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="john.doe@example.com"
                className={`glass-input ${errors.email ? 'border-red-500' : ''}`}
                required
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>Phone Number *</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+1 (555) 123-4567"
                className={`glass-input ${errors.phone ? 'border-red-500' : ''}`}
                required
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="password" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Password *</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="••••••••"
                  className={`glass-input pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Face ID (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="faceId" className="flex items-center space-x-2">
                <Camera className="h-4 w-4" />
                <span>Face ID (Optional)</span>
              </Label>
              <Input
                id="faceId"
                value={formData.faceId || ""}
                onChange={(e) => handleInputChange("faceId", e.target.value)}
                placeholder="face_12345"
                className="glass-input"
              />
              <p className="text-xs text-muted-foreground">
                Face ID will be auto-generated during facial recognition setup
              </p>
            </div>

            {/* Verification Status */}
            <div className="space-y-2">
              <Label htmlFor="verificationStatus">Verification Status</Label>
              <Select 
                value={formData.verificationStatus} 
                onValueChange={(value: any) => handleInputChange("verificationStatus", value)}
              >
                <SelectTrigger className="glass-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* User Status */}
            <div className="space-y-2">
              <Label htmlFor="status">User Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: any) => handleInputChange("status", value)}
              >
                <SelectTrigger className="glass-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              className="hover-glow"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="gradient-primary hover-glow"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserModal;

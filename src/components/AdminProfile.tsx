
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User, Edit, Save, X, Shield, Mail, Calendar, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminProfile = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [editedEmail, setEditedEmail] = useState(user?.email || '');

  const handleSave = () => {
    // Mock save functionality
    toast({
      title: "Profile Updated",
      description: "Your profile has been successfully updated.",
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  if (!user) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <span className="hidden sm:inline">{user.name}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Admin Profile</span>
          </DialogTitle>
          <DialogDescription>
            Manage your admin account settings and preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="relative">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="h-16 w-16 rounded-full object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <Shield className="h-3 w-3 text-white" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg">{user.name}</h3>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {user.role}
              </Badge>
            </div>
          </div>

          {/* Profile Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
                <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  value={user.role}
                  disabled
                  className="pl-10 bg-gray-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Last Login</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  value={new Date().toLocaleDateString()}
                  disabled
                  className="pl-10 bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <div className="space-x-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} size="sm" className="bg-green-600 hover:bg-green-700">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button 
                    onClick={() => setIsEditing(false)} 
                    variant="outline" 
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
            
            <Button 
              onClick={handleLogout} 
              variant="destructive" 
              size="sm"
            >
              Logout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminProfile;

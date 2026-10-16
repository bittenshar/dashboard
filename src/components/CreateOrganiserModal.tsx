import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, User, Mail, Phone, MapPin, Plus } from "lucide-react";
import { useApiContext } from "@/contexts/ApiIntegrationContext";
import { useToast } from "@/hooks/use-toast";

interface CreateOrganiserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrganiserCreated?: () => void; // Callback to refresh organizers list
}

// The publisher signs organisers in with a one-time code and looks them up by
// lowercase email or by phone digits (bare 10-digit numbers get 91), so save
// both in that form or the organiser can't sign in to this account.
const normalizeEmail = (value: string) => value.trim().toLowerCase();
const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
};

const CreateOrganiserModal = ({ isOpen, onClose, onOrganiserCreated }: CreateOrganiserModalProps) => {
  const api = useApiContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    description: "",
    contactPerson: "",
    status: "active"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.email || !formData.phone || !formData.address) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields (Name, Email, Phone, Address)",
          variant: "destructive",
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        return;
      }

      const phone = normalizePhone(formData.phone);
      if (phone.length < 10) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid phone number",
          variant: "destructive",
        });
        return;
      }

      // No password: the API makes a random one and emails it to the organiser.
      const organizerData = {
        name: formData.name,
        email: normalizeEmail(formData.email),
        phone,
        address: formData.address,
        website: formData.website || "",
        description: formData.description || "",
        contactPerson: formData.contactPerson || formData.name,
        status: formData.status
      };

      const created: any = await api.createOrganizer(organizerData);

      // The API emails the new organiser how to sign in, publish and check
      // guests in, and says whether that email went.
      const welcome = created?.data?.welcomeEmail ?? created?.welcomeEmail ?? created?.data?.data?.welcomeEmail;
      toast(
        welcome === "failed"
          ? {
              title: "Organizer created",
              description: `The welcome email to ${organizerData.email} couldn't be sent, so they don't have their password. Ask them to use "Forgot password" in the Event Manager app.`,
              variant: "destructive",
            }
          : {
              title: "Organizer created",
              description: `A welcome email with their password, sign-in steps and the Event Manager app links was sent to ${organizerData.email}.`,
            }
      );

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        website: "",
        description: "",
        contactPerson: "",
        status: "active"
      });

      // Callback to refresh organizers list
      if (onOrganiserCreated) {
        onOrganiserCreated();
      }

      onClose();
    } catch (error) {
      console.error('Failed to create organizer:', error);
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = error.message as string;
      }
      
      toast({
        title: "Error Creating Organizer",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-card">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-2xl gradient-text">
            <Plus className="h-6 w-6" />
            <span>Add New Organiser</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Register a new event organiser to the platform. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Organisation Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center space-x-2">
                <Briefcase className="h-4 w-4" />
                <span>Organisation Name *</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="TechEvents Co."
                className="glass-input"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Email Address *</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="contact@techevents.com"
                className="glass-input"
                required
              />
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
                placeholder="+91 9876543210"
                className="glass-input"
                required
              />
            </div>

            {/* Contact Person */}
            <div className="space-y-2">
              <Label htmlFor="contactPerson" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Contact Person</span>
              </Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => handleInputChange("contactPerson", e.target.value)}
                placeholder="John Doe"
                className="glass-input"
                required
              />
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website">Website (Optional)</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                placeholder="https://techevents.com"
                className="glass-input"
              />
            </div>

          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Business Address *</span>
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="123 Business Street, City, State, ZIP"
              className="glass-input"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Brief description about the organisation..."
              className="glass-input min-h-[100px]"
              rows={4}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="hover-glow"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-red-600 hover:bg-red-700 text-white hover-glow"
              disabled={loading}
            >
              {loading ? "Creating..." : "Add Organiser"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOrganiserModal;
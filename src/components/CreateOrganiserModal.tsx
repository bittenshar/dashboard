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

const CreateOrganiserModal = ({ isOpen, onClose, onOrganiserCreated }: CreateOrganiserModalProps) => {
  const api = useApiContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    organiserId: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    description: "",
    contactPerson: "",
    status: "active"
  });

  const generateOrganiserId = () => {
    const id = `ORG${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
    setFormData(prev => ({ ...prev, organiserId: id }));
  };

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
      if (!emailRegex.test(formData.email)) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        return;
      }

      console.log("Creating organiser:", formData);

      // Prepare organizer data for API
      const organizerData = {
        organiserId: formData.organiserId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        website: formData.website || "",
        description: formData.description || "",
        contactPerson: formData.contactPerson || formData.name,
        status: formData.status
      };

      await api.createOrganizer(organizerData);
      
      toast({
        title: "Success",
        description: "Organizer created successfully",
      });

      // Reset form
      setFormData({
        organiserId: "",
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
            {/* Organiser ID */}
            <div className="space-y-2">
              <Label htmlFor="organiserId" className="flex items-center space-x-2">
                <Briefcase className="h-4 w-4" />
                <span>Organiser ID</span>
              </Label>
              <div className="flex space-x-2">
                <Input
                  id="organiserId"
                  value={formData.organiserId}
                  onChange={(e) => handleInputChange("organiserId", e.target.value)}
                  placeholder="ORG001"
                  className="glass-input"
                />
                <Button type="button" onClick={generateOrganiserId} variant="outline" className="hover-glow">
                  Generate
                </Button>
              </div>
            </div>

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
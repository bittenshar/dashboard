
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Lock, Mail, Sparkles, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await login(email, password);
    
    if (success) {
      toast({
        title: "Login Successful",
        description: "Welcome to Thrillathon Admin Panel",
      });
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="h-16 w-16 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <Camera className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 h-5 w-5 bg-yellow-400 rounded-full flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-yellow-800" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-2">
            Thrillathon Admin
          </h1>
          <p className="text-gray-600">Facial Ticketing Management System</p>
        </div>

        <Card className="glass-card shadow-2xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2 text-xl">
              <Shield className="h-5 w-5 text-blue-600" />
              <span>Admin Login</span>
            </CardTitle>
            <CardDescription>
              Enter your credentials to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@thrillathon.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5 transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            
            <div className="mt-6 space-y-3">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-medium mb-1">Admin Access:</p>
                <p className="text-xs text-blue-600">Email: admin@thrillathon.com</p>
                <p className="text-xs text-blue-600">Password: admin123</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 font-medium mb-1">Employee Access:</p>
                <p className="text-xs text-green-600">Email: employee1@thrillathon.com</p>
                <p className="text-xs text-green-600">Password: employee123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;

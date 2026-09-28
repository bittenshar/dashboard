
import { useEffect, useState } from 'react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { GOOGLE_CLIENT_ID } from '@/constants/api/config';
import { Camera, Lock, Mail, Sparkles, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Matches the backend's wait between code emails.
const RESEND_COOLDOWN_SECONDS = 30;


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpStep, setOtpStep] = useState<'email' | 'code'>('email');
  const [otp, setOtp] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const { login, loginWithGoogle, sendLoginOtp, verifyLoginOtp } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const welcome = () =>
    toast({
      title: "Login Successful",
      description: "Welcome to Thrillathon Admin Panel",
    });

  const showError = (title: string, error: unknown, fallback: string) =>
    toast({
      title,
      description: error instanceof Error && error.message ? error.message : fallback,
      variant: "destructive",
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await login(email, password);

    if (success) {
      welcome();
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const handleGoogle = async (credential: string) => {
    setIsLoading(true);
    try {
      await loginWithGoogle(credential);
      welcome();
    } catch (error) {
      showError("Google sign-in failed", error, "Please try again.");
      setIsLoading(false);
    }
  };

  const sendCode = async () => {
    setIsLoading(true);
    try {
      await sendLoginOtp(email.trim());
      setOtp('');
      setOtpStep('code');
      setResendIn(RESEND_COOLDOWN_SECONDS);
      toast({
        title: "Check your inbox",
        description: `If ${email.trim()} has admin access, a 6-digit code is on its way.`,
      });
    } catch (error) {
      showError("Couldn't send the code", error, "Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async (code: string) => {
    setIsLoading(true);
    try {
      await verifyLoginOtp(email.trim(), code);
      welcome();
    } catch (error) {
      setOtp('');
      showError("Sign-in failed", error, "Please check the code and try again.");
      setIsLoading(false);
    }
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
              Sign in to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {GOOGLE_CLIENT_ID && (
              <>
                <GoogleSignInButton
                  onCredential={handleGoogle}
                  onError={(message) =>
                    toast({ title: "Google sign-in unavailable", description: message, variant: "destructive" })
                  }
                />
                <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-gray-400">
                  <Separator className="flex-1" />
                  or
                  <Separator className="flex-1" />
                </div>
              </>
            )}

            <Tabs defaultValue="code">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="code">Email code</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
              </TabsList>

              <TabsContent value="code" className="pt-2">
                {otpStep === 'email' ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendCode();
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="otp-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="otp-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          autoComplete="email"
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5 transition-all duration-300"
                      disabled={isLoading}
                    >
                      {isLoading ? "Sending code..." : "Email me a code"}
                    </Button>
                  </form>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      verifyCode(otp);
                    }}
                    className="space-y-4"
                  >
                    <p className="text-center text-sm text-gray-600">
                      Enter the 6-digit code sent to{' '}
                      <span className="font-medium text-gray-900">{email.trim()}</span>
                    </p>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        pattern={REGEXP_ONLY_DIGITS}
                        value={otp}
                        onChange={setOtp}
                        onComplete={verifyCode}
                        disabled={isLoading}
                        autoFocus
                      >
                        <InputOTPGroup>
                          {[0, 1, 2, 3, 4, 5].map((index) => (
                            <InputOTPSlot key={index} index={index} />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5 transition-all duration-300"
                      disabled={isLoading || otp.length !== 6}
                    >
                      {isLoading ? "Verifying..." : "Verify & Sign In"}
                    </Button>
                    <div className="flex items-center justify-between text-sm">
                      <button
                        type="button"
                        className="text-gray-600 hover:text-gray-900"
                        onClick={() => {
                          setOtpStep('email');
                          setOtp('');
                        }}
                      >
                        Use a different email
                      </button>
                      <button
                        type="button"
                        className="text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                        disabled={isLoading || resendIn > 0}
                        onClick={sendCode}
                      >
                        {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
                      </button>
                    </div>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="password" className="pt-2">
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;

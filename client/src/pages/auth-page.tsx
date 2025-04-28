import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/lib/authContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  // Get the current location to determine if we're on sign-in or sign-up
  const [location] = useLocation();
  const [, params] = useRoute("/auth/reset-password");
  const isSignIn = location.includes("sign-in");
  const isSignUp = location.includes("sign-up");
  const isResetPassword = location.includes("reset-password");
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Get auth functions from context
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignIn) {
        // Handle sign in
        const { error, user } = await signIn(email, password);
        if (error) {
          toast({
            title: "Sign in failed",
            description: error.message,
            variant: "destructive",
          });
        } else if (user) {
          toast({
            title: "Signed in successfully",
            description: `Welcome back${user.displayName ? ', ' + user.displayName : ''}!`,
          });
          setLocation("/");
        }
      } else if (isSignUp) {
        // Validate passwords match for sign up
        if (password !== confirmPassword) {
          toast({
            title: "Passwords don't match",
            description: "Please make sure your passwords match.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        // Handle sign up
        const { error, user } = await signUp(email, password, { firstName, lastName });
        if (error) {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          });
        } else if (user) {
          toast({
            title: "Account created successfully",
            description: "Welcome to ExpenseTracker!",
          });
          setLocation("/");
        }
      } else if (isResetPassword) {
        // Handle password reset
        const { error } = await resetPassword(email);
        if (error) {
          toast({
            title: "Password reset failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Password reset email sent",
            description: "Check your email for a link to reset your password.",
          });
          setLocation("/auth/sign-in");
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast({
        title: "Authentication error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: "Google sign in failed",
          description: error.message,
          variant: "destructive",
        });
      }
      // Redirect is handled by the auth callback
    } catch (error) {
      console.error("Google sign in error:", error);
      toast({
        title: "Google sign in error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Determine the title and description based on the current page
  let title = "Sign In";
  let description = "Enter your credentials to access your account";
  
  if (isSignUp) {
    title = "Create an Account";
    description = "Enter your details to create a new account";
  } else if (isResetPassword) {
    title = "Reset Password";
    description = "Enter your email to receive a password reset link";
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Auth Forms */}
      <div className="w-full md:w-1/2 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">ExpenseTracker</CardTitle>
            <CardDescription className="text-center">
              {description}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email field for all forms */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password fields for sign in and sign up */}
              {!isResetPassword && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Confirm password field for sign up */}
              {isSignUp && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Submit button */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                  </>
                ) : isSignIn ? (
                  "Sign In"
                ) : isSignUp ? (
                  "Create Account"
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              {/* Google sign in button */}
              {(isSignIn || isSignUp) && (
                <>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <svg
                        className="mr-2 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                      >
                        <path
                          fill="#FFC107"
                          d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                        />
                        <path
                          fill="#FF3D00"
                          d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                        />
                        <path
                          fill="#4CAF50"
                          d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                        />
                        <path
                          fill="#1976D2"
                          d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                        />
                      </svg>
                    )}
                    Google
                  </Button>
                </>
              )}

              {/* Links to other auth pages */}
              <div className="text-center text-sm mt-4">
                {isSignIn && (
                  <>
                    <a
                      href="/auth/reset-password"
                      className="text-primary hover:underline"
                    >
                      Forgot password?
                    </a>
                    <div className="mt-2">
                      Don't have an account?{" "}
                      <a
                        href="/auth/sign-up"
                        className="text-primary hover:underline"
                      >
                        Sign up
                      </a>
                    </div>
                  </>
                )}
                {isSignUp && (
                  <div>
                    Already have an account?{" "}
                    <a
                      href="/auth/sign-in"
                      className="text-primary hover:underline"
                    >
                      Sign in
                    </a>
                  </div>
                )}
                {isResetPassword && (
                  <div>
                    Remember your password?{" "}
                    <a
                      href="/auth/sign-in"
                      className="text-primary hover:underline"
                    >
                      Sign in
                    </a>
                  </div>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Hero Section (kept for visual consistency) */}
      <div className="w-full md:w-1/2 bg-gradient-to-r from-primary to-blue-600 hidden md:flex items-center justify-center text-white p-10">
        <div className="max-w-md space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">Track Expenses with Ease</h1>
            <p className="text-lg opacity-90">
              Keep track of your business and personal expenses with our intuitive expense tracking app
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <line x1="10" y1="9" x2="8" y2="9" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium">Organize by Trips</h3>
                <p className="opacity-90">Group expenses by trips for better organization</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M9 21V9" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium">Receipt Processing</h3>
                <p className="opacity-90">Upload receipts and extract data automatically</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="12" x="3" y="6" rx="2" />
                  <path d="M16 16v2a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2" />
                  <path d="M7 12h10" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium">Export to Excel</h3>
                <p className="opacity-90">Download expense reports in Excel format</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
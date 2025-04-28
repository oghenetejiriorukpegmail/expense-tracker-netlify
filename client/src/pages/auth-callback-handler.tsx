import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { getRedirectResult } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

export default function AuthCallbackHandler() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      try {
        // Get the result of the redirect operation
        const result = await getRedirectResult(auth);
        
        if (result) {
          console.log("Successfully authenticated with provider");
          // Redirect to the dashboard on successful authentication
          setLocation("/");
        } else {
          // Check if this is a password reset or email verification
          const queryParams = new URLSearchParams(window.location.search);
          const mode = queryParams.get("mode");
          
          if (mode === "resetPassword") {
            // Handle password reset
            const actionCode = queryParams.get("oobCode");
            if (actionCode) {
              // Redirect to password reset page with the action code
              setLocation(`/auth/reset-password?oobCode=${actionCode}`);
              return;
            }
          } else if (mode === "verifyEmail") {
            // Handle email verification
            const actionCode = queryParams.get("oobCode");
            if (actionCode) {
              // Redirect to email verification page with the action code
              setLocation(`/auth/verify-email?oobCode=${actionCode}`);
              return;
            }
          }
          
          // If no recognizable parameters, redirect to sign-in
          setLocation("/auth/sign-in");
        }
      } catch (err) {
        console.error("Error in auth callback:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      }
    };

    handleAuthCallback();
  }, [setLocation]);

  // Show loading indicator while processing
  if (!error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Processing authentication...</p>
      </div>
    );
  }

  // Show error if something went wrong
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-destructive/10 p-4 rounded-lg mb-4">
        <h2 className="text-xl font-semibold text-destructive mb-2">Authentication Error</h2>
        <p className="text-destructive">{error}</p>
      </div>
      <button 
        className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
        onClick={() => setLocation("/auth/sign-in")}
      >
        Return to Sign In
      </button>
    </div>
  );
}
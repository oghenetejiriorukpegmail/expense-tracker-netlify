import { useEffect } from 'react';
import { useSignUp, useAuth } from '@clerk/clerk-react';
import { Redirect } from 'wouter';
import { Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn } = useAuth();
  // You might need state to track verification status/errors
  // const [verificationStatus, setVerificationStatus] = useState('loading');

  useEffect(() => {
    if (!isLoaded || !signUp) {
      return;
    }

    // Attempt to complete the sign-up flow by verifying the email address.
    // Clerk automatically handles the verification token from the URL.
    const verify = async () => {
      try {
        // Pass an object with an empty code string to satisfy type requirement
        const result = await signUp.attemptEmailAddressVerification({ code: "" }); 

        if (result.status === 'complete') {
          // Verification successful, set the session active
          if (result.createdSessionId && setActive) {
            await setActive({ session: result.createdSessionId });
            // Redirect to home page after successful verification and session activation
            // Note: Wouter's Redirect might need to be triggered differently after async op
            // Consider using navigate() from useLocation hook if available/preferred
            window.location.href = '/'; // Simple redirect for now
          } else {
            // Handle case where session wasn't created or setActive is unavailable
            console.error("Verification complete but session could not be activated.");
            // setVerificationStatus('error');
             window.location.href = '/auth'; // Redirect to auth page on error
          }
        } else {
          // Verification not complete, status might be 'verifying', 'missing_requirements', etc.
          console.error('Email verification status:', result.status);
          // setVerificationStatus('error');
           window.location.href = '/auth'; // Redirect to auth page on error
        }
      } catch (err: any) {
        console.error('Error verifying email:', JSON.stringify(err, null, 2));
        // setVerificationStatus('error');
         window.location.href = '/auth'; // Redirect to auth page on error
      }
    };

    verify();

  }, [isLoaded, signUp, setActive]);

  // If user is already signed in, redirect them
  if (isSignedIn) {
    return <Redirect to="/" />;
  }

  // Show loading indicator while verifying
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-2">Verifying your email...</p>
      {/* Optionally display error message based on verificationStatus state */}
    </div>
  );
}
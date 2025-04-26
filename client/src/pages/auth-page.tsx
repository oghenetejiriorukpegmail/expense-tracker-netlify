import { SignIn, SignUp } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

export default function AuthPage() {
  // Get the current location to determine if we're on sign-in or sign-up
  const [location] = useLocation();
  const isSignIn = location.includes("sign-in");

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Auth Forms */}
      <div className="w-full md:w-1/2 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">ExpenseTracker</CardTitle>
            <CardDescription className="text-center">
              Track your expenses and manage your trips efficiently
            </CardDescription>
          </CardHeader>

          {/* Render Clerk SignUp/SignIn based on the current path */}
          <CardContent className="flex justify-center">
            {isSignIn ? (
              <SignIn
                path="/auth/sign-in"
                routing="path"
                signUpUrl="/auth/sign-up"
                fallbackRedirectUrl="/"
                afterSignInUrl="/"
                afterSocialAuthSignInUrl="/"
                socialButtonsVariant="iconButton"
                appearance={{
                  elements: {
                    formButtonPrimary: 'bg-primary hover:bg-primary/90 text-white',
                    card: 'shadow-none',
                    formFieldInput: 'border-input',
                    socialButtonsIconButton: 'border border-input hover:bg-muted',
                    socialButtonsBlockButton: 'bg-white border border-input hover:bg-muted text-black',
                  }
                }}
              />
            ) : (
              <SignUp
                path="/auth/sign-up"
                routing="path"
                signInUrl="/auth/sign-in"
                fallbackRedirectUrl="/"
                afterSignUpUrl="/"
                afterSocialAuthSignUpUrl="/"
                socialButtonsVariant="iconButton"
                appearance={{
                  elements: {
                    formButtonPrimary: 'bg-primary hover:bg-primary/90 text-white',
                    card: 'shadow-none',
                    formFieldInput: 'border-input',
                    socialButtonsIconButton: 'border border-input hover:bg-muted',
                    socialButtonsBlockButton: 'bg-white border border-input hover:bg-muted text-black',
                  }
                }}
              />
            )}
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
import { useAuth } from "@clerk/clerk-react"; // Import from Clerk
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  // Use Clerk's useAuth hook
  const { isLoaded, isSignedIn } = useAuth();

  // Show loading indicator while Clerk is initializing
  if (!isLoaded) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // Redirect to sign-in page if user is not signed in
  if (!isSignedIn) {
    return (
      <Route path={path}>
        <Redirect to="/auth/sign-in" />
      </Route>
    );
  }

  // Render the component if user is signed in
  return <Route path={path} component={Component} />;
}

import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useAuth } from "./authContext";
import { ComponentType, LazyExoticComponent } from "react";

// Update the component prop type to accept both regular and lazy-loaded components
export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: ComponentType<any> | LazyExoticComponent<ComponentType<any>>;
}) {
  // Use our custom useAuth hook
  const { isLoaded, isSignedIn } = useAuth();

  // Show loading indicator while auth is initializing
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

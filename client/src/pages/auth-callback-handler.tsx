import { useLocation } from "wouter";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import AuthPage from "./auth-page";
import React from "react";

export default function AuthCallbackHandler() {
  const [location] = useLocation();

  // Check if the current path includes any of the Clerk callback paths
  if (location.includes("/sso-callback") ||
      location.includes("/sign-in/factor-") ||
      location.includes("/sign-in/sso-callback") ||
      location.includes("/sign-up/sso-callback") ||
      location.includes("fallback_redirect_url") ||
      location.includes("oauth") ||
      location.includes("google") ||
      location.includes("social")) {
    console.log("Rendering Clerk callback handler for path:", location);
    // Render the Clerk callback component for any authentication callback
    return <AuthenticateWithRedirectCallback
      afterSignInUrl="/"
      afterSignUpUrl="/"
      afterSocialAuthSignInUrl="/"
      afterSocialAuthSignUpUrl="/"
    />;
  }

  // If it's not a callback path, render the main AuthPage
  return <AuthPage />;
}
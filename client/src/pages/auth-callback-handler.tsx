import { useLocation } from "wouter";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import AuthPage from "./auth-page";
import React from "react";

export default function AuthCallbackHandler() {
  const [location] = useLocation();

  // Check if the current path is an SSO callback path
  if (location.includes("/sso-callback")) {
    // Render the Clerk callback component for SSO
    return <AuthenticateWithRedirectCallback />;
  }

  // If it's not an SSO callback, render the main AuthPage
  return <AuthPage />;
}
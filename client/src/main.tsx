import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ClerkProvider } from "@clerk/clerk-react";

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      redirectUrl="/"
      signInUrl="/auth/sign-in"
      signUpUrl="/auth/sign-up"
      afterSignOutUrl="/"
      appearance={{
        baseTheme: undefined,
        variables: { colorPrimary: '#007bff' },
        elements: {
          formButtonPrimary: 'bg-primary hover:bg-primary/90 text-white',
          card: 'shadow-md rounded-md',
        },
      }}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
);

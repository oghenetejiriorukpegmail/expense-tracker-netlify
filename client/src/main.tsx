import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./theme.css"; // Import the theme CSS

// Firebase Auth is now handled in the App component via the AuthProvider
// No need for a provider wrapper here anymore

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Load environment variables FIRST
require('dotenv/config');

// Use CommonJS require for compatibility with Netlify functions
const express = require("express");
const helmet = require("helmet");
const serverless = require('serverless-http');
const { registerRoutes } = require("./routes");
const { initializeStorage } = require("./storage");
const { initializeEnvFromConfig } = require("./config");

// Import types for TypeScript
const { Request, Response, NextFunction } = require('express');

// Initialize environment variables from config file first
initializeEnvFromConfig();

// Define an async function to initialize the app
async function initializeApp() {
  const app = express();

  // Add helmet middleware for security headers
  // Use default helmet settings for production/serverless
  app.use(helmet());

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Logging middleware (simplified for serverless)
  app.use((req: any, res: any, next: any) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson: any, ...args: any[]) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      // Only log API requests for brevity in serverless logs
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          const responseString = JSON.stringify(capturedJsonResponse);
          // Truncate long responses
          logLine += ` :: ${responseString.length > 50 ? responseString.slice(0, 49) + "…" : responseString}`;
        }
        console.log(logLine); // Use console.log for serverless environments
      }
    });

    next();
  });

  // Firebase authentication is now handled by the auth middleware
  console.log("Using Firebase authentication");

  // Await the storage initialization with better error handling
  let storage;
  try {
    console.log("[SERVER] Awaiting storage initialization...");
    console.log("[SERVER] Module type:", typeof module !== 'undefined' ? 'CommonJS' : 'ESM');
    console.log("[SERVER] initializeStorage type:", typeof initializeStorage);
    
    storage = await initializeStorage(); // Call the initialization function
    
    console.log("[SERVER] Storage initialized successfully.");
    console.log("[SERVER] Storage type:", typeof storage);
    console.log("[SERVER] Storage is null or undefined:", storage === null || storage === undefined);
    if (storage) {
      console.log("[SERVER] Storage methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(storage)));
    }
  } catch (error) {
    console.error("[SERVER] CRITICAL ERROR: Failed to initialize storage:", error);
    if (error instanceof Error) {
      console.error("[SERVER] Error stack:", error.stack);
    }
    // Add a fallback route to handle API requests when storage fails
    app.use('/api/*', (req: any, res: any) => {
      res.status(500).json({
        message: "Server initialization error: Storage failed to initialize",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    });
    
    // Continue with app initialization but with limited functionality
    console.warn("[SERVER] Continuing with limited functionality due to storage initialization failure");
  }

  // Register routes, passing the initialized storage
  if (storage) {
    try {
      console.log("[SERVER] Registering routes with initialized storage...");
      await registerRoutes(app, storage); // Pass storage instance
      console.log("[SERVER] Routes registered successfully.");
    } catch (error) {
      console.error("[SERVER] ERROR: Failed to register routes:", error);
      // Add a fallback route to handle API requests when route registration fails
      app.use('/api/*', (req: any, res: any) => {
        res.status(500).json({
          message: "Server initialization error: Route registration failed",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      });
    }
  } else {
    console.error("[SERVER] ERROR: Cannot register routes - storage is undefined");
  }

  // Centralized error handler
  app.use((err: any, _req: any, res: any, _next: any) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Server error:", err); // Log the full error for debugging
    res.status(status).json({ message });
  });

  // Vite/Static serving is handled by Netlify build/deployment

  return app; // Return the configured app instance
}

// Create a promise for the initialized app
const appPromise = initializeApp();

// Export an async handler function that awaits the app initialization
export const handler = async (event: any, context: any) => {
  // Wait for the app to be initialized on the first invocation
  const app = await appPromise;
  // Create the serverless handler with the initialized app *after* it's ready
  const serverlessHandler = serverless(app);
  // Call the actual serverless handler
  return serverlessHandler(event, context);
};

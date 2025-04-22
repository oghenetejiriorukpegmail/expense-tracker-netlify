import 'dotenv/config'; // Load environment variables FIRST
import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet"; // Import helmet
import serverless from 'serverless-http'; // Import serverless-http
import { registerRoutes } from "./routes";
// import { setupVite, serveStatic, log } from "./vite"; // Vite/Static serving not needed for serverless
import { storage as storagePromise } from "./storage"; // Import the promise
import { initializeEnvFromConfig } from "./config"; // Import config initialization

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
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
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


  // Await the storage initialization
  const storage = await storagePromise;
  console.log("Storage initialized successfully.");

  // Auth setup removed - Supabase handles auth

  // Register routes, passing the initialized storage
  // Assuming registerRoutes modifies the app instance directly or returns it
  await registerRoutes(app, storage); // Pass storage instance
  console.log("Routes registered.");

  // Centralized error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Server error:", err); // Log the full error for debugging
    res.status(status).json({ message });
  });

  // Vite/Static serving is handled by Netlify build/deployment
  // No need for setupVite, serveStatic, or server.listen here

  return app; // Return the configured app instance
}

// Create the handler using serverless-http
// Initialize the app within the handler scope to ensure it's ready for each invocation
export const handler = serverless(initializeApp()); // Pass the promise directly

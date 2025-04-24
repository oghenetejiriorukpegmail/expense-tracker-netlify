import express, { type Express } from "express";
import { createServer, type Server } from "http";
import type { IStorage } from "./storage.js"; // Import the interface type
import { createAuthMiddleware } from "./middleware/auth-middleware.js"; // Import our custom auth middleware

// Import the new router creation functions
import { createProfileRouter } from "./routes/profile.routes.js";
import { createTripRouter } from "./routes/trips.routes.js";
import { createExpenseRouter } from "./routes/expenses.routes.js";
import { createMileageLogRouter } from "./routes/mileage.routes.js";
import { createSettingsRouter } from "./routes/settings.routes.js";
import { createBackgroundTaskRouter } from "./routes/tasks.routes.js";
import { createExportRouter } from "./routes/export.routes.js";

// Removed old helper functions (generateExcelReport, generateZipArchive)
// Removed old route registration functions (registerProfileRoutes, etc.)
// Removed old middleware import (authenticateJWT)

// --- Main Route Registration ---
export async function registerRoutes(app: Express, storage: IStorage): Promise<Server> { // Use IStorage interface
  console.log("[ROUTES] Starting route registration with storage instance...");
  
  try {
    // Verify storage is properly initialized
    if (!storage) {
      throw new Error("Storage instance is undefined or null");
    }
    
    // Log storage instance details to verify it's properly initialized
    // Log storage instance details to verify it's properly initialized
    // Check if it has a specific method from the interface to be more certain
    console.log("[ROUTES] Storage instance received:", storage && typeof (storage as any).getUserByClerkId === 'function' ? "Valid IStorage instance" : "INVALID or UNDEFINED");
    
    // Clerk middleware is applied in server/index.ts
    
    // Create our custom auth middleware
    console.log("[ROUTES] Creating auth middleware...");
    const authMiddleware = createAuthMiddleware(storage);
    console.log("[ROUTES] Auth middleware created successfully");

    // Mount the new resource-specific routers with auth middleware
    console.log("[ROUTES] Mounting API routes...");
    
    // Use type assertion to work around TypeScript errors with middleware
    app.use('/api/profile', authMiddleware as any, createProfileRouter(storage));
    app.use('/api/trips', authMiddleware as any, createTripRouter(storage));
    app.use('/api/expenses', authMiddleware as any, createExpenseRouter(storage));
    app.use('/api/mileage-logs', authMiddleware as any, createMileageLogRouter(storage));
    app.use('/api/settings', authMiddleware as any, createSettingsRouter()); // Settings routes might not need storage
    app.use('/api/background-tasks', authMiddleware as any, createBackgroundTaskRouter(storage));
    app.use('/api/export', authMiddleware as any, createExportRouter(storage)); // Mount export routes under /api/export
    
    console.log("[ROUTES] All API routes mounted successfully");

    // Note: OCR routes were part of expenses/mileage logs and handled there or via background functions

    // Default error handler is now in server/index.ts

    // Create server instance (might be redundant if serverless handler is used)
    const httpServer = createServer(app);
    console.log("[ROUTES] HTTP server created");
    return httpServer;
  } catch (error) {
    console.error("[ROUTES] ERROR during route registration:", error);
    // Still create and return a server even if there was an error
    // This allows the application to start, but routes will return errors
    const httpServer = createServer(app);
    
    // Add a fallback error route that will catch all API requests if routes failed to register
    app.use('/api/*', (req, res) => {
      res.status(500).json({
        message: "Server initialization error. Please check server logs.",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    });
    
    return httpServer;
  }
}

import express, { type Express } from "express";
import { createServer, type Server } from "http";
import type { SupabaseStorage } from "./supabase-storage"; // Use specific type
import { createAuthMiddleware } from "./middleware/auth-middleware"; // Import our custom auth middleware

// Import the new router creation functions
import { createProfileRouter } from "./routes/profile.routes";
import { createTripRouter } from "./routes/trips.routes";
import { createExpenseRouter } from "./routes/expenses.routes";
import { createMileageLogRouter } from "./routes/mileage.routes";
import { createSettingsRouter } from "./routes/settings.routes";
import { createBackgroundTaskRouter } from "./routes/tasks.routes";
import { createExportRouter } from "./routes/export.routes";

// Removed old helper functions (generateExcelReport, generateZipArchive)
// Removed old route registration functions (registerProfileRoutes, etc.)
// Removed old middleware import (authenticateJWT)

// --- Main Route Registration ---
export async function registerRoutes(app: Express, storage: SupabaseStorage): Promise<Server> {
  // Clerk middleware is applied in server/index.ts
  
  // Create our custom auth middleware
  const authMiddleware = createAuthMiddleware(storage);

  // Mount the new resource-specific routers with auth middleware
  app.use('/api/profile', authMiddleware, createProfileRouter(storage));
  app.use('/api/trips', authMiddleware, createTripRouter(storage));
  app.use('/api/expenses', authMiddleware, createExpenseRouter(storage));
  app.use('/api/mileage-logs', authMiddleware, createMileageLogRouter(storage));
  app.use('/api/settings', authMiddleware, createSettingsRouter()); // Settings routes might not need storage
  app.use('/api/background-tasks', authMiddleware, createBackgroundTaskRouter(storage));
  app.use('/api/export', authMiddleware, createExportRouter(storage)); // Mount export routes under /api/export

  // Note: OCR routes were part of expenses/mileage logs and handled there or via background functions

  // Default error handler is now in server/index.ts

  // Create server instance (might be redundant if serverless handler is used)
  const httpServer = createServer(app);
  return httpServer;
}

import express, { type Express } from "express";
import { createServer, type Server } from "http";
import type { SupabaseStorage } from "./supabase-storage"; // Use specific type

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

  // Mount the new resource-specific routers
  app.use('/api/profile', createProfileRouter(storage));
  app.use('/api/trips', createTripRouter(storage));
  app.use('/api/expenses', createExpenseRouter(storage));
  app.use('/api/mileage-logs', createMileageLogRouter(storage));
  app.use('/api/settings', createSettingsRouter()); // Settings routes might not need storage
  app.use('/api/background-tasks', createBackgroundTaskRouter(storage));
  app.use('/api/export', createExportRouter(storage)); // Mount export routes under /api/export

  // Note: OCR routes were part of expenses/mileage logs and handled there or via background functions

  // Default error handler is now in server/index.ts

  // Create server instance (might be redundant if serverless handler is used)
  const httpServer = createServer(app);
  return httpServer;
}

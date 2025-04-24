import express, { type Request, Response, NextFunction } from "express";
import { z } from "zod";
import type { IStorage } from "../storage.js"; // Add .js extension
import type { User, PublicUser } from "../../shared/schema.js"; // Use relative path with .js extension
import fetch from 'node-fetch'; // Import fetch for triggering background functions

// Define request type with user property
interface AuthenticatedRequest extends Request {
  user: PublicUser; // Our middleware attaches the user object here
}

export function createExportRouter(storage: IStorage): express.Router { // Use IStorage interface
  const router = express.Router();

  // POST /api/export-expenses (Now triggers background function)
  router.post("/expenses", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Cast the request to our authenticated request type
      const authReq = req as AuthenticatedRequest;
      const userProfile = authReq.user;
      const internalUserId = userProfile.id;

      // Extract filters and format from request body
      const exportRequestSchema = z.object({
        format: z.enum(['csv', 'xlsx']).default('xlsx'),
        filters: z.object({
            startDate: z.string().optional(), // Expect YYYY-MM-DD
            endDate: z.string().optional(),   // Expect YYYY-MM-DD
            tripName: z.string().optional(), // Use tripName
            type: z.string().optional(), // Add type filter
        }).optional(),
      });

      const validatedBody = exportRequestSchema.parse(req.body);

      console.log(`Received request to export expenses for user ${internalUserId} with format ${validatedBody.format}`);

      // 1. Create a background task record
      const taskData = {
          userId: internalUserId,
          type: 'expense_export' as const, // Use const assertion
          status: 'pending' as const,
      }; // Added missing closing brace here
      const backgroundTask = await storage.createBackgroundTask(taskData);
      console.log(`Created background task (ID: ${backgroundTask.id}) for expense export.`);

      // 2. Prepare payload for the background function
      const payload = {
        userId: String(internalUserId), // Pass internal ID
        format: validatedBody.format,
        filters: validatedBody.filters || {}, // Pass filters from body
        taskId: backgroundTask.id // Pass the task ID
      };

      // 3. Trigger the background function (asynchronously)
      const functionUrl = `/.netlify/functions/export-expenses`;
      console.log(`Triggering background function: ${functionUrl} for task ID ${backgroundTask.id}`);

      fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(async (fetchError) => {
        console.error(`Error triggering background function ${functionUrl} for task ${backgroundTask.id}:`, fetchError);
        // Update task status to failed if trigger fails
        await storage.updateBackgroundTaskStatus(backgroundTask.id, 'failed', null, `Failed to trigger background function: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
      });

      // 4. Return an immediate response to the client with the task info
      res.status(202).json({
        message: "Expense export started. You can monitor the task status.",
        task: backgroundTask, // Return the created task record
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
      }
      console.error("Error in /api/export-expenses trigger:", error);
      next(error);
    }
  });

  return router;
}
import express, { type Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getAuth } from "@clerk/express"; // Import Clerk getAuth
import type { SupabaseStorage } from "../supabase-storage";
import type { User } from "@shared/schema"; // Assuming User type is still relevant for internal ID

// Define request type augmentation for Clerk auth
interface ClerkRequest extends Request {
  auth?: { userId?: string | null }; // Clerk attaches auth here
  user?: User | null | undefined; // Keep for potential internal ID usage if needed
}

export function createBackgroundTaskRouter(storage: SupabaseStorage): express.Router {
  const router = express.Router();

  // GET /api/background-tasks
  router.get("/", async (req: ClerkRequest, res: Response, next: NextFunction) => {
    try {
      const { userId: authUserId } = getAuth(req);
      if (!authUserId) return res.status(401).send("Unauthorized");

      const userProfile = await storage.getUserByClerkId(authUserId);
      if (!userProfile) return res.status(404).send("User profile not found");
      const internalUserId = userProfile.id;

      const tasks = await storage.getBackgroundTasksByUserId(internalUserId);
      res.json(tasks);
    } catch (error) { next(error); }
  });

  // GET /api/background-tasks/:id
  router.get("/:id", async (req: ClerkRequest, res: Response, next: NextFunction) => {
    try {
      const { userId: authUserId } = getAuth(req);
      if (!authUserId) return res.status(401).send("Unauthorized");

      const userProfile = await storage.getUserByClerkId(authUserId);
      if (!userProfile) return res.status(404).send("User profile not found");
      const internalUserId = userProfile.id;

      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) return res.status(400).send("Invalid task ID");

      const task = await storage.getBackgroundTaskById(taskId);
      if (!task) return res.status(404).send("Background task not found");
      if (task.userId !== internalUserId) return res.status(403).send("Forbidden");

      res.json(task);
    } catch (error) { next(error); }
  });

  return router;
}
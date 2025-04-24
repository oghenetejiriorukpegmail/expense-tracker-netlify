import express, { type Request, Response, NextFunction } from "express";
import { z } from "zod";
import type { IStorage } from "../storage.js"; // Add .js extension
import type { User, PublicUser } from "../../shared/schema.js"; // Use relative path with .js extension

// Define request type with user property
interface AuthenticatedRequest extends Request {
  user: PublicUser; // Our middleware attaches the user object here
}

export function createBackgroundTaskRouter(storage: IStorage): express.Router { // Use IStorage interface
  const router = express.Router();

  // GET /api/background-tasks
  router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Cast the request to our authenticated request type
      const authReq = req as AuthenticatedRequest;
      const userProfile = authReq.user;
      const internalUserId = userProfile.id;

      const tasks = await storage.getBackgroundTasksByUserId(internalUserId);
      res.json(tasks);
    } catch (error) { next(error); }
  });

  // GET /api/background-tasks/:id
  router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Cast the request to our authenticated request type
      const authReq = req as AuthenticatedRequest;
      const userProfile = authReq.user;
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
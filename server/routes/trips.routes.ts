import express, { type Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getAuth } from "@clerk/express"; // Import Clerk getAuth
import { insertTripSchema } from "@shared/schema";
import type { SupabaseStorage } from "../supabase-storage";
import type { User } from "@shared/schema"; // Assuming User type is still relevant for internal ID

// Define request type augmentation for Clerk auth
interface ClerkRequest extends Request {
  auth?: { userId?: string | null }; // Clerk attaches auth here
}

export function createTripRouter(storage: SupabaseStorage): express.Router {
  const router = express.Router();

  // GET /api/trips
  router.get("/", async (req: ClerkRequest, res: Response, next: NextFunction) => {
    try {
      const { userId: authUserId } = getAuth(req);
      if (!authUserId) return res.status(401).send("Unauthorized");

      // Fetch internal user ID based on Clerk ID
      const userProfile = await storage.getUserByClerkId(authUserId);
      if (!userProfile) return res.status(404).send("User profile not found");
      const internalUserId = userProfile.id;

      const trips = await storage.getTripsByUserId(internalUserId);
      res.json(trips);
    } catch (error) { next(error); }
  });

  // POST /api/trips
  router.post("/", async (req: ClerkRequest, res: Response, next: NextFunction) => {
    try {
      const { userId: authUserId } = getAuth(req);
      if (!authUserId) return res.status(401).send("Unauthorized");

      const userProfile = await storage.getUserByClerkId(authUserId);
      if (!userProfile) return res.status(404).send("User profile not found");
      const internalUserId = userProfile.id;

      const validatedData = insertTripSchema.parse(req.body);
      const trip = await storage.createTrip({ ...validatedData, userId: internalUserId });
      res.status(201).json(trip);
    } catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ message: "Validation failed", errors: error.errors });
        next(error);
    }
  });

  // PUT /api/trips/:id
  router.put("/:id", async (req: ClerkRequest, res: Response, next: NextFunction) => {
    try {
      const { userId: authUserId } = getAuth(req);
      if (!authUserId) return res.status(401).send("Unauthorized");

      const userProfile = await storage.getUserByClerkId(authUserId);
      if (!userProfile) return res.status(404).send("User profile not found");
      const internalUserId = userProfile.id;

      const tripId = parseInt(req.params.id);
      if (isNaN(tripId)) return res.status(400).send("Invalid trip ID");

      const trip = await storage.getTrip(tripId);
      if (!trip) return res.status(404).send("Trip not found");
      if (trip.userId !== internalUserId) return res.status(403).send("Forbidden");

      const validatedData = insertTripSchema.parse(req.body);
      const updatedTrip = await storage.updateTrip(tripId, validatedData);
      res.json(updatedTrip);
    } catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ message: "Validation failed", errors: error.errors });
        next(error);
    }
  });

  // DELETE /api/trips/:id
  router.delete("/:id", async (req: ClerkRequest, res: Response, next: NextFunction) => {
    try {
      const { userId: authUserId } = getAuth(req);
      if (!authUserId) return res.status(401).send("Unauthorized");

      const userProfile = await storage.getUserByClerkId(authUserId);
      if (!userProfile) return res.status(404).send("User profile not found");
      const internalUserId = userProfile.id;

      const tripId = parseInt(req.params.id);
      if (isNaN(tripId)) return res.status(400).send("Invalid trip ID");

      const trip = await storage.getTrip(tripId);
      if (!trip) return res.status(404).send("Trip not found");
      if (trip.userId !== internalUserId) return res.status(403).send("Forbidden");

      await storage.deleteTrip(tripId);
      res.status(204).send();
    } catch (error) { next(error); }
  });

  // Note: Batch process receipts route removed as it's complex and might need rethinking with background functions

  return router;
}
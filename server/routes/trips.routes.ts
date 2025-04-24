import express, { type Request, Response, NextFunction } from "express";
import { z } from "zod";
import { insertTripSchema } from "@shared/schema";
import type { IStorage } from "../storage"; // Import the interface type
import type { User, PublicUser } from "@shared/schema";

// Define request type with user property
interface AuthenticatedRequest extends Request {
  user: PublicUser; // Our middleware attaches the user object here
}

export function createTripRouter(storage: IStorage): express.Router { // Use IStorage interface
  const router = express.Router();

  // GET /api/trips
  router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Cast the request to our authenticated request type
      const authReq = req as AuthenticatedRequest;
      const userProfile = authReq.user;
      const internalUserId = userProfile.id;

      const trips = await storage.getTripsByUserId(internalUserId);
      res.json(trips);
    } catch (error) { next(error); }
  });

  // POST /api/trips
  router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("[TRIPS] POST /api/trips - Creating new trip");
      
      // Cast the request to our authenticated request type
      const authReq = req as AuthenticatedRequest;
      const userProfile = authReq.user;
      const internalUserId = userProfile.id;
      console.log("[TRIPS] User ID:", internalUserId);
      
      console.log("[TRIPS] Request body:", req.body);
      const validatedData = insertTripSchema.parse(req.body);
      console.log("[TRIPS] Validated data:", validatedData);
      
      console.log("[TRIPS] Storage object type:", typeof storage);
      console.log("[TRIPS] Storage has createTrip method:", typeof storage.createTrip === 'function');
      
      const trip = await storage.createTrip({ ...validatedData, userId: internalUserId });
      console.log("[TRIPS] Trip created successfully:", trip);
      
      res.status(201).json(trip);
    } catch (error) {
        console.error("[TRIPS] Error creating trip:", error);
        if (error instanceof Error) {
          console.error("[TRIPS] Error stack:", error.stack);
        }
        if (error instanceof z.ZodError) return res.status(400).json({ message: "Validation failed", errors: error.errors });
        next(error);
    }
  });

  // PUT /api/trips/:id
  router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Cast the request to our authenticated request type
      const authReq = req as AuthenticatedRequest;
      const userProfile = authReq.user;
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
  router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Cast the request to our authenticated request type
      const authReq = req as AuthenticatedRequest;
      const userProfile = authReq.user;
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
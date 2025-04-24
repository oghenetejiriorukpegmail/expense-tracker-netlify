import express, { type Request, Response, NextFunction } from "express";
import { z } from "zod";
import type { IStorage } from "../storage.js"; // Add .js extension
import type { User, PublicUser } from "../../shared/schema.js"; // Use relative path with .js extension

// Define request type with user property
interface AuthenticatedRequest extends Request {
  user: PublicUser; // Our middleware attaches the user object here
}

export function createProfileRouter(storage: IStorage): express.Router { // Use IStorage interface
  const router = express.Router();

  // GET /api/profile
  router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    // Cast the request to our authenticated request type
    const authReq = req as AuthenticatedRequest;
    try {
      // User is already attached to the request by our middleware
      const userProfile = authReq.user;
      
      // Return the user profile
      res.json(userProfile);
    } catch (error) {
      next(error);
    }
  });

  // PUT /api/profile
  const profileUpdateSchema = z.object({
    firstName: z.string().min(1, "First name cannot be empty").default(''),
    lastName: z.string().optional().default(''),
    phoneNumber: z.string().optional().default(''),
    email: z.string().email("Invalid email address"), // Clerk manages email, consider if this should be updatable here
    bio: z.string().optional(),
  });

  router.put("/", async (req: Request, res: Response, next: NextFunction) => {
    // Cast the request to our authenticated request type
    const authReq = req as AuthenticatedRequest;
    try {
      const validatedData = profileUpdateSchema.parse(req.body);

      // User is already attached to the request by our middleware
      const userProfile = authReq.user;
      const internalUserId = userProfile.id; // Get the internal integer ID

      // Check if email is being changed and if it conflicts (Clerk usually handles primary email)
      // This logic might need adjustment depending on how emails are managed with Clerk
      if (validatedData.email && validatedData.email !== userProfile.email) {
          const existingUserByEmail = await storage.getUserByEmail(validatedData.email);
          if (existingUserByEmail && existingUserByEmail.id !== internalUserId) {
             return res.status(409).json({ message: "Email already in use by another account." });
          }
          // Note: Consider if email updates should be handled via Clerk settings instead.
      }

      // Update the profile in your public.users table using the internal ID
      const updatedUser = await storage.updateUserProfile(internalUserId, validatedData);
      if (!updatedUser) return res.status(404).send("User not found after update attempt");

      const { password, ...profileData } = updatedUser;
      res.json(profileData);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Validation failed", errors: error.errors });
      // Removed UNIQUE constraint check as email uniqueness might be handled differently
      next(error);
    }
  });

  // POST /api/profile/change-password - This should be handled by Clerk UI/API, not a custom endpoint
  // router.post("/change-password", ... ); // Removed

  return router;
}
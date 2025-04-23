import express, { type Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getAuth } from "@clerk/express"; // Import Clerk getAuth
import type { SupabaseStorage } from "../supabase-storage";
import type { User } from "@shared/schema";

// Define request type augmentation for Clerk auth
interface ClerkRequest extends Request {
  auth?: { userId?: string | null }; // Clerk attaches auth here
}

export function createProfileRouter(storage: SupabaseStorage): express.Router {
  const router = express.Router();

  // GET /api/profile
  router.get("/", async (req: ClerkRequest, res: Response, next: NextFunction) => {
    try {
      const { userId: authUserId } = getAuth(req); // Get userId from Clerk
      if (!authUserId) {
        return res.status(401).send("Unauthorized");
      }
      // Fetch user profile from DB using the Clerk authUserId
      // Assuming getUserByAuthId still exists but now uses Clerk's ID format
      const userProfile = await storage.getUserByClerkId(authUserId); // Need to implement getUserByClerkId
      if (!userProfile) {
         // Optionally create a profile if one doesn't exist, or handle as needed
         console.warn(`Profile not found for Clerk user ID: ${authUserId}`);
         return res.status(404).send("User profile not found");
      }
      // Exclude password if it exists (though it shouldn't in public.users)
      const { password, ...profileData } = userProfile;
      res.json(profileData);
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

  router.put("/", async (req: ClerkRequest, res: Response, next: NextFunction) => {
    try {
      const { userId: authUserId } = getAuth(req);
      if (!authUserId) {
        return res.status(401).send("Unauthorized");
      }
      const validatedData = profileUpdateSchema.parse(req.body);

      // Fetch the internal user ID based on Clerk ID
      const userProfile = await storage.getUserByClerkId(authUserId);
      if (!userProfile) {
          return res.status(404).send("User profile not found");
      }
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
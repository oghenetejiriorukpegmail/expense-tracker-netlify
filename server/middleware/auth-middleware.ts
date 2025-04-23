import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import type { SupabaseStorage } from "../supabase-storage";

// Define request type augmentation for Clerk auth
interface ClerkRequest extends Request {
  auth?: { userId?: string | null }; // Clerk attaches auth here
}

// Create a middleware function that verifies authentication and attaches user data
export function createAuthMiddleware(storage: SupabaseStorage) {
  return async (req: ClerkRequest, res: Response, next: NextFunction) => {
    try {
      // Get Clerk user ID from the request
      const { userId: clerkUserId } = getAuth(req);
      
      // If no Clerk user ID, return unauthorized
      if (!clerkUserId) {
        console.log("Auth: No Authorization header found or not Bearer.");
        return res.status(401).json({ message: "Unauthorized: Authorization header missing or invalid" });
      }

      // Fetch the user from the database using the Clerk user ID
      const user = await storage.getUserByClerkId(clerkUserId);
      
      // If user not found in our database, return unauthorized
      if (!user) {
        console.log(`Auth: User with Clerk ID ${clerkUserId} not found in database.`);
        return res.status(401).json({ message: "Unauthorized: User not found in database" });
      }

      // Attach the user to the request object for use in route handlers
      (req as any).user = user;
      
      // Continue to the next middleware or route handler
      next();
    } catch (error) {
      console.error("Auth Middleware Catch Error:", error);
      return res.status(500).json({ message: "Internal Server Error during authentication" });
    }
  };
}
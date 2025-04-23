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
      let user = await storage.getUserByClerkId(clerkUserId);
      
      // If user not found in our database, create a new user
      if (!user) {
        console.log(`Auth: User with Clerk ID ${clerkUserId} not found in database. Creating new user.`);
        try {
          // Get user info from Clerk auth object if available
          const email = req.auth?.sessionClaims?.email as string || '';
          const firstName = req.auth?.sessionClaims?.firstName as string || '';
          const lastName = req.auth?.sessionClaims?.lastName as string || '';
          
          // Create a new user with the Clerk ID
          user = await storage.createUserWithClerkId(clerkUserId, email, firstName, lastName);
          console.log(`Auth: Created new user with ID ${user.id} for Clerk ID ${clerkUserId}`);
        } catch (error) {
          console.error(`Auth: Failed to create user for Clerk ID ${clerkUserId}:`, error);
          return res.status(500).json({ message: "Failed to create user account" });
        }
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
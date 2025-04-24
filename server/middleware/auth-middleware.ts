import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { clerkClient } from "@clerk/clerk-sdk-node";
import type { IStorage } from "../storage.js"; // Import the interface type

// Define request type augmentation for Clerk auth
interface ClerkRequest extends Request {
  auth?: { userId?: string | null }; // Clerk attaches auth here
  headers: {
    authorization?: string;
    [key: string]: string | undefined;
  };
}

// Create a middleware function that verifies authentication and attaches user data
export function createAuthMiddleware(storage: IStorage) { // Use IStorage interface
  console.log("[AUTH] Creating auth middleware with storage");
  
  return async (req: ClerkRequest, res: Response, next: NextFunction) => {
    try {
      console.log("[AUTH] Processing request:", req.method, req.path);
      
      // Verify storage is valid
      if (!storage) {
        console.error("[AUTH] CRITICAL ERROR: Storage is undefined in auth middleware");
        return res.status(500).json({ message: "Server configuration error: Storage not initialized" });
      }
      
      // Get Clerk user ID from the request
      const { userId: clerkUserId } = getAuth(req);
      
      // Debug: Log the entire auth object to see its structure
      console.log("[AUTH] Clerk auth object:", JSON.stringify(req.auth, null, 2));
      
      // If no Clerk user ID, return unauthorized
      if (!clerkUserId) {
        console.log("[AUTH] No Authorization header found or not Bearer.");
        return res.status(401).json({ message: "Unauthorized: Authorization header missing or invalid" });
      }
      
      console.log("[AUTH] Authenticated with Clerk user ID:", clerkUserId);

      // Fetch the user from the database using the Clerk user ID
      console.log("[AUTH] Fetching user from database with Clerk ID:", clerkUserId);
      let user;
      try {
        user = await storage.getUserByClerkId(clerkUserId);
        console.log("[AUTH] User lookup result:", user ? `Found user with ID ${user.id}` : "User not found");
      } catch (dbError) {
        console.error("[AUTH] Database error during user lookup:", dbError);
        return res.status(500).json({ message: "Database error during authentication" });
      }
      
      // If user not found in our database, create a new user
      if (!user) {
        console.log(`[AUTH] User with Clerk ID ${clerkUserId} not found in database. Creating new user.`);
        
        // Log headers to see what information is available
        console.log("[AUTH] Request headers:", JSON.stringify(req.headers, null, 2));
        
        // Fetch user details from Clerk
        console.log(`[AUTH] Fetching user details from Clerk for ID ${clerkUserId}`);
        let email = '';
        let firstName = '';
        let lastName = '';
        
        try {
          const clerkUser = await clerkClient.users.getUser(clerkUserId);
          
          // Extract user information from Clerk
          if (clerkUser) {
            // Get primary email if available
            if (clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
              const primaryEmail = clerkUser.emailAddresses.find(email => email.id === clerkUser.primaryEmailAddressId);
              email = primaryEmail ? primaryEmail.emailAddress : clerkUser.emailAddresses[0].emailAddress;
            }
            
            firstName = clerkUser.firstName || '';
            lastName = clerkUser.lastName || '';
            
            console.log(`[AUTH] Successfully fetched user details from Clerk - Email: ${email}, First Name: ${firstName}, Last Name: ${lastName}`);
          }
        } catch (clerkError) {
          console.error("[AUTH] Error fetching user details from Clerk:", clerkError);
          // Continue with empty values if Clerk API fails
        }
        
        // Create a new user with the Clerk ID
        console.log(`[AUTH] About to create user with Clerk ID ${clerkUserId}`);
        try {
          user = await storage.createUserWithClerkId(clerkUserId, email, firstName, lastName);
          console.log(`[AUTH] Created new user with ID ${user.id} for Clerk ID ${clerkUserId}`);
        } catch (createError: any) {
          // Enhanced error logging
          console.error(`[AUTH] Failed to create user for Clerk ID ${clerkUserId}:`, createError);
          console.error("[AUTH] Error details:", {
            message: createError?.message || 'Unknown error',
            name: createError?.name,
            stack: createError?.stack,
            code: createError?.code
          });
          
          // Check if it's a duplicate key error (user might have been created in a race condition)
          if (createError?.message?.includes('duplicate key') || createError?.code === '23505') {
            console.log(`[AUTH] Possible race condition detected. Trying to fetch user again.`);
            try {
              // Try to fetch the user again in case it was created in another request
              user = await storage.getUserByClerkId(clerkUserId);
              if (user) {
                console.log(`[AUTH] Successfully retrieved user after race condition: ${user.id}`);
              } else {
                return res.status(500).json({ message: "Failed to create or retrieve user account" });
              }
            } catch (retryError) {
              console.error(`[AUTH] Failed to retrieve user after race condition:`, retryError);
              return res.status(500).json({ message: "Failed to create user account (duplicate key)" });
            }
          } else {
            return res.status(500).json({ message: "Failed to create user account" });
          }
        }
      }

      // Attach the user to the request object for use in route handlers
      if (!user) {
        console.error("[AUTH] CRITICAL ERROR: User is still undefined after all attempts");
        return res.status(500).json({ message: "Failed to authenticate user" });
      }
      
      console.log(`[AUTH] Successfully authenticated user ${user.id} (Clerk ID: ${clerkUserId})`);
      (req as any).user = user;
      
      // Continue to the next middleware or route handler
      next();
    } catch (error) {
      console.error("[AUTH] Unhandled error in auth middleware:", error);
      console.error("[AUTH] Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        name: error instanceof Error ? error.name : "Unknown",
        stack: error instanceof Error ? error.stack : "No stack trace"
      });
      return res.status(500).json({ message: "Internal Server Error during authentication" });
    }
  };
}
import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { clerkClient } from "@clerk/clerk-sdk-node";
import type { SupabaseStorage } from "../supabase-storage";

// Define request type augmentation for Clerk auth
interface ClerkRequest extends Request {
  auth?: { userId?: string | null }; // Clerk attaches auth here
  headers: {
    authorization?: string;
    [key: string]: string | undefined;
  };
}

// Create a middleware function that verifies authentication and attaches user data
export function createAuthMiddleware(storage: SupabaseStorage) {
  return async (req: ClerkRequest, res: Response, next: NextFunction) => {
    try {
      // Get Clerk user ID from the request
      const { userId: clerkUserId } = getAuth(req);
      
      // Debug: Log the entire auth object to see its structure
      console.log("Auth Debug: Clerk auth object:", JSON.stringify(req.auth, null, 2));
      
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
          // Log headers to see what information is available
          console.log("Auth Debug: Request headers:", JSON.stringify(req.headers, null, 2));
          
          // Fetch user details from Clerk
          console.log(`Auth Debug: Fetching user details from Clerk for ID ${clerkUserId}`);
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
              
              console.log(`Auth Debug: Successfully fetched user details from Clerk - Email: ${email}, First Name: ${firstName}, Last Name: ${lastName}`);
            }
          } catch (clerkError) {
            console.error("Auth Debug: Error fetching user details from Clerk:", clerkError);
            // Continue with empty values if Clerk API fails
          }
          
          // Create a new user with the Clerk ID
          console.log(`Auth Debug: About to create user with Clerk ID ${clerkUserId}`);
          try {
            user = await storage.createUserWithClerkId(clerkUserId, email, firstName, lastName);
            console.log(`Auth: Created new user with ID ${user.id} for Clerk ID ${clerkUserId}`);
          } catch (error: any) {
            // Enhanced error logging
            console.error(`Auth: Failed to create user for Clerk ID ${clerkUserId}:`, error);
            console.error("Auth Debug: Error details:", {
              message: error?.message || 'Unknown error',
              name: error?.name,
              stack: error?.stack,
              code: error?.code
            });
            return res.status(500).json({ message: "Failed to create user account" });
          }
        } catch (innerError) {
          console.error("Auth: Inner try-catch error:", innerError);
          return res.status(500).json({ message: "Failed to process user creation" });
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
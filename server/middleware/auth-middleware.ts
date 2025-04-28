import { Request, Response, NextFunction } from "express";
import { adminAuth } from '../firebase-admin'; // Use the initialized admin auth instance
import type { IStorage } from "../storage.js"; // Import the interface type

// Define request type augmentation for Firebase auth
interface FirebaseRequest extends Request {
  headers: {
    authorization?: string;
    [key: string]: string | undefined;
  };
}

// Create a middleware function that verifies authentication and attaches user data
export function createAuthMiddleware(storage: IStorage) {
  console.log("[AUTH] Creating auth middleware with storage");
  
  return async (req: FirebaseRequest, res: Response, next: NextFunction) => {
    try {
      console.log("[AUTH] Processing request:", req.method, req.path);
      
      // Verify storage is valid
      if (!storage) {
        console.error("[AUTH] CRITICAL ERROR: Storage is undefined in auth middleware");
        return res.status(500).json({ message: "Server configuration error: Storage not initialized" });
      }
      
      // Get the authorization header
      const authHeader = req.headers.authorization;
      
      // If no auth header, return unauthorized
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log("[AUTH] No Authorization header found or not Bearer.");
        return res.status(401).json({ message: "Unauthorized: Authorization header missing or invalid" });
      }
      
      // Extract the token
      const token = authHeader.split('Bearer ')[1];
      
      // Verify the Firebase token
      let decodedToken;
      try {
        decodedToken = await adminAuth.verifyIdToken(token);
      } catch (tokenError) {
        console.error("[AUTH] Invalid Firebase token:", tokenError);
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
      }
      
      const firebaseUserId = decodedToken.uid;
      console.log("[AUTH] Authenticated with Firebase user ID:", firebaseUserId);

      // Fetch the user from the database using the Firebase user ID
      console.log("[AUTH] Fetching user from database with Firebase ID:", firebaseUserId);
      let user;
      try {
        user = await storage.getUserByFirebaseId(firebaseUserId);
        console.log("[AUTH] User lookup result:", user ? `Found user with ID ${user.id}` : "User not found");
      } catch (dbError) {
        console.error("[AUTH] Database error during user lookup:", dbError);
        return res.status(500).json({ message: "Database error during authentication" });
      }
      
      // If user not found in our database, create a new user
      if (!user) {
        console.log(`[AUTH] User with Firebase ID ${firebaseUserId} not found in database. Creating new user.`);
        
        // Extract user information from the decoded token
        const email = decodedToken.email || '';
        const name = decodedToken.name || '';
        
        // Split name into first and last name if available
        let firstName = '';
        let lastName = '';
        
        if (name) {
          const nameParts = name.split(' ');
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        }
        
        // Create a new user with the Firebase ID
        console.log(`[AUTH] About to create user with Firebase ID ${firebaseUserId}`);
        try {
          user = await storage.createUserWithFirebaseId(firebaseUserId, email, firstName, lastName);
          console.log(`[AUTH] Created new user with ID ${user.id} for Firebase ID ${firebaseUserId}`);
        } catch (createError: any) {
          // Enhanced error logging
          console.error(`[AUTH] Failed to create user for Firebase ID ${firebaseUserId}:`, createError);
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
              user = await storage.getUserByFirebaseId(firebaseUserId);
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
      
      console.log(`[AUTH] Successfully authenticated user ${user.id} (Firebase ID: ${firebaseUserId})`);
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
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthMiddleware = void 0;
// Create auth middleware factory
function createAuthMiddleware(storage) {
    console.log("[AUTH] Creating auth middleware with storage");
    
    // Return the middleware function
    return async function authMiddleware(req, res, next) {
        try {
            console.log("[AUTH] Processing request:", req.method, req.path);
            
            // Get auth info from Clerk middleware
            const clerkAuth = req.auth;
            console.log("[AUTH] Clerk auth object:", JSON.stringify(clerkAuth, null, 2));
            
            if (!clerkAuth || !clerkAuth.userId) {
                console.log("[AUTH] No auth info or user ID found, returning 401");
                return res.status(401).json({ message: "Authentication required" });
            }
            
            // Extract Clerk user ID
            const clerkUserId = clerkAuth.userId;
            console.log("[AUTH] Authenticated with Clerk user ID:", clerkUserId);
            
            // Look up internal user ID from Clerk ID
            console.log("[AUTH] Fetching user from database with Clerk ID:", clerkUserId);
            const user = await storage.getUserByClerkId(clerkUserId);
            console.log("[AUTH] User lookup result:", user ? `Found user with ID ${user.id}` : "User not found");
            
            if (!user) {
                console.log("[AUTH] User not found in database, returning 403");
                return res.status(403).json({ message: "User not found" });
            }
            
            // Attach user to request
            req.user = user;
            console.log("[AUTH] Successfully authenticated user", user.id, "(Clerk ID:", clerkUserId + ")");
            
            // Continue to next middleware/route handler
            next();
        } catch (error) {
            console.error("[AUTH] Error in auth middleware:", error);
            res.status(500).json({ message: "Authentication error" });
        }
    };
}
exports.createAuthMiddleware = createAuthMiddleware;
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthMiddleware = void 0;

// Create auth middleware
function createAuthMiddleware(storage) {
    return async (req, res, next) => {
        try {
            console.log("[AUTH] Processing request:", req.method, req.path);
            
            // Get Clerk auth object from the request
            // This is added by the Clerk middleware
            const auth = req.auth;
            
            if (!auth) {
                console.log("[AUTH] No auth object found in request");
                return res.status(401).json({ message: "Unauthorized" });
            }
            
            console.log("[AUTH] Clerk auth object:", auth);
            
            // Check if user is authenticated
            if (!auth.userId) {
                console.log("[AUTH] No user ID in auth object");
                return res.status(401).json({ message: "Unauthorized" });
            }
            
            console.log("[AUTH] Authenticated with Clerk user ID:", auth.userId);
            
            // Get user from database
            console.log("[AUTH] Fetching user from database with Clerk ID:", auth.userId);
            const user = await storage.getUserByClerkId(auth.userId);
            
            console.log("[AUTH] User lookup result:", user ? "Found user with ID " + user.id : "User not found");
            
            if (!user) {
                console.log("[AUTH] User not found in database, returning 403");
                return res.status(403).json({ message: "User not found" });
            }
            
            // Add user to request
            req.user = user;
            console.log("[AUTH] Successfully authenticated user", user.id, "(Clerk ID:", auth.userId + ")");
            
            // Continue to next middleware
            next();
        } catch (error) {
            console.error("[AUTH] Error in auth middleware:", error);
            res.status(500).json({ message: "Server error" });
        }
    };
}
exports.createAuthMiddleware = createAuthMiddleware;
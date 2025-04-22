import { Request, Response, NextFunction } from 'express';
import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { User as AppUser } from '@shared/schema'; // Import your application's User type
import type { IStorage } from '../storage'; // Import the storage interface

// Extend Express Request interface to include the application user property
declare global {
    namespace Express {
        interface Request {
            user?: AppUser | null; // Ensure this is the AppUser type from schema
            supabaseUser?: SupabaseUser | null; // Keep Supabase user info if needed separately
            supabase?: SupabaseClient; // Optional: Attach client to request if needed elsewhere
        }
    }
}

// Initialize Supabase client (remains the same)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase URL or Service Key is missing in environment variables.");
    // Optionally throw an error
}
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

// Middleware factory function that accepts the storage instance
export const authenticateJWT = (storage: IStorage) => {
    // Return the actual middleware function
    return async (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];

            if (!token) {
                console.log("Auth: No token provided after Bearer.");
                return res.status(401).json({ message: 'Unauthorized: Access token is missing or invalid' });
            }

            try {
                // 1. Verify the token using Supabase client
                const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser(token);

                if (authError) {
                    console.error("Auth Error:", authError.message);
                    if (authError.message === 'invalid JWT' || authError.message.includes('expired')) {
                        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
                    }
                    return res.status(401).json({ message: 'Unauthorized: Token validation failed' });
                }

                if (supabaseUser) {
                    // 2. Fetch the corresponding application user from our database
                    const appUser = await storage.getUserByAuthId(supabaseUser.id);

                    if (appUser) {
                        // 3. Sanitize and attach the application user object to req.user
                        const sanitizedUser: AppUser = {
                            ...appUser,
                            // Provide default empty strings for potentially null string fields
                            lastName: appUser.lastName ?? '',
                            phoneNumber: appUser.phoneNumber ?? '',
                            // bio can remain null if the schema allows it
                            bio: appUser.bio ?? null,
                        };
                        req.user = sanitizedUser;
                        req.supabaseUser = supabaseUser; // Optionally keep Supabase user info
                        // req.supabase = supabase; // Optionally attach client
                        console.log(`Auth: App User ${sanitizedUser.id} (Auth ID: ${supabaseUser.id}) authenticated.`);
                        next(); // Proceed
                    } else {
                        // Supabase user exists, but no corresponding user in our DB
                        console.warn(`Auth Warning: Valid token for Supabase user ${supabaseUser.id}, but no matching application user found.`);
                        // Return 403 Forbidden as the token is valid but the user isn't fully set up in the app
                        return res.status(403).json({ message: 'Forbidden: User profile not found or linked.' });
                    }
                } else {
                    console.log("Auth: Token valid but no Supabase user found.");
                    return res.status(401).json({ message: 'Unauthorized: User not found for token' });
                }
            } catch (err) {
                console.error("Auth Middleware Catch Error:", err);
                return res.status(500).json({ message: 'Internal Server Error during authentication' });
            }
        } else {
            console.log("Auth: No Authorization header found or not Bearer.");
            return res.status(401).json({ message: 'Unauthorized: Authorization header missing or malformed' });
        }
    };
};
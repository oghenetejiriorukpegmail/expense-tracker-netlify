/**
 * Unified Authentication Service
 * 
 * This service provides a unified interface for authentication, abstracting away
 * the underlying authentication providers (Clerk and Firebase).
 * 
 * It handles:
 * - User authentication
 * - User profile synchronization
 * - Session management
 * - Authentication middleware
 */

import { Request, Response, NextFunction } from 'express';
import { auth as firebaseAuth } from 'firebase-admin';
import { IStorage } from '../storage/storage.interface';
import type { PublicUser } from '../../shared/schema';

// Define the request with user property
export interface AuthenticatedRequest extends Request {
  user?: PublicUser;
  userId?: string;
  authProvider?: 'firebase';
}

// Auth provider configuration
interface AuthConfig {
  primaryProvider: 'firebase';
  firebaseServiceAccount?: any;
  storage: IStorage;
}

export class UnifiedAuth {
  private firebaseAuth: any;
  private storage: IStorage;
  private primaryProvider: 'firebase';

  constructor(config: AuthConfig) {
    this.primaryProvider = config.primaryProvider;
    this.storage = config.storage;

    // Initialize Firebase if configured
    if (config.firebaseServiceAccount) {
      this.firebaseAuth = firebaseAuth();
      console.log('Firebase authentication initialized');
    }

    if (!this.firebaseAuth) {
      throw new Error('Firebase authentication must be configured');
    }
  }

  /**
   * Authentication middleware that works with both Clerk and Firebase
   */
  public authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const authHeader = req.headers.authorization;

    try {
      // No auth header, check for session
      if (!authHeader) {
        // Check for session-based authentication
        if (req.session && (req.session as any).userId) {
          const userId = (req.session as any).userId;
          const user = await this.storage.getUserByFirebaseId(userId);
          if (user) {
            authReq.user = user;
            authReq.userId = userId;
            authReq.authProvider = 'firebase';
            return next();
          }
        }
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Use Firebase authentication
      if (this.firebaseAuth) {
        try {
          return this.tryFirebaseAuth(authReq, authHeader, next, res);
        } catch (firebaseError) {
          return res.status(401).json({ error: 'Invalid authentication token' });
        }
      }

      // If we get here, authentication failed
      return res.status(401).json({ error: 'Authentication failed' });
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(500).json({ error: 'Internal server error during authentication' });
    }
  };

  /**
   * Helper method to try Firebase authentication
   */
  private tryFirebaseAuth = async (authReq: AuthenticatedRequest, authHeader: string, next: NextFunction, res: Response) => {
    const token = authHeader.replace('Bearer ', '');
    const decodedToken = await this.firebaseAuth.verifyIdToken(token);
    if (decodedToken) {
      const firebaseUid = decodedToken.uid;
      // Find user by email since we don't store Firebase UIDs directly
      const email = decodedToken.email;
      if (!email) {
        return res.status(401).json({ error: 'Firebase user has no email' });
      }
      
      const user = await this.storage.getUserByEmail(email);
      if (user) {
        // PublicUser is Omit<User, 'password'>, so we need to exclude password
        const { password, ...publicUser } = user;
        authReq.user = publicUser as PublicUser;
        authReq.userId = firebaseUid;
        authReq.authProvider = 'firebase';
        return next();
      }
    }
    throw new Error('Firebase authentication failed');
  };


  /**
   * Synchronize a user from Firebase to the database
   */
  public async syncFirebaseUser(firebaseUid: string, userData: { email: string, displayName?: string }): Promise<PublicUser> {
    try {
      if (!userData.email) {
        throw new Error('Email is required for Firebase user synchronization');
      }
      
      // Check if user already exists by email
      const user = await this.storage.getUserByEmail(userData.email);
      
      if (user) {
        // Update existing user if needed
        let firstName = user.firstName;
        let lastName = user.lastName;
        
        // Parse display name if provided
        if (userData.displayName) {
          const nameParts = userData.displayName.split(' ');
          if (nameParts.length > 1) {
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ');
          } else {
            firstName = userData.displayName || '';
          }
        }
        
        const needsUpdate = (
          (firstName && firstName !== user.firstName) ||
          (lastName && lastName !== user.lastName)
        );
        
        if (needsUpdate) {
          const updatedUser = await this.storage.updateUserProfile(user.id, {
            firstName: firstName || user.firstName,
            lastName: lastName || user.lastName
          });
          
          if (!updatedUser) {
            throw new Error(`Failed to update user with ID ${user.id}`);
          }
          
          // User is already a PublicUser type
          return updatedUser;
        }
        
        // User is already a PublicUser type
        return user;
      } else {
        // Create a new user for Firebase
        let firstName = '';
        let lastName = '';
        
        if (userData.displayName) {
          const nameParts = userData.displayName.split(' ');
          if (nameParts.length > 1) {
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ');
          } else {
            firstName = userData.displayName || '';
          }
        }
        
        // Create new user with Firebase ID
        const newUser = await this.storage.createUserWithFirebaseId(
          firebaseUid,
          userData.email,
          firstName,
          lastName
        );
        
        if (!newUser) {
          throw new Error('Failed to create new user');
        }
        
        return newUser;
      }
    } catch (error) {
      console.error('Error syncing Firebase user:', error);
      throw error;
    }
  }

  /**
   * Create a session for a user
   */
  public createSession(req: Request, userId: string): void {
    (req.session as any).userId = userId;
  }

  /**
   * Destroy a user's session
   */
  public destroySession(req: Request): void {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
    });
  }
}

// Export a factory function to create the auth service
export function createUnifiedAuth(config: AuthConfig): UnifiedAuth {
  return new UnifiedAuth(config);
}
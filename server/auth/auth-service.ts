/**
 * Authentication Service
 * 
 * This service provides a unified authentication interface that abstracts away
 * the underlying authentication providers (Clerk and Firebase).
 * 
 * It handles:
 * - User authentication
 * - User registration
 * - Session management
 * - Token validation
 * - User profile synchronization
 */

import { createClient } from '@supabase/supabase-js';
import { initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { Request, Response, NextFunction } from 'express';
import { AppError, AuthenticationError } from '../util/error-handler';

// Authentication provider types
export type AuthProvider = 'firebase' | 'supabase';

// User profile interface
export interface UserProfile {
  id: string;
  email: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  displayName?: string | undefined;
  photoUrl?: string | undefined;
  phoneNumber?: string | undefined;
  emailVerified: boolean;
  metadata: Record<string, any>;
  provider: AuthProvider;
  providerUserId: string;
}

// Authentication configuration
export interface AuthConfig {
  defaultProvider: AuthProvider;
  providers: {
    firebase?: {
      projectId: string;
      clientEmail: string;
      privateKey: string;
      databaseURL?: string | undefined;
    } | undefined;
    supabase?: {
      url: string;
      serviceKey: string;
    } | undefined;
  };
  jwtSecret: string;
  jwtExpiresIn: string;
}

// Authentication service class
export class AuthService {
  private static instance: AuthService;
  private config: AuthConfig;
  private firebaseApp: App | null = null;
  private firebaseAuth: Auth | null = null;
  private supabaseClient: ReturnType<typeof createClient> | null = null;
  
  // Private constructor for singleton pattern
  private constructor(config: AuthConfig) {
    this.config = config;
    this.initializeProviders();
  }
  
  // Initialize authentication providers
  private initializeProviders() {
    // Initialize Firebase if configured
    if (this.config.providers.firebase) {
      try {
        const { projectId, clientEmail, privateKey, databaseURL } = this.config.providers.firebase;
        
        this.firebaseApp = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
          databaseURL: databaseURL || undefined,
        } as any, 'expense-tracker-app');
        
        this.firebaseAuth = getAuth(this.firebaseApp);
        console.log('Firebase authentication initialized');
      } catch (error) {
        console.error('Failed to initialize Firebase:', error);
      }
    }
    
    // Initialize Supabase if configured
    if (this.config.providers.supabase) {
      try {
        const { url, serviceKey } = this.config.providers.supabase;
        this.supabaseClient = createClient(url, serviceKey);
        console.log('Supabase client initialized');
      } catch (error) {
        console.error('Failed to initialize Supabase client:', error);
      }
    }
  }
  
  // Get singleton instance
  public static getInstance(config?: AuthConfig): AuthService {
    if (!AuthService.instance) {
      if (!config) {
        throw new Error('Authentication configuration is required for initialization');
      }
      AuthService.instance = new AuthService(config);
    }
    return AuthService.instance;
  }
  
  // Verify token from any provider
  public async verifyToken(token: string, provider?: AuthProvider): Promise<UserProfile> {
    const authProvider = provider || this.config.defaultProvider;
    
    try {
      switch (authProvider) {
        case 'firebase':
          return await this.verifyFirebaseToken(token);
        case 'supabase':
          return await this.verifySupabaseToken(token);
        default:
          throw new AuthenticationError(`Unsupported authentication provider: ${authProvider}`);
      }
    } catch (error) {
      console.error(`Token verification failed for provider ${authProvider}:`, error);
      throw new AuthenticationError('Invalid or expired authentication token');
    }
  }
  
  // Verify Firebase token
  private async verifyFirebaseToken(token: string): Promise<UserProfile> {
    if (!this.firebaseAuth) {
      throw new Error('Firebase authentication is not initialized');
    }
    
    try {
      const decodedToken = await this.firebaseAuth.verifyIdToken(token);
      const userRecord = await this.firebaseAuth.getUser(decodedToken.uid);
      
      return {
        id: userRecord.uid,
        email: userRecord.email || '',
        firstName: userRecord.displayName?.split(' ')[0],
        lastName: userRecord.displayName?.split(' ').slice(1).join(' '),
        displayName: userRecord.displayName,
        photoUrl: userRecord.photoURL,
        phoneNumber: userRecord.phoneNumber,
        emailVerified: userRecord.emailVerified,
        metadata: userRecord.customClaims || {},
        provider: 'firebase',
        providerUserId: userRecord.uid
      };
    } catch (error) {
      console.error('Firebase token verification failed:', error);
      throw new AuthenticationError('Invalid or expired Firebase token');
    }
  }
  
  // Verify Supabase token
  private async verifySupabaseToken(token: string): Promise<UserProfile> {
    if (!this.supabaseClient) {
      throw new Error('Supabase client is not initialized');
    }
    
    try {
      const { data, error } = await this.supabaseClient.auth.getUser(token);
      
      if (error || !data.user) {
        throw new Error(error?.message || 'User not found');
      }
      
      return {
        id: data.user.id,
        email: data.user.email || '',
        emailVerified: data.user.email_confirmed_at !== null,
        metadata: data.user.user_metadata || {},
        provider: 'supabase',
        providerUserId: data.user.id
      };
    } catch (error) {
      console.error('Supabase token verification failed:', error);
      throw new AuthenticationError('Invalid or expired Supabase token');
    }
  }
  
  // Middleware for authenticating requests
  public authMiddleware(provider?: AuthProvider) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          throw new AuthenticationError('Authorization header is missing or invalid');
        }
        
        const token = authHeader.split(' ')[1];
        const user = await this.verifyToken(token, provider || undefined);
        
        // Attach user to request object
        (req as any).user = user;
        (req as any).userId = user.id;
        
        next();
      } catch (error) {
        next(error);
      }
    };
  }
  
  // Synchronize user profile across providers
  public async syncUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
    try {
      // Sync with Firebase if configured
      if (this.firebaseAuth && profile.provider !== 'firebase') {
        try {
          await this.firebaseAuth.updateUser(userId, {
            displayName: profile.displayName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
            photoURL: profile.photoUrl,
            phoneNumber: profile.phoneNumber,
            email: profile.email,
          });
        } catch (error) {
          console.error('Failed to sync user profile with Firebase:', error);
        }
      }
      
      // Sync with Supabase if configured
      if (this.supabaseClient && profile.provider !== 'supabase') {
        try {
          await this.supabaseClient.from('users').upsert({
            id: userId,
            email: profile.email,
            first_name: profile.firstName,
            last_name: profile.lastName,
            phone_number: profile.phoneNumber,
            provider: profile.provider,
            provider_user_id: profile.providerUserId,
            updated_at: new Date().toISOString()
          });
        } catch (error) {
          console.error('Failed to sync user profile with Supabase:', error);
        }
      }
      
    } catch (error) {
      console.error('Failed to sync user profile:', error);
      throw new Error(`Failed to sync user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Create a new user
  public async createUser(userData: Partial<UserProfile>, password?: string): Promise<UserProfile> {
    try {
      switch (this.config.defaultProvider) {
        case 'firebase':
          return await this.createFirebaseUser(userData, password);
        case 'supabase':
          return await this.createSupabaseUser(userData, password);
        default:
          throw new Error(`Unsupported authentication provider: ${this.config.defaultProvider}`);
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Create a Firebase user
  private async createFirebaseUser(userData: Partial<UserProfile>, password?: string): Promise<UserProfile> {
    if (!this.firebaseAuth) {
      throw new Error('Firebase authentication is not initialized');
    }
    
    if (!userData.email || !password) {
      throw new Error('Email and password are required for Firebase user creation');
    }
    
    try {
      const userRecord = await this.firebaseAuth.createUser({
        email: userData.email,
        password,
        displayName: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        photoURL: userData.photoUrl,
        phoneNumber: userData.phoneNumber,
        emailVerified: false
      });
      
      const user: UserProfile = {
        id: userRecord.uid,
        email: userRecord.email || '',
        firstName: userData.firstName,
        lastName: userData.lastName,
        displayName: userRecord.displayName,
        photoUrl: userRecord.photoURL,
        phoneNumber: userRecord.phoneNumber,
        emailVerified: userRecord.emailVerified,
        metadata: userRecord.customClaims || {},
        provider: 'firebase',
        providerUserId: userRecord.uid
      };
      
      // Sync user with other providers
      await this.syncUserProfile(user.id, user);
      
      return user;
    } catch (error) {
      console.error('Failed to create Firebase user:', error);
      throw new Error(`Failed to create Firebase user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Create a Supabase user
  private async createSupabaseUser(userData: Partial<UserProfile>, password?: string): Promise<UserProfile> {
    if (!this.supabaseClient) {
      throw new Error('Supabase client is not initialized');
    }
    
    if (!userData.email || !password) {
      throw new Error('Email and password are required for Supabase user creation');
    }
    
    try {
      const { data, error } = await this.supabaseClient.auth.signUp({
        email: userData.email,
        password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone_number: userData.phoneNumber,
            display_name: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
            photo_url: userData.photoUrl
          }
        }
      });
      
      if (error || !data.user) {
        throw new Error(error?.message || 'Failed to create Supabase user');
      }
      
      const user: UserProfile = {
        id: data.user.id,
        email: data.user.email || '',
        firstName: userData.firstName,
        lastName: userData.lastName,
        displayName: userData.displayName,
        photoUrl: userData.photoUrl,
        phoneNumber: userData.phoneNumber,
        emailVerified: false,
        metadata: data.user.user_metadata || {},
        provider: 'supabase',
        providerUserId: data.user.id
      };
      
      // Sync user with other providers
      await this.syncUserProfile(user.id, user);
      
      return user;
    } catch (error) {
      console.error('Failed to create Supabase user:', error);
      throw new Error(`Failed to create Supabase user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Get user by ID
  public async getUserById(userId: string, provider?: AuthProvider): Promise<UserProfile | null> {
    const authProvider = provider || this.config.defaultProvider;
    
    try {
      switch (authProvider) {
        case 'firebase':
          return await this.getFirebaseUserById(userId);
        case 'supabase':
          return await this.getSupabaseUserById(userId);
        default:
          throw new Error(`Unsupported authentication provider: ${authProvider}`);
      }
    } catch (error) {
      console.error(`Failed to get user by ID from ${authProvider}:`, error);
      return null;
    }
  }
  
  // Get Firebase user by ID
  private async getFirebaseUserById(userId: string): Promise<UserProfile | null> {
    if (!this.firebaseAuth) {
      throw new Error('Firebase authentication is not initialized');
    }
    
    try {
      const userRecord = await this.firebaseAuth.getUser(userId);
      
      return {
        id: userRecord.uid,
        email: userRecord.email || '',
        firstName: userRecord.displayName?.split(' ')[0],
        lastName: userRecord.displayName?.split(' ').slice(1).join(' '),
        displayName: userRecord.displayName,
        photoUrl: userRecord.photoURL,
        phoneNumber: userRecord.phoneNumber,
        emailVerified: userRecord.emailVerified,
        metadata: userRecord.customClaims || {},
        provider: 'firebase',
        providerUserId: userRecord.uid
      };
    } catch (error) {
      console.error('Failed to get Firebase user by ID:', error);
      return null;
    }
  }
  
  // Get Supabase user by ID
  private async getSupabaseUserById(userId: string): Promise<UserProfile | null> {
    if (!this.supabaseClient) {
      throw new Error('Supabase client is not initialized');
    }
    
    try {
      const { data, error } = await this.supabaseClient
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error || !data) {
        throw new Error(error?.message || 'User not found');
      }
      
      return {
        id: data.id,
        email: data.email || '',
        firstName: data.first_name,
        lastName: data.last_name,
        displayName: data.display_name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
        photoUrl: data.photo_url,
        phoneNumber: data.phone_number,
        emailVerified: data.email_verified || false,
        metadata: data.metadata || {},
        provider: data.provider || 'supabase',
        providerUserId: data.provider_user_id || data.id
      };
    } catch (error) {
      console.error('Failed to get Supabase user by ID:', error);
      return null;
    }
  }
  
}

// Helper function to create auth service from environment variables
export function createAuthServiceFromEnv(): AuthService {
  const config: AuthConfig = {
    defaultProvider: (process.env.DEFAULT_AUTH_PROVIDER as AuthProvider) || 'firebase',
    providers: {
      firebase: process.env.FIREBASE_PROJECT_ID ? {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
        privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
        databaseURL: process.env.FIREBASE_DATABASE_URL
      } : undefined,
      supabase: process.env.SUPABASE_URL ? {
        url: process.env.SUPABASE_URL,
        serviceKey: process.env.SUPABASE_SERVICE_KEY || ''
      } : undefined
    },
    jwtSecret: process.env.JWT_SECRET || 'default-secret-key-for-development-only',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d'
  };
  
  return AuthService.getInstance(config);
}

// Export default instance
export const authService = createAuthServiceFromEnv();
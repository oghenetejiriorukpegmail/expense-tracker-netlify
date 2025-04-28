import type { inferAsyncReturnType } from '@trpc/server';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import type { User } from '../../types/user';
import type { IStorage } from './storage.interface';

interface ContextConfig {
  user?: User;
  storage: IStorage;
}

export async function createContext(
  opts?: FetchCreateContextFnOptions,
): Promise<Context> {
  // Get user from session/token
  const user = opts?.req ? await getUserFromRequest(opts.req) : undefined;
  
  // Get storage instance
  const storage = await getStorageInstance();

  return {
    user,
    storage,
  };
}

export type Context = ContextConfig;

// Helper function to get user from request
async function getUserFromRequest(req: Request): Promise<User | undefined> {
  // Get token from Authorization header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return undefined;
  }

  const token = authHeader.slice(7);
  
  try {
    // Verify and decode token
    const user = await verifyToken(token);
    return user;
  } catch (error) {
    console.error('Failed to verify token:', error);
    return undefined;
  }
}

// Helper function to verify JWT token
async function verifyToken(token: string): Promise<User | undefined> {
  // Implement token verification logic
  // This should match your authentication setup
  return undefined;
}

// Helper function to get storage instance
async function getStorageInstance(): Promise<IStorage> {
  // Implement storage initialization logic
  // This should match your storage setup
  throw new Error('Storage initialization not implemented');
}
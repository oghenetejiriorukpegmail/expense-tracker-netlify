import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../shared/schema.js';
import type { User, PublicUser, InsertUser } from "@shared/schema";
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// User methods extracted from SupabaseStorage
export async function getUserById(db: PostgresJsDatabase<typeof schema>, id: number): Promise<User | undefined> {
  const result = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  return result[0];
}

export async function getUserByUsername(db: PostgresJsDatabase<typeof schema>, username: string): Promise<User | undefined> {
  const result = await db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
  return result[0];
}

export async function getUserByClerkId(db: PostgresJsDatabase<typeof schema>, clerkUserId: string): Promise<PublicUser | undefined> {
  const result = await db.select({
    id: schema.users.id,
    authUserId: schema.users.authUserId,
    username: schema.users.username,
    email: schema.users.email,
    firstName: schema.users.firstName,
    lastName: schema.users.lastName,
    phoneNumber: schema.users.phoneNumber,
    bio: schema.users.bio,
    createdAt: schema.users.createdAt,
  }).from(schema.users).where(eq(schema.users.authUserId, clerkUserId)).limit(1);

  const userFromDb = result[0];
  if (!userFromDb) {
    return undefined;
  }

  const user: PublicUser = {
    id: userFromDb.id,
    authUserId: userFromDb.authUserId,
    username: userFromDb.username ?? null,
    email: userFromDb.email ?? null,
    firstName: userFromDb.firstName ?? null,
    lastName: userFromDb.lastName ?? null,
    phoneNumber: userFromDb.phoneNumber ?? null,
    bio: userFromDb.bio ?? null,
    createdAt: userFromDb.createdAt,
  };
  return user;
}

export async function getUserByEmail(db: PostgresJsDatabase<typeof schema>, email: string): Promise<User | undefined> {
  const result = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  return result[0];
}

export async function updateUserProfile(db: PostgresJsDatabase<typeof schema>, userId: number, profileData: { firstName: string; lastName?: string | null; phoneNumber?: string | null; email: string; bio?: string | null }): Promise<User | undefined> {
  const updateData: Partial<typeof schema.users.$inferInsert> = {};
  if (profileData.firstName !== undefined) updateData.firstName = profileData.firstName;
  if (profileData.lastName !== undefined) updateData.lastName = profileData.lastName ?? '';
  if (profileData.phoneNumber !== undefined) updateData.phoneNumber = profileData.phoneNumber ?? '';
  if (profileData.email !== undefined) updateData.email = profileData.email;
  if (profileData.bio !== undefined) updateData.bio = profileData.bio ?? null;

  const result = await db.update(schema.users)
    .set(updateData)
    .where(eq(schema.users.id, userId))
    .returning();

  if (result.length === 0) {
    return undefined;
  }
  return result[0];
}

// Create a new user with Clerk ID
export async function createUserWithClerkId(db: PostgresJsDatabase<typeof schema>, clerkUserId: string, email: string = '', firstName: string = '', lastName: string = ''): Promise<PublicUser> {
  // Generate a random username based on the email or a UUID
  const username = email ? email.split('@')[0] + '-' + Math.floor(Math.random() * 10000) : 'user-' + uuidv4().substring(0, 8);
  
  // Create a random password (not used with Clerk auth, but required by schema)
  const password = uuidv4();
  
  const userData = {
    username,
    password,
    email: email || `${username}@example.com`, // Fallback email if none provided
    firstName: firstName || '',
    lastName: lastName || '',
    phoneNumber: '',
    authUserId: clerkUserId,
  };
  
  // DIAGNOSTIC LOG: Log the user data being inserted
  console.log("DIAGNOSTIC - User creation data:", {
    attemptedColumns: Object.keys(userData),
    passwordIncluded: userData.hasOwnProperty('password'),
    clerkUserId,
    username,
    email: userData.email
  });
  
  try {
    const result = await db.insert(schema.users)
      .values(userData)
      .returning();
    
    if (!result.length) {
      throw new Error('Failed to create user');
    }
    
    const user = result[0];
    
    // Return public user without password
    const { password: _, ...publicUser } = user;
    return publicUser as PublicUser;
  } catch (error: any) {
    // DIAGNOSTIC LOG: Enhanced error logging
    console.error("DIAGNOSTIC - User creation error details:", {
      error: error?.toString?.() || 'Unknown error',
      errorObject: JSON.stringify(error, Object.getOwnPropertyNames(error || {})),
      query: error?.query || 'Query not available',
      params: error?.params || 'Params not available',
      code: error?.code || 'Code not available'
    });
    throw error;
  }
}
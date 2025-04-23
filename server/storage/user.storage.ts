import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '@shared/schema';
import type { User, PublicUser, InsertUser } from "@shared/schema";
import { eq } from 'drizzle-orm';

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
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../shared/schema.js';
import type { MileageLog, InsertMileageLog } from "@shared/schema";
import { eq, and, desc, gte, lte, asc } from 'drizzle-orm';

// Mileage Log methods extracted from SupabaseStorage
export async function getMileageLogById(db: PostgresJsDatabase<typeof schema>, id: number): Promise<MileageLog | undefined> {
  const result = await db.select().from(schema.mileageLogs).where(eq(schema.mileageLogs.id, id)).limit(1);
  return result[0];
}

export async function getMileageLogsByUserId(db: PostgresJsDatabase<typeof schema>, userId: number, options?: { tripId?: number; startDate?: string; endDate?: string; limit?: number; offset?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<MileageLog[]> {
  const conditions = [eq(schema.mileageLogs.userId, userId)];

  if (options?.tripId) {
    conditions.push(eq(schema.mileageLogs.tripId, options.tripId));
  }
  if (options?.startDate) {
    conditions.push(gte(schema.mileageLogs.tripDate, new Date(options.startDate)));
  }
  if (options?.endDate) {
    conditions.push(lte(schema.mileageLogs.tripDate, new Date(options.endDate)));
  }

  // Determine sorting
  const sortBy = options?.sortBy || 'tripDate';
  const sortOrderFunc = options?.sortOrder === 'asc' ? asc : desc;
  const sortColumn = schema.mileageLogs[sortBy as keyof typeof schema.mileageLogs.$inferSelect] ?? schema.mileageLogs.tripDate;

  // Build the query dynamically
  let queryBuilder = db.select().from(schema.mileageLogs).where(and(...conditions));

  // Apply limit and offset before orderBy
  if (options?.limit !== undefined) {
      queryBuilder = queryBuilder.limit(options.limit);
  }
  if (options?.offset !== undefined) {
      queryBuilder = queryBuilder.offset(options.offset);
  }

  // Apply orderBy and execute
  const finalQuery = queryBuilder.orderBy(sortOrderFunc(sortColumn));

  return await finalQuery;
}


export async function createMileageLog(db: PostgresJsDatabase<typeof schema>, logData: InsertMileageLog & { userId: number; calculatedDistance: number; startImageUrl?: string | null; endImageUrl?: string | null }): Promise<MileageLog> {
  if (logData.startOdometer === undefined || logData.endOdometer === undefined || logData.tripDate === undefined || logData.entryMethod === undefined) {
      throw new Error("Missing required fields for mileage log creation.");
  }

  const dataToInsert = {
      ...logData,
      startOdometer: String(logData.startOdometer),
      endOdometer: String(logData.endOdometer),
      calculatedDistance: String(logData.calculatedDistance),
      tripId: logData.tripId ?? null,
      purpose: logData.purpose ?? null,
      startImageUrl: logData.startImageUrl ?? null,
      endImageUrl: logData.endImageUrl ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
  };

  const result = await db.insert(schema.mileageLogs).values(dataToInsert).returning();
  return result[0];
}

export async function updateMileageLog(db: PostgresJsDatabase<typeof schema>, id: number, logData: Partial<InsertMileageLog & { calculatedDistance?: number; startImageUrl?: string | null; endImageUrl?: string | null }>): Promise<MileageLog> {
  const dataToUpdate: Partial<typeof schema.mileageLogs.$inferInsert> = {};

  if (logData.tripId !== undefined) dataToUpdate.tripId = logData.tripId ?? null;
  if (logData.tripDate !== undefined) dataToUpdate.tripDate = logData.tripDate;
  if (logData.startOdometer !== undefined) dataToUpdate.startOdometer = String(logData.startOdometer);
  if (logData.endOdometer !== undefined) dataToUpdate.endOdometer = String(logData.endOdometer);
  if (logData.calculatedDistance !== undefined) dataToUpdate.calculatedDistance = String(logData.calculatedDistance);
  if (logData.purpose !== undefined) dataToUpdate.purpose = logData.purpose ?? null;
  if (logData.startImageUrl !== undefined) dataToUpdate.startImageUrl = logData.startImageUrl ?? null;
  if (logData.endImageUrl !== undefined) dataToUpdate.endImageUrl = logData.endImageUrl ?? null;
  if (logData.entryMethod !== undefined) dataToUpdate.entryMethod = logData.entryMethod;

  dataToUpdate.updatedAt = new Date();

  const result = await db.update(schema.mileageLogs)
    .set(dataToUpdate)
    .where(eq(schema.mileageLogs.id, id))
    .returning();

  if (result.length === 0) {
    throw new Error(`Mileage log with ID ${id} not found`);
  }
  return result[0];
}

export async function deleteMileageLog(db: PostgresJsDatabase<typeof schema>, id: number): Promise<void> {
  const result = await db.delete(schema.mileageLogs).where(eq(schema.mileageLogs.id, id)).returning({ id: schema.mileageLogs.id });
  if (result.length === 0) {
    console.warn(`Attempted to delete non-existent mileage log with ID ${id}`);
  }
}
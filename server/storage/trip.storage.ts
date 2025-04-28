import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../shared/schema.js';
import type { Trip, InsertTrip } from "../../shared/schema.js";
import { safeEq, safeAnd, safeDesc, safeLte, safeGte } from '../../shared/drizzle-types';

// Trip methods extracted from SupabaseStorage
export async function getTrip(db: PostgresJsDatabase<typeof schema>, id: number): Promise<Trip | undefined> {
  const result = await db.select().from(schema.trips).where(safeEq(schema.trips.id, id)).limit(1);
  return result[0];
}

export async function getTripsByUserId(
  db: PostgresJsDatabase<typeof schema>,
  userId: number,
  options?: {
    startDate?: Date,
    endDate?: Date,
    status?: string
  }
): Promise<Trip[]> {
  // Start with a base query
  let query = db.select().from(schema.trips);
  
  // Build conditions array
  const conditions: any[] = [safeEq(schema.trips.userId, userId)];
  
  // Add date range filtering if provided
  if (options?.startDate && options?.endDate) {
    // Filter trips that have any overlap with the selected date range
    conditions.push(safeLte(schema.trips.startDate, options.endDate));
    conditions.push(safeGte(schema.trips.endDate, options.startDate));
  }
  
  // Add status filtering if provided
  if (options?.status) {
    // Make sure status is a valid enum value
    const tripStatus = options.status as "Planned" | "InProgress" | "Completed" | "Cancelled";
    conditions.push(safeEq(schema.trips.status, tripStatus));
  }
  
  // Apply all conditions with a single and() call
  return query
    .where(safeAnd(...conditions))
    .orderBy(safeDesc(schema.trips.createdAt));
}

export async function createTrip(db: PostgresJsDatabase<typeof schema>, tripData: InsertTrip & { userId: number }): Promise<Trip> {
   console.log("[TRIP_STORAGE] Creating trip with data:", tripData);
   
   if (!tripData.name) {
      console.error("[TRIP_STORAGE] Trip creation failed: Trip name is required");
      throw new Error("Trip name is required");
   }
   
   console.log("[TRIP_STORAGE] Database instance type:", typeof db);
   console.log("[TRIP_STORAGE] Database has insert method:", typeof db.insert === 'function');
   
   const dataToInsert = {
      description: '',
      ...tripData,
      createdAt: new Date(),
      updatedAt: new Date(),
   };
   console.log("[TRIP_STORAGE] Prepared data to insert:", dataToInsert);
   
   try {
     const result = await db.insert(schema.trips).values(dataToInsert).returning();
     console.log("[TRIP_STORAGE] Trip created successfully:", result[0]);
     return result[0];
   } catch (error) {
     console.error("[TRIP_STORAGE] Error inserting trip into database:", error);
     if (error instanceof Error) {
       console.error("[TRIP_STORAGE] Error stack:", error.stack);
     }
     throw error;
   }
}

export async function updateTrip(db: PostgresJsDatabase<typeof schema>, id: number, tripData: Partial<InsertTrip>): Promise<Trip> {
   const dataToUpdate = {
       ...tripData,
       updatedAt: new Date()
   };
   const result = await db.update(schema.trips)
     .set(dataToUpdate)
     .where(safeEq(schema.trips.id, id))
     .returning();
   if (result.length === 0) {
      throw new Error(`Trip with ID ${id} not found`);
   }
   return result[0];
}

export async function deleteTrip(db: PostgresJsDatabase<typeof schema>, id: number): Promise<void> {
  await db.transaction(async (tx) => {
      const trip = await tx.select({ name: schema.trips.name, userId: schema.trips.userId })
                           .from(schema.trips)
                           .where(safeEq(schema.trips.id, id))
                           .limit(1);

      if (!trip[0]) {
          throw new Error(`Trip with ID ${id} not found`);
      }
      // Delete associated expenses first using the internal user ID
      await tx.delete(schema.expenses).where(safeAnd(safeEq(schema.expenses.userId, trip[0].userId), safeEq(schema.expenses.tripName, trip[0].name)));
      // Now delete the trip
      await tx.delete(schema.trips).where(safeEq(schema.trips.id, id));
  });
}
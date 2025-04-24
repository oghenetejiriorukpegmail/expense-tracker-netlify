import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../shared/schema.js';
import type { Trip, InsertTrip } from "../../shared/schema.js";
import { eq, and, desc } from 'drizzle-orm';

// Trip methods extracted from SupabaseStorage
export async function getTrip(db: PostgresJsDatabase<typeof schema>, id: number): Promise<Trip | undefined> {
  const result = await db.select().from(schema.trips).where(eq(schema.trips.id, id)).limit(1);
  return result[0];
}

export async function getTripsByUserId(db: PostgresJsDatabase<typeof schema>, userId: number): Promise<Trip[]> {
  return db.select().from(schema.trips).where(eq(schema.trips.userId, userId)).orderBy(desc(schema.trips.createdAt));
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
     .where(eq(schema.trips.id, id))
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
                           .where(eq(schema.trips.id, id))
                           .limit(1);

      if (!trip[0]) {
          throw new Error(`Trip with ID ${id} not found`);
      }
      // Delete associated expenses first using the internal user ID
      await tx.delete(schema.expenses).where(and(eq(schema.expenses.userId, trip[0].userId), eq(schema.expenses.tripName, trip[0].name)));
      // Now delete the trip
      await tx.delete(schema.trips).where(eq(schema.trips.id, id));
  });
}
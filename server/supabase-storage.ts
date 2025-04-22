import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as schema from '@shared/schema';
import type { User, PublicUser, InsertUser, Trip, InsertTrip, Expense, InsertExpense, MileageLog, InsertMileageLog, BackgroundTask, InsertBackgroundTask } from "@shared/schema"; // Added PublicUser, MileageLog, BackgroundTask types
import { eq, and, desc, gte, lte, asc } from 'drizzle-orm'; // Added gte, lte, asc
import session from "express-session";
import connectPgSimple from 'connect-pg-simple'; // Import connect-pg-simple
import { createClient, SupabaseClient } from '@supabase/supabase-js'; // Import Supabase client

import { IStorage } from './storage'; // Import the interface

// Get Supabase connection string and storage details from environment variables
const databaseUrl = process.env.DATABASE_URL;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Use Service Key for server-side operations
const defaultBucketName = process.env.SUPABASE_BUCKET_NAME || 'receipts'; // Default bucket name

if (!databaseUrl) {
  console.error("FATAL ERROR: DATABASE_URL environment variable is not set.");
  process.exit(1);
}
if (!supabaseUrl) {
  console.error("FATAL ERROR: SUPABASE_URL environment variable is not set.");
  process.exit(1);
}
if (!supabaseServiceKey) {
  console.error("FATAL ERROR: SUPABASE_SERVICE_KEY environment variable is not set.");
  process.exit(1);
}

export class SupabaseStorage implements IStorage {
  private db: PostgresJsDatabase<typeof schema>; // Drizzle instance for Postgres
  private client: postgres.Sql; // Raw postgres client instance
  private supabase: SupabaseClient; // Supabase client instance
  public sessionStore!: session.Store; // Use definite assignment assertion

  // Private constructor to enforce initialization via async method
  private constructor() {
    // Initialize the postgres client
    this.client = postgres(databaseUrl!, { max: 1 });
    // Initialize Drizzle with the postgres client
    this.db = drizzle(this.client, { schema, logger: false });
    // Initialize Supabase client
    this.supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    console.log(`Supabase client initialized for URL: ${supabaseUrl}`);
  }

  // Public async initialization method
  public static async initialize(): Promise<SupabaseStorage> {
    const instance = new SupabaseStorage();

    // --- BEGIN DATABASE CONNECTIVITY TEST ---
    console.log("Testing database connection...");
    try {
      // Use the raw client for a simple query
      await instance.client`SELECT 1`; // Corrected syntax
      console.log("Successfully connected to Supabase database.");
    } catch (error) {
      console.error("FATAL ERROR: Failed to connect to Supabase database during startup.");
      console.error("Error details:", error);
      process.exit(1); // Exit the process on connection failure
    }
    // --- END CONNECTIVITY TEST ---

    // // Run migrations using the Drizzle instance
    // console.log("Running database migrations against Supabase...");
    // try {
    //     // Use the migrate function from drizzle-orm/postgres-js/migrator
    //     await migrate(instance.db, { migrationsFolder: './migrations' });
    //     console.log("Supabase migrations complete.");
    // } catch (error) {
    //     console.error("Error running Supabase migrations:", error);
    //     // Decide if you want to throw or handle this error
    //     // For initial setup, throwing might be appropriate if migrations fail
    //     throw error;
    // }

    // Initialize PostgreSQL session store
    const PgStore = connectPgSimple(session);
    instance.sessionStore = new PgStore({
        conString: databaseUrl, // Use the database connection string from env
        createTableIfMissing: false, // Explicitly disable table/schema creation
    });
    console.log("PostgreSQL session store initialized.");

    // Close the initial migration client connection if it's no longer needed
    // Drizzle might keep its own connection pool based on the client passed
    // await instance.client.end(); // Consider if needed or if Drizzle manages the connection lifecycle

    return instance;
  }

  // --- Supabase Storage methods ---
  async uploadFile(filePath: string, fileBuffer: Buffer, contentType: string, bucketName: string = defaultBucketName): Promise<{ path: string }> {
    const { data, error } = await this.supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: contentType,
        upsert: true, // Overwrite if file exists
      });

    if (error) {
      console.error(`Supabase upload error for ${filePath} in bucket ${bucketName}:`, error);
      throw new Error(`Failed to upload file to Supabase Storage: ${error.message}`);
    }
    if (!data) {
        throw new Error(`Supabase upload failed for ${filePath}, no data returned.`);
    }
    console.log(`Successfully uploaded ${filePath} to Supabase bucket ${bucketName}. Path: ${data.path}`);
    // Return the path (key) of the uploaded object
    return { path: data.path };
  }

  async deleteFile(filePath: string, bucketName: string = defaultBucketName): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      // Log error but don't necessarily throw, deletion failure might not be critical
      console.warn(`Supabase delete error for ${filePath} in bucket ${bucketName}:`, error);
      // Optionally re-throw if deletion is critical: throw new Error(`Failed to delete file from Supabase Storage: ${error.message}`);
    } else {
        console.log(`Successfully deleted ${filePath} from Supabase bucket ${bucketName}.`);
    }
  }

  async getSignedUrl(filePath: string, expiresIn: number = 60 * 5, bucketName: string = defaultBucketName): Promise<{ signedUrl: string }> {
    const { data, error } = await this.supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error(`Supabase getSignedUrl error for ${filePath} in bucket ${bucketName}:`, error);
      throw new Error(`Failed to get signed URL from Supabase Storage: ${error.message}`);
    }
    if (!data?.signedUrl) {
        throw new Error(`Supabase getSignedUrl failed for ${filePath}, no signedUrl returned.`);
    }
    console.log(`Generated signed URL for ${filePath} in bucket ${bucketName}.`);
    return { signedUrl: data.signedUrl };
  }

  async downloadFile(filePath: string, bucketName: string = defaultBucketName): Promise<Buffer> {
      const { data, error } = await this.supabase.storage
          .from(bucketName)
          .download(filePath);

      if (error) {
          console.error(`Supabase download error for ${filePath} in bucket ${bucketName}:`, error);
          throw new Error(`Failed to download file from Supabase Storage: ${error.message}`);
      }
      if (!data) {
          throw new Error(`Supabase download failed for ${filePath}, no data returned.`);
      }

      // Convert Blob to Buffer
      const arrayBuffer = await data.arrayBuffer();
      return Buffer.from(arrayBuffer);
  }

  // --- User methods ---
  async getUserById(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // PostgreSQL is case-sensitive by default, use ilike for case-insensitive search if needed
    // const result = await this.db.select().from(schema.users).where(ilike(schema.users.username, username)).limit(1);
    const result = await this.db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
    return result[0];
  }

  async createUser(userData: InsertUser): Promise<User> {
    const result = await this.db.insert(schema.users).values(userData).returning();
    return result[0];
  }

  async getUserByAuthId(authUserId: string): Promise<PublicUser | undefined> {
    // Explicitly select columns, excluding 'password'
    const result = await this.db.select({
      id: schema.users.id,
      authUserId: schema.users.authUserId,
      username: schema.users.username,
      email: schema.users.email,
      firstName: schema.users.firstName,
      lastName: schema.users.lastName,
      phoneNumber: schema.users.phoneNumber,
      bio: schema.users.bio,
      createdAt: schema.users.createdAt,
      // updatedAt removed as it's not in the schema
    }).from(schema.users).where(eq(schema.users.authUserId, authUserId)).limit(1);
    const userFromDb = result[0];
    if (!userFromDb) {
      return undefined; // Return undefined if user not found, matching Promise<User | undefined>
    }

    // Explicitly map to the User type structure
    // Assuming nullable fields default to null based on the User type definition
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
      // updatedAt removed as it's not in the schema
      // Note: 'password' is intentionally excluded as it wasn't selected
    };

    return user;
  }


  async getUserByEmail(email: string): Promise<User | undefined> {
    // Use eq for case-sensitive comparison (default in PG)
    const result = await this.db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    return result[0];
  }

  async updateUserProfile(userId: number, profileData: { firstName: string; lastName?: string | null; phoneNumber?: string | null; email: string; bio?: string | null }): Promise<User | undefined> {
    const updateData: Partial<typeof schema.users.$inferInsert> = {};
    if (profileData.firstName !== undefined) updateData.firstName = profileData.firstName;
    // Use empty string '' as fallback, matching the schema's NOT NULL default('') constraint
    if (profileData.lastName !== undefined) updateData.lastName = profileData.lastName ?? '';
    if (profileData.phoneNumber !== undefined) updateData.phoneNumber = profileData.phoneNumber ?? '';
    if (profileData.email !== undefined) updateData.email = profileData.email;
    if (profileData.bio !== undefined) updateData.bio = profileData.bio ?? null; // bio allows null

    // Removed updatedAt as it's not in the users schema

    const result = await this.db.update(schema.users)
      .set(updateData)
      .where(eq(schema.users.id, userId))
      .returning();

    if (result.length === 0) {
      return undefined; // User not found
    }
    return result[0];
  }

  async updateUserPassword(userId: number, newPasswordHash: string): Promise<void> {
    const result = await this.db.update(schema.users)
      // Removed updatedAt as it's not in the users schema
      .set({ password: newPasswordHash })
      .where(eq(schema.users.id, userId))
      .returning({ id: schema.users.id });

    if (result.length === 0) {
      throw new Error(`User with ID ${userId} not found for password update.`);
    }
  }

  // --- Trip methods ---
  async getTrip(id: number): Promise<Trip | undefined> {
    const result = await this.db.select().from(schema.trips).where(eq(schema.trips.id, id)).limit(1);
    return result[0];
  }

  async getTripsByUserId(userId: number): Promise<Trip[]> {
    return this.db.select().from(schema.trips).where(eq(schema.trips.userId, userId)).orderBy(desc(schema.trips.createdAt));
  }

  async createTrip(tripData: InsertTrip & { userId: number }): Promise<Trip> {
     if (!tripData.name) {
        throw new Error("Trip name is required");
     }
     const dataToInsert = {
        description: '', // Provide default if schema requires it and it's missing
        ...tripData,
        // Ensure createdAt and updatedAt are set if not handled by DB defaults
        createdAt: new Date(),
        updatedAt: new Date(),
     };
    const result = await this.db.insert(schema.trips).values(dataToInsert).returning();
    return result[0];
  }

  async updateTrip(id: number, tripData: Partial<InsertTrip>): Promise<Trip> {
     const dataToUpdate = {
         ...tripData,
         updatedAt: new Date() // Update the timestamp
     };
     const result = await this.db.update(schema.trips)
       .set(dataToUpdate)
       .where(eq(schema.trips.id, id))
       .returning();
     if (result.length === 0) {
        throw new Error(`Trip with ID ${id} not found`);
     }
     return result[0];
  }

  async deleteTrip(id: number): Promise<void> {
    // Use transaction for atomicity
    await this.db.transaction(async (tx) => {
        const trip = await tx.select({ name: schema.trips.name, userId: schema.trips.userId })
                             .from(schema.trips)
                             .where(eq(schema.trips.id, id))
                             .limit(1);

        if (!trip[0]) {
            throw new Error(`Trip with ID ${id} not found`);
        }
        // Delete associated expenses first
        // Note: Ensure tripName comparison is correct (case sensitivity)
        await tx.delete(schema.expenses).where(and(eq(schema.expenses.userId, trip[0].userId), eq(schema.expenses.tripName, trip[0].name)));
        // Now delete the trip
        await tx.delete(schema.trips).where(eq(schema.trips.id, id));
    });
  }

  // --- Expense methods ---
  async getExpense(id: number): Promise<Expense | undefined> {
     const result = await this.db.select().from(schema.expenses).where(eq(schema.expenses.id, id)).limit(1);
     return result[0]; // Drizzle maps numeric types correctly for PG
  }

  async getExpensesByUserId(userId: number): Promise<Expense[]> {
    const results = await this.db.select().from(schema.expenses)
                                .where(eq(schema.expenses.userId, userId))
                                .orderBy(desc(schema.expenses.date)); // Order by date descending
    return results;
  }

  async getExpensesByTripName(userId: number, tripName: string): Promise<Expense[]> {
    // Note: Ensure tripName comparison is correct (case sensitivity)
    const results = await this.db.select().from(schema.expenses)
      .where(and(eq(schema.expenses.userId, userId), eq(schema.expenses.tripName, tripName)))
      .orderBy(desc(schema.expenses.date));
     return results;
  }

  async createExpense(expenseData: InsertExpense & { userId: number, receiptPath?: string | null }): Promise<Expense> {
     const requiredFields: (keyof InsertExpense)[] = ['date', 'type', 'vendor', 'location', 'cost', 'tripName'];
     for (const field of requiredFields) {
        if (expenseData[field] === undefined || expenseData[field] === null) {
            if (field === 'cost' && typeof expenseData.cost !== 'number') {
                 throw new Error(`Missing or invalid required expense field: ${field}`);
            } else if (field !== 'cost') {
                 throw new Error(`Missing required expense field: ${field}`);
            }
        }
     }

     const dataToInsert = {
        ...expenseData,
        cost: expenseData.cost, // Should be number
        receiptPath: expenseData.receiptPath || null,
        comments: expenseData.comments ?? null, // Use null for PG
        // Ensure createdAt and updatedAt are set if not handled by DB defaults
        createdAt: new Date(),
        updatedAt: new Date(),
     };
     const result = await this.db.insert(schema.expenses).values(dataToInsert).returning();
     return result[0];
  }

  async updateExpense(id: number, expenseData: Partial<InsertExpense & { receiptPath?: string | null }>): Promise<Expense> {
    const dataToUpdate: Partial<typeof schema.expenses.$inferInsert> = {};

    for (const key in expenseData) {
        if (Object.prototype.hasOwnProperty.call(expenseData, key)) {
            const typedKey = key as keyof typeof expenseData;
            // Handle potential null values appropriately for PG
            if (expenseData[typedKey] === undefined) {
                 (dataToUpdate as any)[typedKey] = null;
            } else {
                 (dataToUpdate as any)[typedKey] = expenseData[typedKey];
            }
        }
    }
     // Add updatedAt timestamp
     dataToUpdate.updatedAt = new Date();


    const result = await this.db.update(schema.expenses)
      .set(dataToUpdate)
      .where(eq(schema.expenses.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error(`Expense with ID ${id} not found`);
    }
    return result[0];
  }

  async deleteExpense(id: number): Promise<void> {
    const result = await this.db.delete(schema.expenses).where(eq(schema.expenses.id, id)).returning({ id: schema.expenses.id });
     if (result.length === 0) {
        console.warn(`Attempted to delete non-existent expense with ID ${id}`);
        // Decide if this should throw an error or just warn
     }
 } // <-- Added missing closing brace for deleteExpense

 async updateExpenseStatus(id: number, status: string, error?: string | null): Promise<Expense | undefined> {
    const updateData: Partial<typeof schema.expenses.$inferInsert> = {
        status: status,
        ocrError: error === undefined ? null : error, // Set to null if error is undefined
        updatedAt: new Date()
    };
    const result = await this.db.update(schema.expenses)
      .set(updateData)
      .where(eq(schema.expenses.id, id))
      .returning();
    return result[0];
  } // <-- Added missing closing brace for updateExpenseStatus

  async createExpensesBatch(expensesData: (InsertExpense & { userId: number })[]): Promise<{ successCount: number; errors: { index: number; error: any; data: any }[] }> {
    if (!expensesData || expensesData.length === 0) {
      return { successCount: 0, errors: [] };
    }

    const preparedData = expensesData.map(expense => ({
      ...expense,
      cost: expense.cost, // Ensure cost is number
      receiptPath: expense.receiptPath || null,
      comments: expense.comments ?? null,
      // Removed non-existent fields: items, subtotal, tax, paymentMethod
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    let successCount = 0;
    const errors: { index: number; error: any; data: any }[] = [];

    try {
      // Drizzle's insert().values() handles batch insertion efficiently
      const result = await this.db.insert(schema.expenses).values(preparedData).returning({ id: schema.expenses.id });
      successCount = result.length;
      console.log(`Successfully batch inserted ${successCount} expenses.`);

      // Basic check: If the number of returned IDs doesn't match the input count,
      // something unexpected happened (though Drizzle usually throws an error earlier).
      if (successCount !== preparedData.length) {
          console.warn(`Batch insert discrepancy: Expected ${preparedData.length}, inserted ${successCount}. This might indicate partial failure or unexpected DB behavior.`);
          // Note: Identifying *which* rows failed in a single batch insert is complex
          // without more sophisticated error handling or inserting row-by-row on conflict/error.
          // For simplicity, we'll report the discrepancy.
          // A more robust solution might involve returning the IDs and letting the caller reconcile.
      }

    } catch (error) {
      console.error("Error during batch expense insertion:", error);
      // If the entire batch fails, we report 0 successes and the main error.
      // It's hard to know which specific rows caused the failure without more complex logic.
      errors.push({ index: -1, error: error, data: 'Entire batch failed' });
      successCount = 0; // Ensure count is 0 on full batch failure
    }

    // Note: This simple implementation doesn't pinpoint individual row failures within a batch
    // if the DB/Drizzle doesn't throw an error for the whole batch.
    // For more granular error reporting, consider inserting in smaller chunks or one by one,
    // or using DB-specific features like ON CONFLICT DO NOTHING/UPDATE if applicable.
    return { successCount, errors };
  }

  // --- Mileage Log methods ---
  async getMileageLogById(id: number): Promise<MileageLog | undefined> {
    const result = await this.db.select().from(schema.mileageLogs).where(eq(schema.mileageLogs.id, id)).limit(1);
    return result[0];
  }

  async getMileageLogsByUserId(userId: number, options?: { tripId?: number; startDate?: string; endDate?: string; limit?: number; offset?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<MileageLog[]> {
    const conditions = [eq(schema.mileageLogs.userId, userId)];

    if (options?.tripId) {
      conditions.push(eq(schema.mileageLogs.tripId, options.tripId));
    }
    if (options?.startDate) {
      // Assuming startDate is 'YYYY-MM-DD', adjust if needed
      conditions.push(gte(schema.mileageLogs.tripDate, new Date(options.startDate)));
    }
    if (options?.endDate) {
      // Assuming endDate is 'YYYY-MM-DD', adjust if needed
      conditions.push(lte(schema.mileageLogs.tripDate, new Date(options.endDate)));
    }

    // Start building the query
    // Start building the query
    // Start building the query
    // Start building the query
    // Start building the query
    let query = this.db.select().from(schema.mileageLogs).where(and(...conditions));

    // Determine sorting
    const sortBy = options?.sortBy || 'tripDate';
    const sortOrderFunc = options?.sortOrder === 'asc' ? asc : desc;
    const sortColumn = Object.prototype.hasOwnProperty.call(schema.mileageLogs, sortBy)
        ? schema.mileageLogs[sortBy as keyof typeof schema.mileageLogs.$inferSelect]
        : schema.mileageLogs.tripDate;

    // Apply sorting
    // Ensure the type is maintained by assigning back to a variable of the correct builder type
    let sortedQuery = query.orderBy(sortOrderFunc(sortColumn));

    // Apply limit conditionally
    if (options?.limit !== undefined) {
        sortedQuery = sortedQuery.limit(options.limit);
    }

    // Apply offset conditionally
    if (options?.offset !== undefined) {
        sortedQuery = sortedQuery.offset(options.offset);
    }

    // Execute and return the final query
    return await sortedQuery;
  }

  async createMileageLog(logData: InsertMileageLog & { userId: number; calculatedDistance: number; startImageUrl?: string | null; endImageUrl?: string | null }): Promise<MileageLog> {
    // Ensure required fields are present (handled by Zod schema mostly, but good practice)
    if (logData.startOdometer === undefined || logData.endOdometer === undefined || logData.tripDate === undefined || logData.entryMethod === undefined) {
        throw new Error("Missing required fields for mileage log creation.");
    }

    // Reconstruct the dataToInsert part here
    const dataToInsert = {
        ...logData,
        // Ensure numeric values are passed correctly
        startOdometer: String(logData.startOdometer), // Drizzle expects string for numeric PG type
        endOdometer: String(logData.endOdometer),
        calculatedDistance: String(logData.calculatedDistance),
        tripId: logData.tripId ?? null, // Use null if tripId is not provided
        purpose: logData.purpose ?? null,
        startImageUrl: logData.startImageUrl ?? null,
        endImageUrl: logData.endImageUrl ?? null,
        createdAt: new Date(), // Set creation timestamp
        updatedAt: new Date(), // Set initial update timestamp
    };

    const result = await this.db.insert(schema.mileageLogs).values(dataToInsert).returning();
    return result[0];
  }

  async updateMileageLog(id: number, logData: Partial<InsertMileageLog & { calculatedDistance?: number; startImageUrl?: string | null; endImageUrl?: string | null }>): Promise<MileageLog> {
    const dataToUpdate: Partial<typeof schema.mileageLogs.$inferInsert> = {};

    // Map provided fields, converting numbers to strings for numeric columns
    if (logData.tripId !== undefined) dataToUpdate.tripId = logData.tripId ?? null;
    if (logData.tripDate !== undefined) dataToUpdate.tripDate = logData.tripDate;
    if (logData.startOdometer !== undefined) dataToUpdate.startOdometer = String(logData.startOdometer);
    if (logData.endOdometer !== undefined) dataToUpdate.endOdometer = String(logData.endOdometer);
    if (logData.calculatedDistance !== undefined) dataToUpdate.calculatedDistance = String(logData.calculatedDistance);
    if (logData.purpose !== undefined) dataToUpdate.purpose = logData.purpose ?? null;
    if (logData.startImageUrl !== undefined) dataToUpdate.startImageUrl = logData.startImageUrl ?? null;
    if (logData.endImageUrl !== undefined) dataToUpdate.endImageUrl = logData.endImageUrl ?? null;
    if (logData.entryMethod !== undefined) dataToUpdate.entryMethod = logData.entryMethod;

    dataToUpdate.updatedAt = new Date(); // Always update the timestamp

    const result = await this.db.update(schema.mileageLogs)
      .set(dataToUpdate)
      .where(eq(schema.mileageLogs.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error(`Mileage log with ID ${id} not found`);
    }
    return result[0];
  }

  async deleteMileageLog(id: number): Promise<void> {
    // Note: Associated images should be deleted from storage (e.g., Supabase Storage Bucket)
    // This logic would typically be in the route handler *before* calling this method.
    const result = await this.db.delete(schema.mileageLogs).where(eq(schema.mileageLogs.id, id)).returning({ id: schema.mileageLogs.id });
    if (result.length === 0) {
      console.warn(`Attempted to delete non-existent mileage log with ID ${id}`);
    }
  }

  // --- Background Task methods --- (Moved inside the class)
  async createBackgroundTask(taskData: InsertBackgroundTask): Promise<BackgroundTask> {
    const result = await this.db.insert(schema.backgroundTasks).values(taskData).returning();
    return result[0];
  }

  async updateBackgroundTaskStatus(id: number, status: typeof schema.taskStatusEnum.enumValues[number], result?: any, error?: string | null): Promise<BackgroundTask | undefined> {
    const updateData: Partial<typeof schema.backgroundTasks.$inferInsert> = {
        status: status,
        result: result ? JSON.stringify(result) : null, // Store result as JSON string
        error: error === undefined ? null : error,
        updatedAt: new Date()
    };
    const res = await this.db.update(schema.backgroundTasks)
      .set(updateData)
      .where(eq(schema.backgroundTasks.id, id))
      .returning();
    return res[0];
  }

  async getBackgroundTaskById(id: number): Promise<BackgroundTask | undefined> {
    const result = await this.db.select().from(schema.backgroundTasks).where(eq(schema.backgroundTasks.id, id)).limit(1);
    return result[0];
  }

  async getBackgroundTasksByUserId(userId: number): Promise<BackgroundTask[]> {
    return this.db.select().from(schema.backgroundTasks)
               .where(eq(schema.backgroundTasks.userId, userId))
               .orderBy(desc(schema.backgroundTasks.createdAt));
  }

} // This is now the correct final closing brace for the class
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as schema from '@shared/schema';
import type { User, PublicUser, InsertUser, Trip, InsertTrip, Expense, InsertExpense, MileageLog, InsertMileageLog, BackgroundTask, InsertBackgroundTask } from "@shared/schema";
import { eq, and, desc, gte, lte, asc } from 'drizzle-orm';
import session from "express-session";
import connectPgSimple from 'connect-pg-simple';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { IStorage } from './storage';

// Get Supabase connection string and storage details from environment variables
const databaseUrl = process.env.DATABASE_URL;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const defaultBucketName = process.env.SUPABASE_BUCKET_NAME || 'receipts';

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
  private db: PostgresJsDatabase<typeof schema>;
  private client: postgres.Sql;
  private supabase: SupabaseClient;
  public sessionStore!: session.Store;

  private constructor() {
    this.client = postgres(databaseUrl!, { max: 1 });
    this.db = drizzle(this.client, { schema, logger: false });
    this.supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    console.log(`Supabase client initialized for URL: ${supabaseUrl}`);
  }

  public static async initialize(): Promise<SupabaseStorage> {
    const instance = new SupabaseStorage();
    console.log("Testing database connection...");
    try {
      await instance.client`SELECT 1`;
      console.log("Successfully connected to Supabase database.");
    } catch (error) {
      console.error("FATAL ERROR: Failed to connect to Supabase database during startup.");
      console.error("Error details:", error);
      process.exit(1);
    }

    // Migrations should be handled separately, e.g., via Supabase CLI or dashboard

    const PgStore = connectPgSimple(session);
    instance.sessionStore = new PgStore({
        conString: databaseUrl,
        createTableIfMissing: false,
    });
    console.log("PostgreSQL session store initialized.");

    return instance;
  }

  // --- Supabase Storage methods ---
  async uploadFile(filePath: string, fileBuffer: Buffer, contentType: string, bucketName: string = defaultBucketName): Promise<{ path: string }> {
    const { data, error } = await this.supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: contentType,
        upsert: true,
      });

    if (error) {
      console.error(`Supabase upload error for ${filePath} in bucket ${bucketName}:`, error);
      throw new Error(`Failed to upload file to Supabase Storage: ${error.message}`);
    }
    if (!data) {
        throw new Error(`Supabase upload failed for ${filePath}, no data returned.`);
    }
    console.log(`Successfully uploaded ${filePath} to Supabase bucket ${bucketName}. Path: ${data.path}`);
    return { path: data.path };
  }

  async deleteFile(filePath: string, bucketName: string = defaultBucketName): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.warn(`Supabase delete error for ${filePath} in bucket ${bucketName}:`, error);
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

      const arrayBuffer = await data.arrayBuffer();
      return Buffer.from(arrayBuffer);
  }

  // --- User methods ---
  async getUserById(id: number): Promise<User | undefined> {
    // This method uses the internal integer ID
    const result = await this.db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
    return result[0];
  }

  // Removed createUser - User creation should be handled by Clerk signup and potentially a webhook/trigger

  // New method to get user by Clerk User ID (string) from auth_user_id column
  async getUserByClerkId(clerkUserId: string): Promise<PublicUser | undefined> {
    // Assuming auth_user_id column exists and stores the Clerk User ID string
    // Also assuming auth_user_id column type is TEXT or VARCHAR to store Clerk ID
    const result = await this.db.select({
      id: schema.users.id,
      authUserId: schema.users.authUserId, // Keep this if it stores Clerk ID
      username: schema.users.username,
      email: schema.users.email,
      firstName: schema.users.firstName,
      lastName: schema.users.lastName,
      phoneNumber: schema.users.phoneNumber,
      bio: schema.users.bio,
      createdAt: schema.users.createdAt,
      // updatedAt removed as it's not in the schema
    }).from(schema.users).where(eq(schema.users.authUserId, clerkUserId)).limit(1); // Query by authUserId

    const userFromDb = result[0];
    if (!userFromDb) {
      return undefined; // Return undefined if user not found
    }

    // Explicitly map to the PublicUser type structure
    const user: PublicUser = {
      id: userFromDb.id,
      authUserId: userFromDb.authUserId, // Keep this if it stores Clerk ID
      username: userFromDb.username ?? null,
      email: userFromDb.email ?? null,
      firstName: userFromDb.firstName ?? null,
      lastName: userFromDb.lastName ?? null,
      phoneNumber: userFromDb.phoneNumber ?? null,
      bio: userFromDb.bio ?? null,
      createdAt: userFromDb.createdAt,
      // updatedAt removed
      // 'password' is intentionally excluded
    };

    return user;
  }

  // Removed getUserByAuthId (replaced by getUserByClerkId)

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    return result[0];
  }

  async updateUserProfile(userId: number, profileData: { firstName: string; lastName?: string | null; phoneNumber?: string | null; email: string; bio?: string | null }): Promise<User | undefined> {
    // This method uses the internal integer ID
    const updateData: Partial<typeof schema.users.$inferInsert> = {};
    if (profileData.firstName !== undefined) updateData.firstName = profileData.firstName;
    if (profileData.lastName !== undefined) updateData.lastName = profileData.lastName ?? '';
    if (profileData.phoneNumber !== undefined) updateData.phoneNumber = profileData.phoneNumber ?? '';
    if (profileData.email !== undefined) updateData.email = profileData.email; // Consider if email should be updated here or via Clerk
    if (profileData.bio !== undefined) updateData.bio = profileData.bio ?? null;

    const result = await this.db.update(schema.users)
      .set(updateData)
      .where(eq(schema.users.id, userId)) // Use internal ID for update
      .returning();

    if (result.length === 0) {
      return undefined;
    }
    return result[0];
  }

  // Removed updateUserPassword - Password management handled by Clerk

  // --- Trip methods ---
  async getTrip(id: number): Promise<Trip | undefined> {
    const result = await this.db.select().from(schema.trips).where(eq(schema.trips.id, id)).limit(1);
    return result[0];
  }

  async getTripsByUserId(userId: number): Promise<Trip[]> {
    // This method uses the internal integer ID
    return this.db.select().from(schema.trips).where(eq(schema.trips.userId, userId)).orderBy(desc(schema.trips.createdAt));
  }

  async createTrip(tripData: InsertTrip & { userId: number }): Promise<Trip> {
     // This method uses the internal integer ID
     if (!tripData.name) {
        throw new Error("Trip name is required");
     }
     const dataToInsert = {
        description: '',
        ...tripData,
        createdAt: new Date(),
        updatedAt: new Date(),
     };
    const result = await this.db.insert(schema.trips).values(dataToInsert).returning();
    return result[0];
  }

  async updateTrip(id: number, tripData: Partial<InsertTrip>): Promise<Trip> {
     const dataToUpdate = {
         ...tripData,
         updatedAt: new Date()
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
    // This method uses the internal integer ID for the trip
    await this.db.transaction(async (tx) => {
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

  // --- Expense methods ---
  async getExpense(id: number): Promise<Expense | undefined> {
     const result = await this.db.select().from(schema.expenses).where(eq(schema.expenses.id, id)).limit(1);
     return result[0];
  }

  async getExpensesByUserId(userId: number): Promise<Expense[]> {
    // This method uses the internal integer ID
    const results = await this.db.select().from(schema.expenses)
                                .where(eq(schema.expenses.userId, userId))
                                .orderBy(desc(schema.expenses.date));
    return results;
  }

  async getExpensesByTripName(userId: number, tripName: string): Promise<Expense[]> {
    // This method uses the internal integer ID
    const results = await this.db.select().from(schema.expenses)
      .where(and(eq(schema.expenses.userId, userId), eq(schema.expenses.tripName, tripName)))
      .orderBy(desc(schema.expenses.date));
     return results;
  }

  async createExpense(expenseData: InsertExpense & { userId: number, receiptPath?: string | null }): Promise<Expense> {
     // This method uses the internal integer ID
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
        cost: expenseData.cost,
        receiptPath: expenseData.receiptPath || null,
        comments: expenseData.comments ?? null,
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
            if (expenseData[typedKey] === undefined) {
                 (dataToUpdate as any)[typedKey] = null;
            } else {
                 (dataToUpdate as any)[typedKey] = expenseData[typedKey];
            }
        }
    }
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
     }
 }

 async updateExpenseStatus(id: number, status: string, error?: string | null): Promise<Expense | undefined> {
    const updateData: Partial<typeof schema.expenses.$inferInsert> = {
        status: status,
        ocrError: error === undefined ? null : error,
        updatedAt: new Date()
    };
    const result = await this.db.update(schema.expenses)
      .set(updateData)
      .where(eq(schema.expenses.id, id))
      .returning();
    return result[0];
  }

  async createExpensesBatch(expensesData: (InsertExpense & { userId: number })[]): Promise<{ successCount: number; errors: { index: number; error: any; data: any }[] }> {
    // This method uses the internal integer ID
    if (!expensesData || expensesData.length === 0) {
      return { successCount: 0, errors: [] };
    }

    const preparedData = expensesData.map(expense => ({
      ...expense,
      cost: expense.cost,
      receiptPath: expense.receiptPath || null,
      comments: expense.comments ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    let successCount = 0;
    const errors: { index: number; error: any; data: any }[] = [];

    try {
      const result = await this.db.insert(schema.expenses).values(preparedData).returning({ id: schema.expenses.id });
      successCount = result.length;
      console.log(`Successfully batch inserted ${successCount} expenses.`);

      if (successCount !== preparedData.length) {
          console.warn(`Batch insert discrepancy: Expected ${preparedData.length}, inserted ${successCount}.`);
      }

    } catch (error) {
      console.error("Error during batch expense insertion:", error);
      errors.push({ index: -1, error: error, data: 'Entire batch failed' });
      successCount = 0;
    }

    return { successCount, errors };
  }

  // --- Mileage Log methods ---
  async getMileageLogById(id: number): Promise<MileageLog | undefined> {
    const result = await this.db.select().from(schema.mileageLogs).where(eq(schema.mileageLogs.id, id)).limit(1);
    return result[0];
  }

  async getMileageLogsByUserId(userId: number, options?: { tripId?: number; startDate?: string; endDate?: string; limit?: number; offset?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<MileageLog[]> {
    // This method uses the internal integer ID
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

    // Build the query dynamically
    let queryBuilder = this.db.select().from(schema.mileageLogs).where(and(...conditions));

    // Determine sorting
    const sortBy = options?.sortBy || 'tripDate';
    const sortOrderFunc = options?.sortOrder === 'asc' ? asc : desc;
    // Ensure sortColumn is a valid column from mileageLogs schema
    const sortColumn = schema.mileageLogs[sortBy as keyof typeof schema.mileageLogs.$inferSelect] ?? schema.mileageLogs.tripDate;

    // Apply sorting
    queryBuilder = queryBuilder.orderBy(sortOrderFunc(sortColumn));

    // Apply limit conditionally
    if (options?.limit !== undefined) {
        queryBuilder = queryBuilder.limit(options.limit);
    }

    // Apply offset conditionally
    if (options?.offset !== undefined) {
        queryBuilder = queryBuilder.offset(options.offset);
    }

    // Execute and return the final query
    return await queryBuilder;
  }


  async createMileageLog(logData: InsertMileageLog & { userId: number; calculatedDistance: number; startImageUrl?: string | null; endImageUrl?: string | null }): Promise<MileageLog> {
    // This method uses the internal integer ID
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

    const result = await this.db.insert(schema.mileageLogs).values(dataToInsert).returning();
    return result[0];
  }

  async updateMileageLog(id: number, logData: Partial<InsertMileageLog & { calculatedDistance?: number; startImageUrl?: string | null; endImageUrl?: string | null }>): Promise<MileageLog> {
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
    const result = await this.db.delete(schema.mileageLogs).where(eq(schema.mileageLogs.id, id)).returning({ id: schema.mileageLogs.id });
    if (result.length === 0) {
      console.warn(`Attempted to delete non-existent mileage log with ID ${id}`);
    }
  }

  // --- Background Task methods ---
  async createBackgroundTask(taskData: InsertBackgroundTask): Promise<BackgroundTask> {
    // This method uses the internal integer ID
    const result = await this.db.insert(schema.backgroundTasks).values(taskData).returning();
    return result[0];
  }

  async updateBackgroundTaskStatus(id: number, status: typeof schema.taskStatusEnum.enumValues[number], result?: any, error?: string | null): Promise<BackgroundTask | undefined> {
    const updateData: Partial<typeof schema.backgroundTasks.$inferInsert> = {
        status: status,
        result: result ? JSON.stringify(result) : null,
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
    // This method uses the internal integer ID
    return this.db.select().from(schema.backgroundTasks)
               .where(eq(schema.backgroundTasks.userId, userId))
               .orderBy(desc(schema.backgroundTasks.createdAt));
  }

}
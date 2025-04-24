import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';
import type { User, PublicUser, InsertUser, Trip, InsertTrip, Expense, InsertExpense, MileageLog, InsertMileageLog, BackgroundTask, InsertBackgroundTask } from "@shared/schema";
import session from "express-session";
import connectPgSimple from 'connect-pg-simple';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Import the interface only, not the entire module to avoid circular dependencies
import type { IStorage } from './storage';

// Import storage functions from separate files
import * as userStorage from './storage/user.storage';
import * as tripStorage from './storage/trip.storage';
import * as expenseStorage from './storage/expense.storage';
import * as mileageStorage from './storage/mileage.storage';
import * as taskStorage from './storage/task.storage';
import * as fileStorage from './storage/file.storage';

// Get Supabase connection string and storage details from environment variables
const databaseUrl = process.env.DATABASE_URL;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
// Removed defaultBucketName as it's handled in file.storage.ts

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
  // Removed supabase client instance as it's initialized in file.storage.ts
  public sessionStore!: session.Store;

  private constructor() {
    this.client = postgres(databaseUrl!, { max: 1 });
    this.db = drizzle(this.client, { schema, logger: false });
    // Removed Supabase client initialization here
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

    const PgStore = connectPgSimple(session);
    instance.sessionStore = new PgStore({
        conString: databaseUrl,
        createTableIfMissing: false,
    });
    console.log("PostgreSQL session store initialized.");
    console.log("Storage initialized successfully."); // Moved log here

    return instance;
  }

  // --- User methods ---
  async getUserById(id: number): Promise<User | undefined> {
    return userStorage.getUserById(this.db, id);
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    return userStorage.getUserByUsername(this.db, username);
  }
  async getUserByClerkId(clerkUserId: string): Promise<PublicUser | undefined> {
    return userStorage.getUserByClerkId(this.db, clerkUserId);
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    return userStorage.getUserByEmail(this.db, email);
  }
  async updateUserProfile(userId: number, profileData: { firstName: string; lastName?: string | null; phoneNumber?: string | null; email: string; bio?: string | null }): Promise<User | undefined> {
    return userStorage.updateUserProfile(this.db, userId, profileData);
  }
  
  async createUserWithClerkId(clerkUserId: string, email: string = '', firstName: string = '', lastName: string = ''): Promise<PublicUser> {
    return userStorage.createUserWithClerkId(this.db, clerkUserId, email, firstName, lastName);
  }

  // --- Trip methods ---
  async getTrip(id: number): Promise<Trip | undefined> {
    return tripStorage.getTrip(this.db, id);
  }
  async getTripsByUserId(userId: number): Promise<Trip[]> {
    return tripStorage.getTripsByUserId(this.db, userId);
  }
  async createTrip(tripData: InsertTrip & { userId: number }): Promise<Trip> {
    return tripStorage.createTrip(this.db, tripData);
  }
  async updateTrip(id: number, tripData: Partial<InsertTrip>): Promise<Trip> {
    return tripStorage.updateTrip(this.db, id, tripData);
  }
  async deleteTrip(id: number): Promise<void> {
    return tripStorage.deleteTrip(this.db, id);
  }

  // --- Expense methods ---
  async getExpense(id: number): Promise<Expense | undefined> {
    return expenseStorage.getExpense(this.db, id);
  }
  async getExpensesByUserId(userId: number): Promise<Expense[]> {
    return expenseStorage.getExpensesByUserId(this.db, userId);
  }
  async getExpensesByTripName(userId: number, tripName: string): Promise<Expense[]> {
    return expenseStorage.getExpensesByTripName(this.db, userId, tripName);
  }
  async createExpense(expenseData: InsertExpense & { userId: number, receiptPath?: string | null }): Promise<Expense> {
    return expenseStorage.createExpense(this.db, expenseData);
  }
  async updateExpense(id: number, expenseData: Partial<InsertExpense & { receiptPath?: string | null }>): Promise<Expense> {
    return expenseStorage.updateExpense(this.db, id, expenseData);
  }
  async deleteExpense(id: number): Promise<void> {
    return expenseStorage.deleteExpense(this.db, id);
  }
  async updateExpenseStatus(id: number, status: string, error?: string | null): Promise<Expense | undefined> {
    return expenseStorage.updateExpenseStatus(this.db, id, status, error);
  }
  async createExpensesBatch(expensesData: (InsertExpense & { userId: number })[]): Promise<{ successCount: number; errors: { index: number; error: any; data: any }[] }> {
    return expenseStorage.createExpensesBatch(this.db, expensesData);
  }

  // --- Mileage Log methods ---
  async getMileageLogById(id: number): Promise<MileageLog | undefined> {
    return mileageStorage.getMileageLogById(this.db, id);
  }
  async getMileageLogsByUserId(userId: number, options?: { tripId?: number; startDate?: string; endDate?: string; limit?: number; offset?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<MileageLog[]> {
    return mileageStorage.getMileageLogsByUserId(this.db, userId, options);
  }
  async createMileageLog(logData: InsertMileageLog & { userId: number; calculatedDistance: number; startImageUrl?: string | null; endImageUrl?: string | null }): Promise<MileageLog> {
    return mileageStorage.createMileageLog(this.db, logData);
  }
  async updateMileageLog(id: number, logData: Partial<InsertMileageLog & { calculatedDistance?: number; startImageUrl?: string | null; endImageUrl?: string | null }>): Promise<MileageLog> {
    return mileageStorage.updateMileageLog(this.db, id, logData);
  }
  async deleteMileageLog(id: number): Promise<void> {
    return mileageStorage.deleteMileageLog(this.db, id);
  }

  // --- Background Task methods ---
  async createBackgroundTask(taskData: InsertBackgroundTask): Promise<BackgroundTask> {
    return taskStorage.createBackgroundTask(this.db, taskData);
  }
  async updateBackgroundTaskStatus(id: number, status: typeof schema.taskStatusEnum.enumValues[number], result?: any, error?: string | null): Promise<BackgroundTask | undefined> {
    return taskStorage.updateBackgroundTaskStatus(this.db, id, status, result, error);
  }
  async getBackgroundTaskById(id: number): Promise<BackgroundTask | undefined> {
    return taskStorage.getBackgroundTaskById(this.db, id);
  }
  
  // Add named export for backward compatibility
  export { SupabaseStorage };
  async getBackgroundTasksByUserId(userId: number): Promise<BackgroundTask[]> {
    return taskStorage.getBackgroundTasksByUserId(this.db, userId);
  }

  // --- File Storage methods (delegated) ---
  async uploadFile(filePath: string, fileBuffer: Buffer, contentType: string, bucketName?: string): Promise<{ path: string }> {
    return fileStorage.uploadFile(filePath, fileBuffer, contentType, bucketName);
  }
  async deleteFile(filePath: string, bucketName?: string): Promise<void> {
    return fileStorage.deleteFile(filePath, bucketName);
  }
  async getSignedUrl(filePath: string, expiresIn?: number, bucketName?: string): Promise<{ signedUrl: string }> {
    return fileStorage.getSignedUrl(filePath, expiresIn, bucketName);
  }
  async downloadFile(filePath: string, bucketName?: string): Promise<Buffer> {
    return fileStorage.downloadFile(filePath, bucketName);
  }

}
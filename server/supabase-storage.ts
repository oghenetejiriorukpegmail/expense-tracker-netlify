// Use ES module imports
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema.js'; // Use .js extension for ES modules
import session from "express-session";
import connectPgSimple from 'connect-pg-simple';
import { createClient } from '@supabase/supabase-js';

// Import the interface only, not the entire module to avoid circular dependencies
import { IStorage } from './storage/storage.interface.js'; // Use .js extension for ES modules

// Import storage functions from separate files
import * as userStorage from './storage/user.storage.js'; // Use .js extension for ES modules
import * as tripStorage from './storage/trip.storage.js'; // Use .js extension for ES modules
import * as expenseStorage from './storage/expense.storage.js'; // Use .js extension for ES modules
import * as mileageStorage from './storage/mileage.storage.js'; // Use .js extension for ES modules
import * as taskStorage from './storage/task.storage.js'; // Use .js extension for ES modules
import * as fileStorage from './storage/file.storage.js'; // Use .js extension for ES modules

// Type definitions for TypeScript
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
type User = schema.User;
type PublicUser = schema.PublicUser;
type InsertUser = schema.InsertUser;
type Trip = schema.Trip;
type InsertTrip = schema.InsertTrip;
type Expense = schema.Expense;
type InsertExpense = schema.InsertExpense;
type MileageLog = schema.MileageLog;
type InsertMileageLog = schema.InsertMileageLog;
type BackgroundTask = schema.BackgroundTask;
type InsertBackgroundTask = schema.InsertBackgroundTask;


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

// Define a class that implements the storage interface
class SupabaseStorage extends IStorage {
  private db: PostgresJsDatabase;
  private client: postgres.Sql; // Use postgres.Sql type
  // Removed supabase client instance as it's initialized in file.storage.ts
  public sessionStore: any; // Add type for sessionStore

  private constructor() {
    super(); // Call the constructor of the base class (IStorage)
    console.log("[SupabaseStorage] Constructor called");
    console.log("[SupabaseStorage] Module type: ESM"); // Updated log
    this.client = postgres(databaseUrl!, { max: 1 });
    this.db = drizzle(this.client, { schema, logger: false });
    console.log("[SupabaseStorage] Database client initialized");
    // Removed Supabase client initialization here
  }

  // Revert to static initialize method
  public static async initialize(): Promise<IStorage> { // Add return type hint
    console.log("[SupabaseStorage] Static initialize method called");
    console.log("[SupabaseStorage] Class definition exists:", typeof SupabaseStorage === 'function');
    console.log("[SupabaseStorage] Class methods:", Object.getOwnPropertyNames(SupabaseStorage));
    const instance = new SupabaseStorage(); // Call private constructor
    console.log("[SupabaseStorage] Instance created successfully");
    console.log("[SupabaseStorage] Testing database connection...");
    try {
      await instance.client`SELECT 1`; // Use instance client
      console.log("[SupabaseStorage] Successfully connected to Supabase database.");
    } catch (error) {
      console.error("[SupabaseStorage] FATAL ERROR: Failed to connect to Supabase database during startup.");
      console.error("[SupabaseStorage] Error details:", error);
      throw error; // Re-throw
    }

    const PgStore = connectPgSimple(session);
    instance.sessionStore = new PgStore({ // Set session store on instance
        conString: databaseUrl,
        createTableIfMissing: false,
    });
    console.log("[SupabaseStorage] PostgreSQL session store initialized.");
    console.log("[SupabaseStorage] Storage initialized successfully.");
    return instance; // Return the initialized instance
  }

  // --- User methods ---
  async getUserById(id: number): Promise<User | undefined> { // Add type hints
    return userStorage.getUserById(this.db, id);
  }
  async getUserByUsername(username: string): Promise<User | undefined> { // Add type hints
    return userStorage.getUserByUsername(this.db, username);
  }
  async getUserByClerkId(clerkUserId: string): Promise<PublicUser | undefined> { // Changed return type to PublicUser
    return userStorage.getUserByClerkId(this.db, clerkUserId);
  }
  async getUserByEmail(email: string): Promise<User | undefined> { // Add type hints
    return userStorage.getUserByEmail(this.db, email);
  }
  async updateUserProfile(userId: number, profileData: Partial<InsertUser>): Promise<User | undefined> { // Add type hints
    return userStorage.updateUserProfile(this.db, userId, profileData);
  }
  
  async createUserWithClerkId(clerkUserId: string, email = '', firstName = '', lastName = ''): Promise<PublicUser> { // Changed return type to PublicUser
    return userStorage.createUserWithClerkId(this.db, clerkUserId, email, firstName, lastName);
  }

  // --- Trip methods ---
  async getTrip(id: number): Promise<Trip | undefined> { // Add type hints
    return tripStorage.getTrip(this.db, id);
  }
  async getTripsByUserId(userId: number): Promise<Trip[]> { // Add type hints
    return tripStorage.getTripsByUserId(this.db, userId);
  }
  async createTrip(tripData: InsertTrip & { userId: number }): Promise<Trip> { // Add type hints
    return tripStorage.createTrip(this.db, tripData);
  }
  async updateTrip(id: number, tripData: Partial<InsertTrip>): Promise<Trip | undefined> { // Add type hints
    return tripStorage.updateTrip(this.db, id, tripData);
  }
  async deleteTrip(id: number): Promise<void> { // Add type hints
    return tripStorage.deleteTrip(this.db, id);
  }

  // --- Expense methods ---
  async getExpense(id: number): Promise<Expense | undefined> { // Add type hints
    return expenseStorage.getExpense(this.db, id);
  }
  async getExpensesByUserId(userId: number): Promise<Expense[]> { // Add type hints
    return expenseStorage.getExpensesByUserId(this.db, userId);
  }
  async getExpensesByTripName(userId: number, tripName: string): Promise<Expense[]> { // Add type hints
    return expenseStorage.getExpensesByTripName(this.db, userId, tripName);
  }
  async createExpense(expenseData: InsertExpense & { userId: number, receiptPath?: string | null }): Promise<Expense> { // Add type hints
    return expenseStorage.createExpense(this.db, expenseData);
  }
  async updateExpense(id: number, expenseData: Partial<InsertExpense & { receiptPath?: string | null }>): Promise<Expense | undefined> { // Add type hints
    return expenseStorage.updateExpense(this.db, id, expenseData);
  }
  async deleteExpense(id: number): Promise<void> { // Add type hints
    return expenseStorage.deleteExpense(this.db, id);
  }
  async updateExpenseStatus(id: number, status: string, error?: string | null): Promise<Expense | undefined> { // Add type hints
    return expenseStorage.updateExpenseStatus(this.db, id, status, error);
  }
  async createExpensesBatch(expensesData: (InsertExpense & { userId: number })[]): Promise<{ successCount: number; errors: { index: number; error: any; data: any }[] }> { // Add type hints
    return expenseStorage.createExpensesBatch(this.db, expensesData);
  }

  // --- Mileage Log methods ---
  async getMileageLogById(id: number): Promise<MileageLog | undefined> { // Add type hints
    return mileageStorage.getMileageLogById(this.db, id);
  }
  async getMileageLogsByUserId(userId: number, options?: any): Promise<MileageLog[]> { // Add type hints (options type needs refinement)
    return mileageStorage.getMileageLogsByUserId(this.db, userId, options);
  }
  async createMileageLog(logData: InsertMileageLog & { userId: number }): Promise<MileageLog> { // Add type hints
    // Calculate distance from odometer readings
    const calculatedDistance = String(logData.endOdometer - logData.startOdometer);
    
    return mileageStorage.createMileageLog(this.db, {
      ...logData,
      calculatedDistance,
      startImageUrl: null,
      endImageUrl: null
    });
  }
  async updateMileageLog(id: number, logData: Partial<InsertMileageLog>): Promise<MileageLog | undefined> { // Add type hints
    return mileageStorage.updateMileageLog(this.db, id, logData);
  }
  async deleteMileageLog(id: number): Promise<void> { // Add type hints
    return mileageStorage.deleteMileageLog(this.db, id);
  }

  // --- Background Task methods ---
  async createBackgroundTask(taskData: InsertBackgroundTask): Promise<BackgroundTask> { // Add type hints
    return taskStorage.createBackgroundTask(this.db, taskData);
  }
  async updateBackgroundTaskStatus(id: number, status: "pending" | "processing" | "completed" | "failed", result?: string | null, error?: string | null): Promise<BackgroundTask | undefined> { // Fixed status type
    return taskStorage.updateBackgroundTaskStatus(this.db, id, status, result, error);
  }
  async getBackgroundTaskById(id: number): Promise<BackgroundTask | undefined> { // Add type hints
    return taskStorage.getBackgroundTaskById(this.db, id);
  }
  
  async getBackgroundTasksByUserId(userId: number): Promise<BackgroundTask[]> { // Add type hints
    return taskStorage.getBackgroundTasksByUserId(this.db, userId);
  }

  // --- File Storage methods (delegated) ---
  // Add named export for backward compatibility
  // export { SupabaseStorage }; // Moved outside class
  async uploadFile(filePath: string, fileBuffer: Buffer, contentType: string, bucketName: string = 'receipts'): Promise<{ data: any, error: any }> { // Add type hints
    const result = await fileStorage.uploadFile(filePath, fileBuffer, contentType, bucketName);
    return { data: result, error: null };
  }
  async deleteFile(filePath: string, bucketName: string = 'receipts'): Promise<{ data: any, error: any }> { // Add type hints
    await fileStorage.deleteFile(filePath, bucketName);
    return { data: true, error: null };
  }
  async getSignedUrl(filePath: string, expiresIn: number, bucketName: string = 'receipts'): Promise<{ data: any, error: any }> { // Add type hints
    const result = await fileStorage.getSignedUrl(filePath, expiresIn, bucketName);
    return { data: result, error: null };
  }
  async downloadFile(filePath: string, bucketName: string = 'receipts'): Promise<{ data: any, error: any }> { // Add type hints
    const result = await fileStorage.downloadFile(filePath, bucketName);
    return { data: result, error: null };
  }

}

// Export the class for ES module compatibility
export {
  SupabaseStorage,
  // Removed IStorage from export as it's imported from the interface file
};
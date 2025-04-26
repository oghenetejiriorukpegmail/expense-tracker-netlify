// Use CommonJS require for compatibility with Netlify functions
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const schema = require('../shared/schema');
const session = require("express-session");
const connectPgSimple = require('connect-pg-simple');
const { createClient } = require('@supabase/supabase-js');

// Import the interface only, not the entire module to avoid circular dependencies
const { IStorage } = require('./storage');

// Import storage functions from separate files
const userStorage = require('./storage/user.storage');
const tripStorage = require('./storage/trip.storage');
const expenseStorage = require('./storage/expense.storage');
const mileageStorage = require('./storage/mileage.storage');
const taskStorage = require('./storage/task.storage');
const fileStorage = require('./storage/file.storage');

// Type definitions for TypeScript
type PostgresJsDatabase = any;
type User = any;
type PublicUser = any;
type InsertUser = any;
type Trip = any;
type InsertTrip = any;
type Expense = any;
type InsertExpense = any;
type MileageLog = any;
type InsertMileageLog = any;
type BackgroundTask = any;
type InsertBackgroundTask = any;

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
class SupabaseStorage {
  private db;
  private client;
  // Removed supabase client instance as it's initialized in file.storage.ts
  public sessionStore;

  private constructor() {
    console.log("[SupabaseStorage] Constructor called");
    console.log("[SupabaseStorage] Module type:", typeof module !== 'undefined' ? 'CommonJS' : 'ESM');
    this.client = postgres(databaseUrl!, { max: 1 });
    this.db = drizzle(this.client, { schema, logger: false });
    console.log("[SupabaseStorage] Database client initialized");
    // Removed Supabase client initialization here
  }

  // Revert to static initialize method
  public static async initialize() {
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
  async getUserById(id) {
    return userStorage.getUserById(this.db, id);
  }
  async getUserByUsername(username) {
    return userStorage.getUserByUsername(this.db, username);
  }
  async getUserByClerkId(clerkUserId) {
    return userStorage.getUserByClerkId(this.db, clerkUserId);
  }
  async getUserByEmail(email) {
    return userStorage.getUserByEmail(this.db, email);
  }
  async updateUserProfile(userId, profileData) {
    return userStorage.updateUserProfile(this.db, userId, profileData);
  }
  
  async createUserWithClerkId(clerkUserId, email = '', firstName = '', lastName = '') {
    return userStorage.createUserWithClerkId(this.db, clerkUserId, email, firstName, lastName);
  }

  // --- Trip methods ---
  async getTrip(id) {
    return tripStorage.getTrip(this.db, id);
  }
  async getTripsByUserId(userId) {
    return tripStorage.getTripsByUserId(this.db, userId);
  }
  async createTrip(tripData) {
    return tripStorage.createTrip(this.db, tripData);
  }
  async updateTrip(id, tripData) {
    return tripStorage.updateTrip(this.db, id, tripData);
  }
  async deleteTrip(id) {
    return tripStorage.deleteTrip(this.db, id);
  }

  // --- Expense methods ---
  async getExpense(id) {
    return expenseStorage.getExpense(this.db, id);
  }
  async getExpensesByUserId(userId) {
    return expenseStorage.getExpensesByUserId(this.db, userId);
  }
  async getExpensesByTripName(userId, tripName) {
    return expenseStorage.getExpensesByTripName(this.db, userId, tripName);
  }
  async createExpense(expenseData) {
    return expenseStorage.createExpense(this.db, expenseData);
  }
  async updateExpense(id, expenseData) {
    return expenseStorage.updateExpense(this.db, id, expenseData);
  }
  async deleteExpense(id) {
    return expenseStorage.deleteExpense(this.db, id);
  }
  async updateExpenseStatus(id, status, error) {
    return expenseStorage.updateExpenseStatus(this.db, id, status, error);
  }
  async createExpensesBatch(expensesData) {
    return expenseStorage.createExpensesBatch(this.db, expensesData);
  }

  // --- Mileage Log methods ---
  async getMileageLogById(id) {
    return mileageStorage.getMileageLogById(this.db, id);
  }
  async getMileageLogsByUserId(userId, options) {
    return mileageStorage.getMileageLogsByUserId(this.db, userId, options);
  }
  async createMileageLog(logData) {
    return mileageStorage.createMileageLog(this.db, logData);
  }
  async updateMileageLog(id, logData) {
    return mileageStorage.updateMileageLog(this.db, id, logData);
  }
  async deleteMileageLog(id) {
    return mileageStorage.deleteMileageLog(this.db, id);
  }

  // --- Background Task methods ---
  async createBackgroundTask(taskData) {
    return taskStorage.createBackgroundTask(this.db, taskData);
  }
  async updateBackgroundTaskStatus(id, status, result, error) {
    return taskStorage.updateBackgroundTaskStatus(this.db, id, status, result, error);
  }
  async getBackgroundTaskById(id) {
    return taskStorage.getBackgroundTaskById(this.db, id);
  }
  
  async getBackgroundTasksByUserId(userId) {
    return taskStorage.getBackgroundTasksByUserId(this.db, userId);
  }

  // --- File Storage methods (delegated) ---
  // Add named export for backward compatibility
  // export { SupabaseStorage }; // Moved outside class
  async uploadFile(filePath, fileBuffer, contentType, bucketName) {
    return fileStorage.uploadFile(filePath, fileBuffer, contentType, bucketName);
  }
  async deleteFile(filePath, bucketName) {
    return fileStorage.deleteFile(filePath, bucketName);
  }
  async getSignedUrl(filePath, expiresIn, bucketName) {
    return fileStorage.getSignedUrl(filePath, expiresIn, bucketName);
  }
  async downloadFile(filePath, bucketName) {
    return fileStorage.downloadFile(filePath, bucketName);
  }

}

// Export the class for CommonJS compatibility
module.exports = {
  SupabaseStorage
};
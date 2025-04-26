// Use CommonJS require for compatibility with Netlify functions
const { users, trips, expenses } = require("../shared/schema");
const schema = require('../shared/schema'); // Import schema for enum
const session = require("express-session");

// Type definitions for TypeScript
/**
 * Storage interface for database operations
 * @interface
 */
class IStorage {
  // User methods
  async getUserById(id) { return null; }
  async getUserByUsername(username) { return null; }
  async getUserByClerkId(clerkUserId) { return null; }
  async getUserByEmail(email) { return null; }
  async createUserWithClerkId(clerkUserId, email, firstName, lastName) { return null; }
  async updateUserProfile(userId, profileData) { return null; }

  // Trip methods
  async getTrip(id) { return null; }
  async getTripsByUserId(userId) { return null; }
  async createTrip(trip) { return null; }
  async updateTrip(id, trip) { return null; }
  async deleteTrip(id) { return null; }

  // Expense methods
  async getExpense(id) { return null; }
  async getExpensesByUserId(userId) { return null; }
  async getExpensesByTripName(userId, tripName) { return null; }
  async createExpense(expense) { return null; }
  async updateExpense(id, expense) { return null; }
  async deleteExpense(id) { return null; }

  // Mileage Log methods
  async getMileageLogById(id) { return null; }
  async getMileageLogsByUserId(userId, options) { return null; }
  async createMileageLog(log) { return null; }
  async updateMileageLog(id, log) { return null; }
  async deleteMileageLog(id) { return null; }

  // Background Task methods
  async createBackgroundTask(taskData) { return null; }
  async updateBackgroundTaskStatus(id, status, result, error) { return null; }
  async getBackgroundTaskById(id) { return null; }
  async getBackgroundTasksByUserId(userId) { return null; }

  // File Storage methods
  async uploadFile(filePath, fileBuffer, contentType, bucketName) { return null; }
  async deleteFile(filePath, bucketName) { return null; }
  async getSignedUrl(filePath, expiresIn, bucketName) { return null; }
  async downloadFile(filePath, bucketName) { return null; }
}

// MemStorage class removed as it's no longer used.

// Use require for compatibility with Netlify functions
const { SupabaseStorage } = require('./supabase-storage');

// Export an async function to initialize the storage
async function initializeStorage() {
  console.log("[STORAGE] initializeStorage function called.");
  console.log("[STORAGE] Module type:", typeof module !== 'undefined' ? 'CommonJS' : 'ESM');
  console.log("[STORAGE] SupabaseStorage import:", typeof SupabaseStorage);
  
  // Check if SupabaseStorage is properly imported
  if (!SupabaseStorage) {
    console.error("[STORAGE] CRITICAL ERROR: SupabaseStorage is undefined in initializeStorage");
    throw new Error("SupabaseStorage class is undefined. Check import paths and circular dependencies.");
  }

  // Add detailed diagnostic logs
  console.log("[STORAGE] SupabaseStorage class exists:", typeof SupabaseStorage === 'function');
  console.log("[STORAGE] SupabaseStorage properties:", Object.keys(SupabaseStorage));
  console.log("[STORAGE] SupabaseStorage.initialize exists:", typeof SupabaseStorage.initialize === 'function');

  // Ensure SupabaseStorage.initialize exists before calling it
  if (typeof SupabaseStorage.initialize !== 'function') {
    console.error("[STORAGE] CRITICAL ERROR: SupabaseStorage.initialize is not a function");
    throw new Error("SupabaseStorage.initialize is not a function. Check class implementation.");
  }

  try {
    // Call the static initialize method
    // console.log("[STORAGE] Calling SupabaseStorage.initialize()..."); // Remove diagnostic log
    const storageInstance = await SupabaseStorage.initialize();
    // console.log("[STORAGE] SupabaseStorage initialization successful"); // Remove diagnostic log
    // console.log("[STORAGE] Storage instance methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(storageInstance))); // Optional: Keep if needed
    return storageInstance;
  } catch (error: any) {
    console.error("[STORAGE] FATAL ERROR: SupabaseStorage initialization failed in initializeStorage:", error);
    console.error("[STORAGE] Error stack:", error.stack);
    throw error; // Re-throw the error
  }
}

// Export for CommonJS compatibility
module.exports = {
  initializeStorage,
  IStorage: null // This is just for TypeScript interface, not used at runtime
};

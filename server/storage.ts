import { users, trips, expenses } from "@shared/schema";
import type { User, PublicUser, InsertUser, Trip, InsertTrip, Expense, InsertExpense, MileageLog, InsertMileageLog } from "@shared/schema"; // Added PublicUser
import session from "express-session";

// Define the storage interface
export interface IStorage {
  // User methods
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  // Removed getUserByAuthId
  getUserByClerkId(clerkUserId: string): Promise<PublicUser | undefined>; // Added getUserByClerkId
  getUserByEmail(email: string): Promise<User | undefined>;
  // User creation with Clerk ID
  createUserWithClerkId(clerkUserId: string, email?: string, firstName?: string, lastName?: string): Promise<PublicUser>;
  updateUserProfile(userId: number, profileData: { firstName: string; email: string; bio?: string | null; lastName?: string | null; phoneNumber?: string | null }): Promise<User | undefined>; // Added missing optional fields
  // Removed updateUserPassword (handled by Clerk)

  // Trip methods
  getTrip(id: number): Promise<Trip | undefined>;
  getTripsByUserId(userId: number): Promise<Trip[]>;
  createTrip(trip: InsertTrip & { userId: number }): Promise<Trip>;
  updateTrip(id: number, trip: Partial<InsertTrip>): Promise<Trip>;
  deleteTrip(id: number): Promise<void>;

  // Expense methods
  getExpense(id: number): Promise<Expense | undefined>;
  getExpensesByUserId(userId: number): Promise<Expense[]>;
  getExpensesByTripName(userId: number, tripName: string): Promise<Expense[]>;
  createExpense(expense: InsertExpense & { userId: number, receiptPath?: string | null }): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense & { receiptPath?: string | null }>): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;

  // Mileage Log methods
  getMileageLogById(id: number): Promise<MileageLog | undefined>;
  getMileageLogsByUserId(userId: number, options?: { tripId?: number; startDate?: string; endDate?: string; limit?: number; offset?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<MileageLog[]>;
  createMileageLog(log: InsertMileageLog & { userId: number; calculatedDistance: number; startImageUrl?: string | null; endImageUrl?: string | null }): Promise<MileageLog>;
  updateMileageLog(id: number, log: Partial<InsertMileageLog & { calculatedDistance?: number; startImageUrl?: string | null; endImageUrl?: string | null }>): Promise<MileageLog>;
  deleteMileageLog(id: number): Promise<void>;

  // Session store (might be removable if Clerk handles all session management)
  sessionStore: session.Store;
}

// MemStorage class removed as it's no longer used.

// Remove static import
// import { SupabaseStorage } from './supabase-storage';

// Export an async function to initialize the storage
export async function initializeStorage(): Promise<IStorage> {
  console.log("[STORAGE] initializeStorage function called.");

  // Dynamically import SupabaseStorage
  console.log("[STORAGE] Dynamically importing SupabaseStorage...");
  const { SupabaseStorage } = await import('./supabase-storage');
  console.log("[STORAGE] Dynamic import complete.");

  console.log("[STORAGE] SupabaseStorage after dynamic import:", SupabaseStorage);
  console.log("[STORAGE] SupabaseStorage.initialize after dynamic import:", SupabaseStorage ? SupabaseStorage.initialize : 'SupabaseStorage is null/undefined');

  // Check if SupabaseStorage is properly imported
  if (!SupabaseStorage) {
    console.error("[STORAGE] CRITICAL ERROR: SupabaseStorage is undefined after dynamic import");
    throw new Error("SupabaseStorage class is undefined. Check import paths and circular dependencies.");
  }

  console.log("[STORAGE] SupabaseStorage class exists:", typeof SupabaseStorage === 'function');
  console.log("[STORAGE] SupabaseStorage.initialize exists:", typeof SupabaseStorage.initialize === 'function');

  // Ensure SupabaseStorage.initialize exists before calling it
  if (typeof SupabaseStorage.initialize !== 'function') {
    console.error("[STORAGE] CRITICAL ERROR: SupabaseStorage.initialize is not a function after dynamic import");
    throw new Error("SupabaseStorage.initialize is not a function. Check class implementation.");
  }

  try {
    console.log("[STORAGE] Calling SupabaseStorage.initialize()...");
    const storageInstance = await SupabaseStorage.initialize();
    console.log("[STORAGE] SupabaseStorage initialization successful");
    console.log("[STORAGE] Storage instance methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(storageInstance)));
    return storageInstance;
  } catch (error: any) {
    console.error("[STORAGE] FATAL ERROR: SupabaseStorage initialization failed in initializeStorage:", error);
    console.error("[STORAGE] Error stack:", error.stack);
    throw error; // Re-throw the error
  }
}

// Remove the direct export of the promise and the getStorage helper
// export const storage = storagePromise; // Removed
// export async function getStorage() { ... } // Removed

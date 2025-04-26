// Type definitions for TypeScript
import type { User, PublicUser, InsertUser, Trip, InsertTrip, Expense, InsertExpense, MileageLog, InsertMileageLog, BackgroundTask, InsertBackgroundTask } from "../../shared/schema.js";

/**
 * Storage interface for database operations
 * @interface
 */
class IStorage {
  // User methods
  async getUserById(id: number): Promise<User | undefined> { throw new Error("Method not implemented."); }
  async getUserByUsername(username: string): Promise<User | undefined> { throw new Error("Method not implemented."); }
  async getUserByClerkId(clerkUserId: string): Promise<PublicUser | undefined> { throw new Error("Method not implemented."); }
  async getUserByEmail(email: string): Promise<User | undefined> { throw new Error("Method not implemented."); }
  async createUserWithClerkId(clerkUserId: string, email: string, firstName: string, lastName: string): Promise<PublicUser> { throw new Error("Method not implemented."); }
  async updateUserProfile(userId: number, profileData: Partial<InsertUser>): Promise<User | undefined> { throw new Error("Method not implemented."); }

  // Trip methods
  async getTrip(id: number): Promise<Trip | undefined> { throw new Error("Method not implemented."); }
  async getTripsByUserId(userId: number): Promise<Trip[]> { throw new Error("Method not implemented."); }
  async createTrip(tripData: InsertTrip & { userId: number }): Promise<Trip> { throw new Error("Method not implemented."); }
  async updateTrip(id: number, tripData: Partial<InsertTrip>): Promise<Trip | undefined> { throw new Error("Method not implemented."); }
  async deleteTrip(id: number): Promise<void> { throw new Error("Method not implemented."); }

  // Expense methods
  async getExpense(id: number): Promise<Expense | undefined> { throw new Error("Method not implemented."); }
  async getExpensesByUserId(userId: number): Promise<Expense[]> { throw new Error("Method not implemented."); }
  async getExpensesByTripName(userId: number, tripName: string): Promise<Expense[]> { throw new Error("Method not implemented."); }
  async createExpense(expenseData: InsertExpense & { userId: number, receiptPath?: string | null }): Promise<Expense> { throw new Error("Method not implemented."); }
  async updateExpense(id: number, expenseData: Partial<InsertExpense & { receiptPath?: string | null }>): Promise<Expense | undefined> { throw new Error("Method not implemented."); }
  async deleteExpense(id: number): Promise<void> { throw new Error("Method not implemented."); }
  async updateExpenseStatus(id: number, status: string, error?: string | null): Promise<Expense | undefined> { throw new Error("Method not implemented."); }
  async createExpensesBatch(expensesData: (InsertExpense & { userId: number })[]): Promise<{ successCount: number; errors: { index: number; error: any; data: any }[] }> { throw new Error("Method not implemented."); }

  // Mileage Log methods
  async getMileageLogById(id: number): Promise<MileageLog | undefined> { throw new Error("Method not implemented."); }
  async getMileageLogsByUserId(userId: number, options?: any): Promise<MileageLog[]> { throw new Error("Method not implemented."); } // options type needs refinement
  async createMileageLog(logData: InsertMileageLog & { userId: number }): Promise<MileageLog> { throw new Error("Method not implemented."); }
  async updateMileageLog(id: number, logData: Partial<InsertMileageLog>): Promise<MileageLog | undefined> { throw new Error("Method not implemented."); }
  async deleteMileageLog(id: number): Promise<void> { throw new Error("Method not implemented."); }

  // Background Task methods
  async createBackgroundTask(taskData: InsertBackgroundTask): Promise<BackgroundTask> { throw new Error("Method not implemented."); }
  async updateBackgroundTaskStatus(id: number, status: string, result?: string | null, error?: string | null): Promise<BackgroundTask | undefined> { throw new Error("Method not implemented."); }
  async getBackgroundTaskById(id: number): Promise<BackgroundTask | undefined> { throw new Error("Method not implemented."); }
  async getBackgroundTasksByUserId(userId: number): Promise<BackgroundTask[]> { throw new Error("Method not implemented."); }

  // File Storage methods
  async uploadFile(filePath: string, fileBuffer: Buffer, contentType: string, bucketName: string): Promise<{ data: any, error: any }> { throw new Error("Method not implemented."); }
  async deleteFile(filePath: string, bucketName: string): Promise<{ data: any, error: any }> { throw new Error("Method not implemented."); }
  async getSignedUrl(filePath: string, expiresIn: number, bucketName: string): Promise<{ data: any, error: any }> { throw new Error("Method not implemented."); }
  async downloadFile(filePath: string, bucketName: string): Promise<{ data: any, error: any }> { throw new Error("Method not implemented."); }
}

// Export for ES module compatibility
export {
    IStorage
};
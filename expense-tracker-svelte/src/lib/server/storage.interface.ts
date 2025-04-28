import type { User, UserProfile } from '../types/user';
import type { Trip, CreateTrip } from '../types/trip';
import type { Expense } from '../types/expense';

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | null>;
  getUserByAuthId(authUserId: string): Promise<User | null>;
  getUserProfile(id: number): Promise<UserProfile | null>;
  createUser(user: Partial<User>): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;

  // Trip operations
  getTrip(id: number): Promise<Trip | null>;
  getTripsByUserId(userId: number): Promise<Trip[]>;
  createTrip(trip: CreateTrip & { userId: number }): Promise<Trip>;
  updateTrip(id: number, trip: Partial<CreateTrip>): Promise<Trip>;
  deleteTrip(id: number): Promise<void>;
  getTripExpenses(tripId: number): Promise<Expense[]>;
  getTripSummary(tripId: number): Promise<{
    totalExpenses: number;
    expenseCount: number;
    expensesByCategory: Record<string, number>;
    dailyExpenses: Array<{ date: string; amount: number }>;
  }>;

  // Expense operations
  getExpense(id: number): Promise<Expense | null>;
  getExpensesByUserId(userId: number): Promise<Expense[]>;
  getExpensesByTripId(tripId: number): Promise<Expense[]>;
  createExpense(expense: Expense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<Expense>): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;
  getExpenseSummary(userId: number, startDate?: Date, endDate?: Date): Promise<{
    total: number;
    byCategory: Record<string, number>;
    byMonth: Array<{ month: string; amount: number }>;
  }>;

  // Batch operations
  batchCreateExpenses(expenses: Expense[]): Promise<Expense[]>;
  batchUpdateExpenses(expenses: Array<{ id: number; expense: Partial<Expense> }>): Promise<Expense[]>;
  batchDeleteExpenses(ids: number[]): Promise<void>;

  // Search operations
  searchExpenses(userId: number, query: string): Promise<Expense[]>;
  searchTrips(userId: number, query: string): Promise<Trip[]>;
}
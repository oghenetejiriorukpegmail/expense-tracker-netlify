import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../shared/schema.js';
import type { Expense, InsertExpense } from "../../shared/schema.js";
import { safeEq, safeAnd, safeDesc } from '../../shared/drizzle-types';

// Expense methods extracted from SupabaseStorage
export async function getExpense(db: PostgresJsDatabase<typeof schema>, id: number): Promise<Expense | undefined> {
   const result = await db.select().from(schema.expenses).where(safeEq(schema.expenses.id, id)).limit(1);
   return result[0];
}

export async function getExpensesByUserId(db: PostgresJsDatabase<typeof schema>, userId: number): Promise<Expense[]> {
  const results = await db.select().from(schema.expenses)
                              .where(safeEq(schema.expenses.userId, userId))
                              .orderBy(safeDesc(schema.expenses.date));
  return results;
}

export async function getExpensesByTripName(db: PostgresJsDatabase<typeof schema>, userId: number, tripName: string): Promise<Expense[]> {
  const results = await db.select().from(schema.expenses)
    .where(safeAnd(safeEq(schema.expenses.userId, userId), safeEq(schema.expenses.tripName, tripName)))
    .orderBy(safeDesc(schema.expenses.date));
   return results;
}

export async function createExpense(db: PostgresJsDatabase<typeof schema>, expenseData: InsertExpense & { userId: number, receiptPath?: string | null }): Promise<Expense> {
   const requiredFields: (keyof InsertExpense)[] = ['date', 'type', 'vendor', 'location', 'cost', 'tripName'];
   for (const field of requiredFields) {
      if (expenseData[field] === undefined || expenseData[field] === null) {
          if (field === 'cost' && typeof expenseData.cost !== 'string') { // Check if cost is string
               throw new Error(`Missing or invalid required expense field: ${String(field)}`);
          } else if (field !== 'cost') {
               throw new Error(`Missing required expense field: ${String(field)}`);
          }
      }
   }

   const dataToInsert = {
      ...expenseData,
      cost: expenseData.cost, // Keep as string
      receiptPath: expenseData.receiptPath || null,
      comments: expenseData.comments ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: expenseData.status ?? 'pending', // Ensure status has a default if needed
   };
   const result = await db.insert(schema.expenses).values(dataToInsert).returning();
   return result[0];
}

export async function updateExpense(db: PostgresJsDatabase<typeof schema>, id: number, expenseData: Partial<InsertExpense & { receiptPath?: string | null }>): Promise<Expense> {
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


  const result = await db.update(schema.expenses)
    .set(dataToUpdate)
    .where(safeEq(schema.expenses.id, id))
    .returning();

  if (result.length === 0) {
    throw new Error(`Expense with ID ${id} not found`);
  }
  return result[0];
}

export async function deleteExpense(db: PostgresJsDatabase<typeof schema>, id: number): Promise<void> {
  const result = await db.delete(schema.expenses).where(safeEq(schema.expenses.id, id)).returning({ id: schema.expenses.id });
   if (result.length === 0) {
      console.warn(`Attempted to delete non-existent expense with ID ${id}`);
   }
}

export async function updateExpenseStatus(db: PostgresJsDatabase<typeof schema>, id: number, status: string, error?: string | null): Promise<Expense | undefined> {
  const updateData: Partial<typeof schema.expenses.$inferInsert> = {
      status: status,
      ocrError: error === undefined ? null : error,
      updatedAt: new Date()
  };
  const result = await db.update(schema.expenses)
    .set(updateData)
    .where(safeEq(schema.expenses.id, id))
    .returning();
  return result[0];
}

export async function createExpensesBatch(db: PostgresJsDatabase<typeof schema>, expensesData: (InsertExpense & { userId: number })[]): Promise<{ successCount: number; errors: { index: number; error: any; data: any }[] }> {
  if (!expensesData || expensesData.length === 0) {
    return { successCount: 0, errors: [] };
  }

  const preparedData = expensesData.map(expense => ({
    ...expense,
    cost: expense.cost, // Keep as string
    receiptPath: expense.receiptPath || null,
    comments: expense.comments ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: expense.status ?? 'pending', // Ensure status has a default if needed
  }));

  let successCount = 0;
  const errors: { index: number; error: any; data: any }[] = [];

  try {
    const result = await db.insert(schema.expenses).values(preparedData).returning({ id: schema.expenses.id });
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
import * as schema from '../../shared/schema.js';
import { eq, and, desc } from 'drizzle-orm';
// Expense methods extracted from SupabaseStorage
export async function getExpense(db, id) {
    const result = await db.select().from(schema.expenses).where(eq(schema.expenses.id, id)).limit(1);
    return result[0];
}
export async function getExpensesByUserId(db, userId) {
    const results = await db.select().from(schema.expenses)
        .where(eq(schema.expenses.userId, userId))
        .orderBy(desc(schema.expenses.date));
    return results;
}
export async function getExpensesByTripName(db, userId, tripName) {
    const results = await db.select().from(schema.expenses)
        .where(and(eq(schema.expenses.userId, userId), eq(schema.expenses.tripName, tripName)))
        .orderBy(desc(schema.expenses.date));
    return results;
}
export async function createExpense(db, expenseData) {
    const requiredFields = ['date', 'type', 'vendor', 'location', 'cost', 'tripName'];
    for (const field of requiredFields) {
        if (expenseData[field] === undefined || expenseData[field] === null) {
            if (field === 'cost' && typeof expenseData.cost !== 'string') { // Check if cost is string
                throw new Error(`Missing or invalid required expense field: ${field}`);
            }
            else if (field !== 'cost') {
                throw new Error(`Missing required expense field: ${field}`);
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
export async function updateExpense(db, id, expenseData) {
    const dataToUpdate = {};
    for (const key in expenseData) {
        if (Object.prototype.hasOwnProperty.call(expenseData, key)) {
            const typedKey = key;
            if (expenseData[typedKey] === undefined) {
                dataToUpdate[typedKey] = null;
            }
            else {
                dataToUpdate[typedKey] = expenseData[typedKey];
            }
        }
    }
    dataToUpdate.updatedAt = new Date();
    const result = await db.update(schema.expenses)
        .set(dataToUpdate)
        .where(eq(schema.expenses.id, id))
        .returning();
    if (result.length === 0) {
        throw new Error(`Expense with ID ${id} not found`);
    }
    return result[0];
}
export async function deleteExpense(db, id) {
    const result = await db.delete(schema.expenses).where(eq(schema.expenses.id, id)).returning({ id: schema.expenses.id });
    if (result.length === 0) {
        console.warn(`Attempted to delete non-existent expense with ID ${id}`);
    }
}
export async function updateExpenseStatus(db, id, status, error) {
    const updateData = {
        status: status,
        ocrError: error === undefined ? null : error,
        updatedAt: new Date()
    };
    const result = await db.update(schema.expenses)
        .set(updateData)
        .where(eq(schema.expenses.id, id))
        .returning();
    return result[0];
}
export async function createExpensesBatch(db, expensesData) {
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
    const errors = [];
    try {
        const result = await db.insert(schema.expenses).values(preparedData).returning({ id: schema.expenses.id });
        successCount = result.length;
        console.log(`Successfully batch inserted ${successCount} expenses.`);
        if (successCount !== preparedData.length) {
            console.warn(`Batch insert discrepancy: Expected ${preparedData.length}, inserted ${successCount}.`);
        }
    }
    catch (error) {
        console.error("Error during batch expense insertion:", error);
        errors.push({ index: -1, error: error, data: 'Entire batch failed' });
        successCount = 0;
    }
    return { successCount, errors };
}

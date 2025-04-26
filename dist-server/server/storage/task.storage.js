import * as schema from '../../shared/schema.js';
import { eq, desc } from 'drizzle-orm';
// Background Task methods extracted from SupabaseStorage
export async function createBackgroundTask(db, taskData) {
    try {
        const result = await db.insert(schema.backgroundTasks).values(taskData).returning();
        return result[0];
    }
    catch (error) {
        console.error("[SupabaseStorage] Error creating background task:", error);
        // Create a mock task object to return
        const mockTask = {
            id: -1, // Use a negative ID to indicate it's a mock
            user_id: taskData.userId,
            type: taskData.type,
            status: taskData.status,
            result: typeof taskData.result === 'string' ? taskData.result : JSON.stringify(taskData.result),
            error: null,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        throw error; // Re-throw the error to be handled by the caller
    }
}
export async function updateBackgroundTaskStatus(db, id, status, result, error) {
    try {
        const updateData = {
            status: status,
            result: result ? JSON.stringify(result) : null, // Store result as JSON string
            error: error === undefined ? null : error,
            updatedAt: new Date()
        };
        const res = await db.update(schema.backgroundTasks)
            .set(updateData)
            .where(eq(schema.backgroundTasks.id, id))
            .returning();
        return res[0];
    }
    catch (error) {
        console.error("[SupabaseStorage] Error updating background task status:", error);
        // Return undefined to indicate the update failed
        return undefined;
    }
}
export async function getBackgroundTaskById(db, id) {
    try {
        const result = await db.select().from(schema.backgroundTasks).where(eq(schema.backgroundTasks.id, id)).limit(1);
        return result[0];
    }
    catch (error) {
        console.error("[SupabaseStorage] Error getting background task by ID:", error);
        return undefined;
    }
}
export async function getBackgroundTasksByUserId(db, userId) {
    try {
        return db.select().from(schema.backgroundTasks)
            .where(eq(schema.backgroundTasks.userId, userId))
            .orderBy(desc(schema.backgroundTasks.createdAt));
    }
    catch (error) {
        console.error("[SupabaseStorage] Error getting background tasks by user ID:", error);
        return []; // Return an empty array if there's an error
    }
}

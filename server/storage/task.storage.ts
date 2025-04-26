import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../shared/schema.js';
import type { BackgroundTask, InsertBackgroundTask } from "../../shared/schema.js";
import { eq, desc } from 'drizzle-orm';

// Background Task methods extracted from SupabaseStorage
export async function createBackgroundTask(db: PostgresJsDatabase<typeof schema>, taskData: InsertBackgroundTask): Promise<BackgroundTask> {
  try {
    const result = await db.insert(schema.backgroundTasks).values(taskData).returning();
    return result[0];
  } catch (error) {
    console.error("[SupabaseStorage] Error creating background task:", error);
    
    // Create a mock task object to return
    const mockTask: BackgroundTask = {
      id: -1, // Use a negative ID to indicate it's a mock
      userId: taskData.userId,
      type: taskData.type as any,
      status: taskData.status as any,
      result: typeof taskData.result === 'string' ? taskData.result : JSON.stringify(taskData.result),
      error: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    throw error; // Re-throw the error to be handled by the caller
  }
}

export async function updateBackgroundTaskStatus(db: PostgresJsDatabase<typeof schema>, id: number, status: typeof schema.taskStatusEnum.enumValues[number], result?: any, error?: string | null): Promise<BackgroundTask | undefined> {
  try {
    const updateData: Partial<typeof schema.backgroundTasks.$inferInsert> = {
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
  } catch (error) {
    console.error("[SupabaseStorage] Error updating background task status:", error);
    
    // Return undefined to indicate the update failed
    return undefined;
  }
}

export async function getBackgroundTaskById(db: PostgresJsDatabase<typeof schema>, id: number): Promise<BackgroundTask | undefined> {
  try {
    const result = await db.select().from(schema.backgroundTasks).where(eq(schema.backgroundTasks.id, id)).limit(1);
    return result[0];
  } catch (error) {
    console.error("[SupabaseStorage] Error getting background task by ID:", error);
    return undefined;
  }
}

export async function getBackgroundTasksByUserId(db: PostgresJsDatabase<typeof schema>, userId: number): Promise<BackgroundTask[]> {
  try {
    return db.select().from(schema.backgroundTasks)
               .where(eq(schema.backgroundTasks.userId, userId))
               .orderBy(desc(schema.backgroundTasks.createdAt));
  } catch (error) {
    console.error("[SupabaseStorage] Error getting background tasks by user ID:", error);
    return []; // Return an empty array if there's an error
  }
}
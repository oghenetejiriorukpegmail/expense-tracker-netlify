import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../shared/schema.js';
import type { BackgroundTask, InsertBackgroundTask } from "@shared/schema";
import { eq, desc } from 'drizzle-orm';

// Background Task methods extracted from SupabaseStorage
export async function createBackgroundTask(db: PostgresJsDatabase<typeof schema>, taskData: InsertBackgroundTask): Promise<BackgroundTask> {
  const result = await db.insert(schema.backgroundTasks).values(taskData).returning();
  return result[0];
}

export async function updateBackgroundTaskStatus(db: PostgresJsDatabase<typeof schema>, id: number, status: typeof schema.taskStatusEnum.enumValues[number], result?: any, error?: string | null): Promise<BackgroundTask | undefined> {
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
}

export async function getBackgroundTaskById(db: PostgresJsDatabase<typeof schema>, id: number): Promise<BackgroundTask | undefined> {
  const result = await db.select().from(schema.backgroundTasks).where(eq(schema.backgroundTasks.id, id)).limit(1);
  return result[0];
}

export async function getBackgroundTasksByUserId(db: PostgresJsDatabase<typeof schema>, userId: number): Promise<BackgroundTask[]> {
  return db.select().from(schema.backgroundTasks)
             .where(eq(schema.backgroundTasks.userId, userId))
             .orderBy(desc(schema.backgroundTasks.createdAt));
}
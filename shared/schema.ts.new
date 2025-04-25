// Import PostgreSQL core functions
import { pgTable, text, integer, serial, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core"; // Added pgEnum
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define users table for PostgreSQL
export const users = pgTable("users", {
  id: serial("id").primaryKey(), // Use serial for auto-incrementing integer PK in PG
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull().default(''),
  lastName: text("last_name").notNull().default(''),
  phoneNumber: text("phone_number").notNull().default(''),
  email: text("email").notNull().unique().default(''),
  bio: text("bio"),
  authUserId: text("auth_user_id").unique(), // Link to Supabase Auth user UUID
  // Use timestamp with timezone for PG
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow(),
});

// Define trips table for PostgreSQL
export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  // Ensure foreign key references integer type (serial resolves to integer)
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow(),
});

// Define expenses table for PostgreSQL
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  date: text("date").notNull(), // Keep date as text (YYYY-MM-DD) or use date type: date("date")
  vendor: text("vendor").notNull(),
  location: text("location").notNull(),
  // Use numeric for precise decimal values (good for currency)
  cost: numeric("cost", { precision: 10, scale: 2 }).notNull(),
  comments: text("comments"),
  tripName: text("trip_name").notNull(),
  receiptPath: text("receipt_path"),
  // Status for async operations like OCR
  status: text("status").default('complete'), // e.g., 'processing_ocr', 'ocr_failed', 'complete'
  ocrError: text("ocr_error"), // Store OCR error messages if any
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow(),
});

// Define an enum for the entry method
export const entryMethodEnum = pgEnum('entry_method', ['manual', 'ocr']);

// Define enum for background task types
export const taskTypeEnum = pgEnum('task_type', ['batch_upload', 'expense_export', 'receipt_ocr']);

// Define enum for background task status
export const taskStatusEnum = pgEnum('task_status', ['pending', 'processing', 'completed', 'failed']);

// Define background_tasks table
export const backgroundTasks = pgTable("background_tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: taskTypeEnum("type").notNull(),
  status: taskStatusEnum("status").notNull().default('pending'),
  // Use jsonb for flexible result storage (e.g., counts, download URL)
  result: text("result"), // Storing JSON as text for simplicity, consider jsonb type if needed
  error: text("error"), // Store error messages
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow(),
});

// Define mileage_logs table for PostgreSQL
export const mileageLogs = pgTable("mileage_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }), // Foreign key to users
  tripId: integer("trip_id").references(() => trips.id, { onDelete: 'set null' }), // Optional foreign key to trips
  tripDate: timestamp("trip_date", { withTimezone: true, mode: 'date' }).notNull(),
  startOdometer: numeric("start_odometer", { precision: 10, scale: 1 }).notNull(),
  endOdometer: numeric("end_odometer", { precision: 10, scale: 1 }).notNull(),
  calculatedDistance: numeric("calculated_distance", { precision: 10, scale: 1 }).notNull(), // Automatically calculated
  purpose: text("purpose"), // Optional reason for the trip
  startImageUrl: text("start_image_url"), // URL/path to the starting odometer image
  endImageUrl: text("end_image_url"), // URL/path to the ending odometer image
  entryMethod: entryMethodEnum("entry_method").notNull(), // 'manual' or 'ocr'
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow(),
});


// Insert schemas (should adapt automatically to the new table types)
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true, // Existing firstName
  lastName: true, // Include lastName in insert schema
  phoneNumber: true, // Include phoneNumber in insert schema
  email: true, // Existing email
  // bio is optional, not included by default
});

export const insertTripSchema = createInsertSchema(trips).pick({
  name: true,
  description: true,
}); // Removed .omit({ userId: true })

export const insertExpenseSchema = createInsertSchema(expenses).pick({
  type: true,
  date: true,
  vendor: true,
  location: true,
  cost: true,
  comments: true,
  tripName: true,
  receiptPath: true, // Allow setting receipt path on insert
  status: true, // Allow setting status on insert
});

// Schema for inserting background tasks (most fields have defaults)
export const insertBackgroundTaskSchema = createInsertSchema(backgroundTasks).pick({
    userId: true,
    type: true,
    status: true, // Optional override default 'pending'
    result: true, // Optional initial result data
    error: true, // Optional initial error data
});


// 1. Raw schema from createInsertSchema + pick
export const rawInsertMileageLogSchema = createInsertSchema(mileageLogs).pick({
    tripId: true, // Optional
    tripDate: true,
    startOdometer: true,
    endOdometer: true,
    purpose: true, // Optional
    entryMethod: true,
    // calculatedDistance is derived, start/endImageUrl handled separately
});

// 2. Extended schema with number validation
export const extendedInsertMileageLogSchema = rawInsertMileageLogSchema.extend({
    // Ensure numeric fields are treated as numbers by Zod
    startOdometer: z.number().positive('Start odometer must be positive'),
    endOdometer: z.number().positive('End odometer must be positive'),
    tripId: z.number().int().positive().optional(), // Ensure tripId is validated correctly if provided
});

// 3. Final schema for creation, adding the refinement
export const insertMileageLogSchema = extendedInsertMileageLogSchema.refine(data => data.endOdometer > data.startOdometer, {
    message: "End odometer reading must be greater than start odometer reading",
    path: ["endOdometer"],
});

// Export the base schema separately for potential use (like updates before refinement)
export const baseInsertMileageLogSchema = rawInsertMileageLogSchema;

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;


// Type for public user data, excluding sensitive fields like password
export type PublicUser = Omit<User, 'password'>;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof trips.$inferSelect;

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

export type InsertMileageLog = z.infer<typeof insertMileageLogSchema>; // Type for creation
export type RawInsertMileageLog = z.infer<typeof rawInsertMileageLogSchema>; // Type for base schema (useful for updates)
export type MileageLog = typeof mileageLogs.$inferSelect;

export type InsertBackgroundTask = z.infer<typeof insertBackgroundTaskSchema>;
export type BackgroundTask = typeof backgroundTasks.$inferSelect;
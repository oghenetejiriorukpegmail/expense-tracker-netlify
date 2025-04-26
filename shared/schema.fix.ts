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
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow(),
});

// Define expenses table for PostgreSQL
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  date: text("date").notNull(), // Keep date as text (YYYY-MM-DD) or use date type: date("date")
  vendor: text("vendor").notNull(),
  location: text("location").notNull(),
  // Use text for cost to match how it's used in the code
  cost: text("cost").notNull(),
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
  startOdometer: text("start_odometer").notNull(), // Changed to text to match how it's used in the code
  endOdometer: text("end_odometer").notNull(), // Changed to text to match how it's used in the code
  calculatedDistance: text("calculated_distance").notNull(), // Changed to text to match how it's used in the code
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
  firstName: true,
  lastName: true,
  phoneNumber: true,
  email: true,
  bio: true,
});

export const insertTripSchema = createInsertSchema(trips).pick({
  name: true,
  description: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).pick({
  type: true,
  date: true,
  vendor: true,
  location: true,
  cost: true,
  comments: true,
  tripName: true,
  receiptPath: true,
  status: true,
});

// Schema for inserting background tasks (most fields have defaults)
export const insertBackgroundTaskSchema = createInsertSchema(backgroundTasks).pick({
  userId: true,
  type: true,
  status: true,
  result: true,
  error: true,
});

// 1. Raw schema from createInsertSchema + pick
export const rawInsertMileageLogSchema = createInsertSchema(mileageLogs).pick({
  tripId: true,
  tripDate: true,
  startOdometer: true,
  endOdometer: true,
  purpose: true,
  entryMethod: true,
  startImageUrl: true,
  endImageUrl: true,
  calculatedDistance: true,
});

// 2. Extended schema with number validation
export const extendedInsertMileageLogSchema = rawInsertMileageLogSchema.extend({
  // Ensure numeric fields are treated as numbers by Zod
  startOdometer: z.union([z.string(), z.number()]).transform(val => String(val)),
  endOdometer: z.union([z.string(), z.number()]).transform(val => String(val)),
  tripId: z.number().int().positive().optional(),
});

// 3. Final schema for creation, adding the refinement
export const insertMileageLogSchema = extendedInsertMileageLogSchema.refine(
  data => {
    const start = typeof data.startOdometer === 'string' ? parseFloat(data.startOdometer) : data.startOdometer;
    const end = typeof data.endOdometer === 'string' ? parseFloat(data.endOdometer) : data.endOdometer;
    return Number(end) > Number(start);
  },
  {
    message: "End odometer reading must be greater than start odometer reading",
    path: ["endOdometer"],
  }
);

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
// Import PostgreSQL core functions
import { pgTable, text, integer, serial, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core"; // Added pgEnum
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
// Define users table for PostgreSQL
export var users = pgTable("users", {
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
export var trips = pgTable("trips", {
    id: serial("id").primaryKey(),
    // Ensure foreign key references integer type (serial resolves to integer)
    userId: integer("user_id").notNull().references(function () { return users.id; }),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow(),
});
// Define expenses table for PostgreSQL
export var expenses = pgTable("expenses", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(function () { return users.id; }),
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
export var entryMethodEnum = pgEnum('entry_method', ['manual', 'ocr']);
// Define enum for background task types
export var taskTypeEnum = pgEnum('task_type', ['batch_upload', 'expense_export']);
// Define enum for background task status
export var taskStatusEnum = pgEnum('task_status', ['pending', 'processing', 'completed', 'failed']);
// Define background_tasks table
export var backgroundTasks = pgTable("background_tasks", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(function () { return users.id; }, { onDelete: 'cascade' }),
    type: taskTypeEnum("type").notNull(),
    status: taskStatusEnum("status").notNull().default('pending'),
    // Use jsonb for flexible result storage (e.g., counts, download URL)
    result: text("result"), // Storing JSON as text for simplicity, consider jsonb type if needed
    error: text("error"), // Store error messages
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow(),
});
// Define mileage_logs table for PostgreSQL
export var mileageLogs = pgTable("mileage_logs", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(function () { return users.id; }, { onDelete: 'cascade' }), // Foreign key to users
    tripId: integer("trip_id").references(function () { return trips.id; }, { onDelete: 'set null' }), // Optional foreign key to trips
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
export var insertUserSchema = createInsertSchema(users).pick({
    username: true,
    password: true,
    firstName: true, // Existing firstName
    lastName: true, // Include lastName in insert schema
    phoneNumber: true, // Include phoneNumber in insert schema
    email: true, // Existing email
    // bio is optional, not included by default
});
export var insertTripSchema = createInsertSchema(trips).pick({
    name: true,
    description: true,
}); // Removed .omit({ userId: true })
export var insertExpenseSchema = createInsertSchema(expenses).pick({
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
export var insertBackgroundTaskSchema = createInsertSchema(backgroundTasks).pick({
    userId: true,
    type: true,
    status: true, // Optional override default 'pending'
    result: true, // Optional initial result data
    error: true, // Optional initial error data
});
// 1. Raw schema from createInsertSchema + pick
export var rawInsertMileageLogSchema = createInsertSchema(mileageLogs).pick({
    tripId: true, // Optional
    tripDate: true,
    startOdometer: true,
    endOdometer: true,
    purpose: true, // Optional
    entryMethod: true,
    // calculatedDistance is derived, start/endImageUrl handled separately
});
// 2. Extended schema with number validation
export var extendedInsertMileageLogSchema = rawInsertMileageLogSchema.extend({
    // Ensure numeric fields are treated as numbers by Zod
    startOdometer: z.number().positive('Start odometer must be positive'),
    endOdometer: z.number().positive('End odometer must be positive'),
    tripId: z.number().int().positive().optional(), // Ensure tripId is validated correctly if provided
});
// 3. Final schema for creation, adding the refinement
export var insertMileageLogSchema = extendedInsertMileageLogSchema.refine(function (data) { return data.endOdometer > data.startOdometer; }, {
    message: "End odometer reading must be greater than start odometer reading",
    path: ["endOdometer"],
});
// Export the base schema separately for potential use (like updates before refinement)
export var baseInsertMileageLogSchema = rawInsertMileageLogSchema;

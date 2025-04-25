// Script to directly create the background_tasks table using postgres.js
require('dotenv').config();
const postgres = require('postgres');

async function createBackgroundTasksTable() {
  console.log("Creating background_tasks table directly using postgres.js...");
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is not set.");
    process.exit(1);
  }
  
  const client = postgres(databaseUrl, { max: 1 });
  
  try {
    // Check if the task_type enum exists
    const taskTypeExists = await client`
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'task_type'
      );
    `;
    
    // Create task_type enum if it doesn't exist
    if (!taskTypeExists[0].exists) {
      console.log("Creating task_type enum...");
      await client`
        CREATE TYPE "public"."task_type" AS ENUM('batch_upload', 'expense_export', 'receipt_ocr');
      `;
      console.log("task_type enum created successfully");
    } else {
      console.log("task_type enum already exists");
    }
    
    // Check if the task_status enum exists
    const taskStatusExists = await client`
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'task_status'
      );
    `;
    
    // Create task_status enum if it doesn't exist
    if (!taskStatusExists[0].exists) {
      console.log("Creating task_status enum...");
      await client`
        CREATE TYPE "public"."task_status" AS ENUM('pending', 'processing', 'completed', 'failed');
      `;
      console.log("task_status enum created successfully");
    } else {
      console.log("task_status enum already exists");
    }
    
    // Check if the background_tasks table exists
    const tableExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'background_tasks'
      );
    `;
    
    // Create the background_tasks table if it doesn't exist
    if (!tableExists[0].exists) {
      console.log("Creating background_tasks table...");
      await client`
        CREATE TABLE "background_tasks" (
          "id" serial PRIMARY KEY NOT NULL,
          "user_id" integer NOT NULL,
          "type" "task_type" NOT NULL,
          "status" "task_status" NOT NULL DEFAULT 'pending',
          "result" text,
          "error" text,
          "created_at" timestamp with time zone DEFAULT now(),
          "updated_at" timestamp with time zone DEFAULT now()
        );
      `;
      console.log("background_tasks table created successfully");
      
      // Add foreign key constraint
      console.log("Adding foreign key constraint...");
      await client`
        ALTER TABLE "background_tasks" 
        ADD CONSTRAINT "background_tasks_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") 
        ON DELETE cascade ON UPDATE no action;
      `;
      console.log("Foreign key constraint added successfully");
    } else {
      console.log("background_tasks table already exists");
    }
    
    // Verify the table was created
    const verifyTable = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'background_tasks'
      );
    `;
    
    if (verifyTable[0].exists) {
      console.log("✅ background_tasks table exists!");
      
      // Get table structure
      const tableStructure = await client`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_name = 'background_tasks';
      `;
      
      console.log("\nTable structure:");
      console.table(tableStructure);
    } else {
      console.error("❌ background_tasks table does not exist!");
    }
    
  } catch (error) {
    console.error("Error creating background_tasks table:", error);
  } finally {
    // Close the connection
    await client.end();
  }
}

createBackgroundTasksTable();
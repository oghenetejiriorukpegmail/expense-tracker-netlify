// Script to apply the background_tasks migration directly
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Get Supabase connection details from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("ERROR: Missing Supabase credentials in environment variables");
  console.error("SUPABASE_URL:", supabaseUrl ? "Set" : "Not set");
  console.error("SUPABASE_SERVICE_KEY:", supabaseServiceKey ? "Set" : "Not set");
  process.exit(1);
}

console.log("Supabase URL:", supabaseUrl);
console.log("Service Key provided:", !!supabaseServiceKey);

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Read the migration SQL file
const migrationPath = path.join(__dirname, 'migrations', '0003_add_background_tasks.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Split the SQL into individual statements
const statements = migrationSQL.split('-->');

async function applyMigration() {
  console.log("Applying background_tasks migration...");
  
  try {
    // Execute each SQL statement
    for (const statement of statements) {
      if (statement.trim()) {
        const sql = statement.replace('statement-breakpoint', '').trim();
        console.log(`Executing SQL: ${sql.substring(0, 100)}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', { sql });
        
        if (error) {
          console.error("Error executing SQL:", error);
          
          // Try direct query if RPC fails
          console.log("Trying direct query...");
          const { error: directError } = await supabase.from('_exec_sql').select('*').eq('sql', sql);
          
          if (directError) {
            console.error("Direct query also failed:", directError);
            
            // Last resort - try to create the table directly
            if (sql.includes('CREATE TABLE "background_tasks"')) {
              console.log("Attempting to create background_tasks table directly...");
              
              // Create the task_type enum
              const { error: enumTypeError } = await supabase.rpc('exec_sql', { 
                sql: "CREATE TYPE IF NOT EXISTS \"public\".\"task_type\" AS ENUM('batch_upload', 'expense_export', 'receipt_ocr')" 
              });
              
              if (enumTypeError) {
                console.error("Error creating task_type enum:", enumTypeError);
              }
              
              // Create the task_status enum
              const { error: enumStatusError } = await supabase.rpc('exec_sql', { 
                sql: "CREATE TYPE IF NOT EXISTS \"public\".\"task_status\" AS ENUM('pending', 'processing', 'completed', 'failed')" 
              });
              
              if (enumStatusError) {
                console.error("Error creating task_status enum:", enumStatusError);
              }
              
              // Create the background_tasks table
              const { error: tableError } = await supabase.rpc('exec_sql', { 
                sql: `
                CREATE TABLE IF NOT EXISTS "background_tasks" (
                  "id" serial PRIMARY KEY NOT NULL,
                  "user_id" integer NOT NULL,
                  "type" "task_type" NOT NULL,
                  "status" "task_status" NOT NULL DEFAULT 'pending',
                  "result" text,
                  "error" text,
                  "created_at" timestamp with time zone DEFAULT now(),
                  "updated_at" timestamp with time zone DEFAULT now()
                )
                `
              });
              
              if (tableError) {
                console.error("Error creating background_tasks table:", tableError);
              } else {
                console.log("Successfully created background_tasks table directly");
              }
              
              // Add foreign key constraint
              const { error: fkError } = await supabase.rpc('exec_sql', { 
                sql: `
                ALTER TABLE "background_tasks" 
                ADD CONSTRAINT "background_tasks_user_id_users_id_fk" 
                FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") 
                ON DELETE cascade ON UPDATE no action
                `
              });
              
              if (fkError) {
                console.error("Error adding foreign key constraint:", fkError);
              } else {
                console.log("Successfully added foreign key constraint");
              }
            }
          }
        } else {
          console.log("SQL executed successfully");
        }
      }
    }
    
    console.log("Migration completed");
    
    // Verify the table was created
    console.log("Verifying background_tasks table...");
    const { data: tableData, error: tableError } = await supabase
      .from('background_tasks')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error("Error verifying table:", tableError);
    } else {
      console.log("Table verification successful:", tableData);
    }
    
  } catch (error) {
    console.error("Error applying migration:", error);
  }
}

// Run the migration
applyMigration();
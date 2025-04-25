// Script to verify the background_tasks table exists
require('dotenv').config();
const postgres = require('postgres');

async function verifyBackgroundTasksTable() {
  console.log("Connecting to database to verify background_tasks table...");
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is not set.");
    process.exit(1);
  }
  
  const client = postgres(databaseUrl, { max: 1 });
  
  try {
    // Check if the table exists
    const result = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'background_tasks'
      );
    `;
    
    if (result[0].exists) {
      console.log("✅ background_tasks table exists!");
      
      // Check if the enum types exist
      const taskTypeEnum = await client`
        SELECT EXISTS (
          SELECT FROM pg_type 
          WHERE typname = 'task_type'
        );
      `;
      
      const taskStatusEnum = await client`
        SELECT EXISTS (
          SELECT FROM pg_type 
          WHERE typname = 'task_status'
        );
      `;
      
      console.log("✅ task_type enum exists:", taskTypeEnum[0].exists);
      console.log("✅ task_status enum exists:", taskStatusEnum[0].exists);
      
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
    console.error("Error verifying background_tasks table:", error);
  } finally {
    // Close the connection
    await client.end();
  }
}

verifyBackgroundTasksTable();
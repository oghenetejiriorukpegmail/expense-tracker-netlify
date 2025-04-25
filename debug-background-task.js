// Debug script to validate background task creation issue
const { createClient } = require('@supabase/supabase-js');
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

// Test task data that mimics what's used in the OCR route
const testTaskData = {
  user_id: 1, // This should be userId to match schema
  type: 'receipt_ocr', // This type doesn't exist in the taskTypeEnum
  status: 'processing',
  data: JSON.stringify({
    receipt_path: 'test/path.jpg',
    mime_type: 'image/jpeg',
    timestamp: Date.now()
  })
};

// Corrected task data
const correctedTaskData = {
  userId: 1, // Corrected field name
  type: 'batch_upload', // Using a type that exists in the enum
  status: 'processing',
  result: JSON.stringify({
    receipt_path: 'test/path.jpg',
    mime_type: 'image/jpeg',
    timestamp: Date.now()
  })
};

async function testBackgroundTaskCreation() {
  console.log("=== Testing Background Task Creation ===");
  
  // First, check if we can access the table at all
  console.log("\nChecking if background_tasks table exists and is accessible:");
  try {
    const { data: tableCheck, error: tableError } = await supabase
      .from('background_tasks')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error("ERROR accessing table:", tableError);
      console.error("Error details:", JSON.stringify(tableError, null, 2));
    } else {
      console.log("Table access successful:", tableCheck);
    }
  } catch (e) {
    console.error("Exception accessing table:", e);
  }
  
  // Check the schema of the background_tasks table
  console.log("\nChecking background_tasks table schema:");
  try {
    // This is a Postgres-specific query to get column information
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'background_tasks' });
    
    if (schemaError) {
      console.error("ERROR getting schema:", schemaError);
      console.error("Error details:", JSON.stringify(schemaError, null, 2));
      
      // Try a different approach - just select * to see what columns are returned
      console.log("\nTrying alternative schema check:");
      const { data: altData, error: altError } = await supabase
        .from('background_tasks')
        .select('*')
        .limit(1);
      
      if (altError) {
        console.error("Alternative schema check failed:", altError);
      } else if (altData && altData.length > 0) {
        console.log("Columns from sample row:", Object.keys(altData[0]));
      } else {
        console.log("Table exists but is empty");
      }
    } else {
      console.log("Table schema:", schemaData);
    }
  } catch (e) {
    console.error("Exception getting schema:", e);
  }
  
  // First, try with the problematic data
  console.log("\n1. Testing with original task data:");
  console.log(JSON.stringify(testTaskData, null, 2));
  
  try {
    const { data: originalResult, error: originalError } = await supabase
      .from('background_tasks')
      .insert(testTaskData)
      .select();
    
    if (originalError) {
      console.error("ERROR with original data:", originalError);
      console.error("Error details:", JSON.stringify(originalError, null, 2));
      
      // Check if it's a type validation error
      if (originalError.message && originalError.message.includes("type")) {
        console.log("\n✓ CONFIRMED: The 'receipt_ocr' type is not in the taskTypeEnum");
      }
      
      // Check if it's a field name issue
      if (originalError.message && originalError.message.includes("user_id")) {
        console.log("\n✓ CONFIRMED: The field should be 'userId' not 'user_id'");
      }
    } else {
      console.log("Success with original data (unexpected):", originalResult);
    }
  } catch (e) {
    console.error("Exception with original data:", e);
  }
  
  // Now try with the corrected data
  console.log("\n2. Testing with corrected task data:");
  console.log(JSON.stringify(correctedTaskData, null, 2));
  
  try {
    const { data: correctedResult, error: correctedError } = await supabase
      .from('background_tasks')
      .insert(correctedTaskData)
      .select();
    
    if (correctedError) {
      console.error("ERROR with corrected data:", correctedError);
      console.error("Error details:", JSON.stringify(correctedError, null, 2));
    } else {
      console.log("Success with corrected data:", correctedResult);
      console.log("\n✓ CONFIRMED: The corrected data works properly");
    }
  } catch (e) {
    console.error("Exception with corrected data:", e);
  }
  
  console.log("\n=== Test Complete ===");
}

// Run the test
testBackgroundTaskCreation();
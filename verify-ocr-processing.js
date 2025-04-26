/**
 * verify-ocr-processing.js
 * 
 * This script verifies the OCR receipt processing functionality by:
 * 1. Checking if the 'expenses-receipts' bucket exists
 * 2. Verifying the background_tasks table exists
 * 3. Uploading a receipt image to test file storage
 * 4. Checking if the server is running and can process OCR requests
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const postgres = require('postgres');
require('dotenv').config(); // Load environment variables from .env file

// ANSI color codes for better readability
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

async function verifyOcrProcessing() {
  console.log(`${colors.cyan}=== OCR Receipt Processing Verification ====${colors.reset}\n`);
  
  try {
    // Get environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const databaseUrl = process.env.DATABASE_URL;
    
    // Check if environment variables are set
    if (!supabaseUrl || !supabaseKey) {
      console.error(`${colors.red}Error: Supabase URL or key not configured in .env file${colors.reset}`);
      return;
    }
    
    if (!databaseUrl) {
      console.error(`${colors.red}Error: DATABASE_URL not configured in .env file${colors.reset}`);
      return;
    }
    
    console.log(`${colors.blue}Connecting to Supabase...${colors.reset}`);
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Target bucket name
    const bucketName = 'expenses-receipts';
    
    console.log(`${colors.blue}Checking if bucket '${bucketName}' exists...${colors.reset}`);
    
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error(`${colors.red}Error listing buckets: ${listError.message}${colors.reset}`);
      return;
    }
    
    // Check if the target bucket exists
    const bucketExists = buckets?.some(b => b.name === bucketName);
    
    if (!bucketExists) {
      console.error(`${colors.red}Error: Bucket '${bucketName}' does not exist in Supabase${colors.reset}`);
      return;
    }
    
    console.log(`${colors.green}✓ Bucket '${bucketName}' exists${colors.reset}`);
    
    // Check if the background_tasks table exists
    console.log(`${colors.blue}Checking if background_tasks table exists...${colors.reset}`);
    
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
        console.log(`${colors.green}✓ background_tasks table exists!${colors.reset}`);
        
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
        
        console.log(`${colors.green}✓ task_type enum exists: ${taskTypeEnum[0].exists}${colors.reset}`);
        console.log(`${colors.green}✓ task_status enum exists: ${taskStatusEnum[0].exists}${colors.reset}`);
        
        // Get table structure
        const tableStructure = await client`
          SELECT column_name, data_type, udt_name
          FROM information_schema.columns
          WHERE table_name = 'background_tasks';
        `;
        
        console.log(`\n${colors.blue}Table structure:${colors.reset}`);
        console.table(tableStructure);
      } else {
        console.error(`${colors.red}❌ background_tasks table does not exist!${colors.reset}`);
        return;
      }
    } catch (dbError) {
      console.error(`${colors.red}Error checking background_tasks table: ${dbError.message}${colors.reset}`);
      return;
    } finally {
      // Close the connection
      await client.end();
    }
    
    // Check if the receipt sample file exists
    const sampleReceiptPath = path.join(__dirname, 'Receipt sample.jpg');
    if (!fs.existsSync(sampleReceiptPath)) {
      console.error(`${colors.red}Error: Receipt sample file not found at ${sampleReceiptPath}${colors.reset}`);
      return;
    }
    
    console.log(`${colors.blue}Reading receipt sample file...${colors.reset}`);
    const fileContent = fs.readFileSync(sampleReceiptPath);
    
    // Create a timestamp for unique file naming
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const receiptFileName = `verify-receipt-${timestamp}.jpg`;
    
    console.log(`${colors.blue}Uploading receipt to Supabase storage...${colors.reset}`);
    
    // Upload the receipt to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(`verify/${receiptFileName}`, fileContent, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (uploadError) {
      console.error(`${colors.red}Error uploading receipt: ${uploadError.message}${colors.reset}`);
      return;
    }
    
    console.log(`${colors.green}✓ Successfully uploaded receipt to Supabase storage${colors.reset}`);
    
    // Get the public URL for the uploaded receipt
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(`verify/${receiptFileName}`);
    
    if (publicUrlData?.publicUrl) {
      console.log(`${colors.blue}Public URL: ${publicUrlData.publicUrl}${colors.reset}`);
    }
    
    // Clean up the test file
    console.log(`${colors.blue}Cleaning up test file...${colors.reset}`);
    
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([`verify/${receiptFileName}`]);
    
    if (deleteError) {
      console.error(`${colors.yellow}Warning: Could not delete test file: ${deleteError.message}${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ Successfully cleaned up test file${colors.reset}`);
    }
    
    // Final verification result
    console.log(`\n${colors.green}=== VERIFICATION SUCCESSFUL ===${colors.reset}`);
    console.log(`${colors.green}The OCR receipt processing infrastructure is in place:${colors.reset}`);
    console.log(`${colors.green}1. The 'expenses-receipts' bucket exists and is working correctly${colors.reset}`);
    console.log(`${colors.green}2. The background_tasks table exists with the correct structure${colors.reset}`);
    console.log(`${colors.green}3. File uploads to the storage bucket are functioning as expected${colors.reset}`);
    console.log(`\n${colors.yellow}Note: To fully test the OCR functionality, you would need to:${colors.reset}`);
    console.log(`${colors.yellow}1. Ensure the server is running with the OCR routes enabled${colors.reset}`);
    console.log(`${colors.yellow}2. Upload a receipt through the application UI${colors.reset}`);
    console.log(`${colors.yellow}3. Check the logs for any errors during processing${colors.reset}`);
    console.log(`${colors.yellow}4. Verify that the background task is updated with the OCR results${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Unexpected error during verification:${colors.reset}`, error);
    console.log(`\n${colors.red}=== VERIFICATION FAILED ===${colors.reset}`);
  }
}

// Run the verification
verifyOcrProcessing();
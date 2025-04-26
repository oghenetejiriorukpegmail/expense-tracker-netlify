/**
 * verify-receipt-upload.js
 * 
 * This script verifies that the 'expenses-receipts' bucket exists in Supabase
 * and that files can be successfully uploaded to it.
 * 
 * Usage:
 * 1. Make sure your .env file contains SUPABASE_URL and SUPABASE_SERVICE_KEY
 * 2. Run: node verify-receipt-upload.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
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

async function verifyReceiptUpload() {
  console.log(`${colors.cyan}=== Supabase Receipt Upload Verification ====${colors.reset}\n`);
  
  try {
    // Get environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    // Check if environment variables are set
    if (!supabaseUrl || !supabaseKey) {
      console.error(`${colors.red}Error: Supabase URL or key not configured in .env file${colors.reset}`);
      console.log(`\nPlease ensure your .env file contains:`);
      console.log(`SUPABASE_URL=your-project-url`);
      console.log(`SUPABASE_SERVICE_KEY=your-service-key`);
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
      console.log(`\nPlease create the bucket in your Supabase project:`);
      console.log(`1. Go to your Supabase dashboard`);
      console.log(`2. Navigate to Storage`);
      console.log(`3. Click "New Bucket"`);
      console.log(`4. Enter "${bucketName}" as the bucket name`);
      console.log(`5. Configure permissions as needed`);
      return;
    }
    
    console.log(`${colors.green}✓ Bucket '${bucketName}' exists${colors.reset}`);
    
    // Test file upload
    console.log(`${colors.blue}Testing file upload to bucket '${bucketName}'...${colors.reset}`);
    
    // Create a test file with timestamp to avoid conflicts
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const testFileName = `test-upload-${timestamp}.txt`;
    const testContent = Buffer.from(`Test content created at ${timestamp}`);
    
    // Try to upload the test file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
        upsert: true
      });
    
    if (uploadError) {
      console.error(`${colors.red}Error uploading test file: ${uploadError.message}${colors.reset}`);
      console.log(`\nPossible causes:`);
      console.log(`1. Insufficient permissions with the provided service key`);
      console.log(`2. Storage quota exceeded`);
      console.log(`3. Bucket policy restrictions`);
      return;
    }
    
    console.log(`${colors.green}✓ Successfully uploaded test file to bucket${colors.reset}`);
    
    // Try to upload a sample receipt if available
    const sampleReceiptPath = path.join(__dirname, 'Receipt sample.jpg');
    if (fs.existsSync(sampleReceiptPath)) {
      console.log(`${colors.blue}Testing upload of sample receipt image...${colors.reset}`);
      
      const fileContent = fs.readFileSync(sampleReceiptPath);
      const receiptFileName = `sample-receipt-${timestamp}.jpg`;
      
      const { data: receiptUploadData, error: receiptUploadError } = await supabase.storage
        .from(bucketName)
        .upload(receiptFileName, fileContent, {
          contentType: 'image/jpeg',
          upsert: true
        });
      
      if (receiptUploadError) {
        console.error(`${colors.red}Error uploading sample receipt: ${receiptUploadError.message}${colors.reset}`);
      } else {
        console.log(`${colors.green}✓ Successfully uploaded sample receipt image${colors.reset}`);
        
        // Get public URL for the uploaded receipt
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(receiptFileName);
        
        if (publicUrlData?.publicUrl) {
          console.log(`${colors.blue}Public URL: ${publicUrlData.publicUrl}${colors.reset}`);
        }
      }
    }
    
    // Clean up test files
    console.log(`${colors.blue}Cleaning up test files...${colors.reset}`);
    
    const filesToDelete = [testFileName];
    if (fs.existsSync(sampleReceiptPath)) {
      filesToDelete.push(`sample-receipt-${timestamp}.jpg`);
    }
    
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove(filesToDelete);
    
    if (deleteError) {
      console.error(`${colors.yellow}Warning: Could not delete test files: ${deleteError.message}${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ Successfully cleaned up test files${colors.reset}`);
    }
    
    // Final verification result
    console.log(`\n${colors.green}=== VERIFICATION SUCCESSFUL ===${colors.reset}`);
    console.log(`${colors.green}The 'expenses-receipts' bucket exists and is working correctly.${colors.reset}`);
    console.log(`${colors.green}File uploads to this bucket are functioning as expected.${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Unexpected error during verification:${colors.reset}`, error);
    console.log(`\n${colors.red}=== VERIFICATION FAILED ===${colors.reset}`);
  }
}

// Run the verification
verifyReceiptUpload();
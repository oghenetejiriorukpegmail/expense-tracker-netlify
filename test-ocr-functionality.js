/**
 * test-ocr-functionality.js
 * 
 * This script tests the OCR receipt processing functionality by:
 * 1. Uploading a receipt image to the 'expenses-receipts' bucket
 * 2. Creating a background task for OCR processing
 * 3. Processing the receipt with OCR
 * 4. Verifying the background task is updated correctly
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
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

async function testOcrFunctionality() {
  console.log(`${colors.cyan}=== OCR Receipt Processing Functionality Test ====${colors.reset}\n`);
  
  try {
    // Get environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    
    // Check if environment variables are set
    if (!supabaseUrl || !supabaseKey) {
      console.error(`${colors.red}Error: Supabase URL or key not configured in .env file${colors.reset}`);
      return;
    }
    
    console.log(`${colors.blue}Connecting to Supabase...${colors.reset}`);
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Target bucket name
    const bucketName = 'expenses-receipts';
    
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
    const receiptFileName = `test-receipt-${timestamp}.jpg`;
    
    console.log(`${colors.blue}Uploading receipt to Supabase storage...${colors.reset}`);
    
    // Upload the receipt to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(`test/${receiptFileName}`, fileContent, {
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
      .getPublicUrl(`test/${receiptFileName}`);
    
    if (publicUrlData?.publicUrl) {
      console.log(`${colors.blue}Public URL: ${publicUrlData.publicUrl}${colors.reset}`);
    }
    
    // Now let's check if the background_tasks table exists
    console.log(`${colors.blue}Checking if background_tasks table exists...${colors.reset}`);
    
    const { data: pgClient } = await supabase.rpc('get_pg_client');
    const { data: tableExists, error: tableError } = await supabase.rpc('check_table_exists', {
      table_name: 'background_tasks'
    });
    
    if (tableError) {
      console.error(`${colors.red}Error checking if background_tasks table exists: ${tableError.message}${colors.reset}`);
      // Continue anyway, as we'll test the OCR functionality directly
    } else {
      console.log(`${colors.green}✓ background_tasks table exists: ${tableExists}${colors.reset}`);
    }
    
    // Now let's test the OCR functionality by calling the API
    console.log(`${colors.blue}Testing OCR functionality via API...${colors.reset}`);
    console.log(`${colors.blue}This part would normally be done through the application UI.${colors.reset}`);
    console.log(`${colors.blue}For testing purposes, we'll simulate the API call directly.${colors.reset}`);
    
    // Create a form data object with the receipt file
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('receipt', fileContent, {
      filename: receiptFileName,
      contentType: 'image/jpeg'
    });
    
    try {
      // Make a POST request to the OCR API endpoint
      const response = await axios.post(`${apiBaseUrl}/api/ocr/process`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${supabaseKey}` // This is just for testing
        }
      });
      
      console.log(`${colors.green}✓ OCR API response received${colors.reset}`);
      console.log(`${colors.blue}Response status: ${response.status}${colors.reset}`);
      console.log(`${colors.blue}Response data:${colors.reset}`, JSON.stringify(response.data, null, 2));
      
      // Check if the OCR was successful
      if (response.data.success) {
        console.log(`${colors.green}✓ OCR processing was successful${colors.reset}`);
        
        // Check if a background task was created
        if (response.data.task_id) {
          console.log(`${colors.green}✓ Background task was created with ID: ${response.data.task_id}${colors.reset}`);
          
          // Get the background task details
          try {
            const taskResponse = await axios.get(`${apiBaseUrl}/api/background-tasks/${response.data.task_id}`, {
              headers: {
                'Authorization': `Bearer ${supabaseKey}` // This is just for testing
              }
            });
            
            console.log(`${colors.green}✓ Background task details retrieved${colors.reset}`);
            console.log(`${colors.blue}Task status: ${taskResponse.data.status}${colors.reset}`);
            console.log(`${colors.blue}Task result:${colors.reset}`, JSON.stringify(taskResponse.data.result, null, 2));
          } catch (taskError) {
            console.error(`${colors.red}Error retrieving background task details: ${taskError.message}${colors.reset}`);
          }
        } else {
          console.log(`${colors.yellow}⚠ No background task ID was returned in the response${colors.reset}`);
        }
        
        // Check the OCR results
        if (response.data.ocr_result) {
          console.log(`${colors.green}✓ OCR results were returned${colors.reset}`);
          console.log(`${colors.blue}Extracted text:${colors.reset}`, response.data.ocr_result.text);
          console.log(`${colors.blue}Extracted data:${colors.reset}`);
          console.log(`  Vendor: ${response.data.ocr_result.vendor}`);
          console.log(`  Date: ${response.data.ocr_result.date}`);
          console.log(`  Total: ${response.data.ocr_result.total}`);
          console.log(`  Currency: ${response.data.ocr_result.currency}`);
          
          if (response.data.ocr_result.items && response.data.ocr_result.items.length > 0) {
            console.log(`  Items:`);
            response.data.ocr_result.items.forEach((item, index) => {
              console.log(`    ${index + 1}. ${item.description}: ${item.amount}`);
            });
          }
        } else {
          console.log(`${colors.yellow}⚠ No OCR results were returned in the response${colors.reset}`);
        }
      } else {
        console.error(`${colors.red}OCR processing failed: ${response.data.error || 'Unknown error'}${colors.reset}`);
      }
    } catch (apiError) {
      console.error(`${colors.red}Error calling OCR API: ${apiError.message}${colors.reset}`);
      if (apiError.response) {
        console.error(`${colors.red}Response status: ${apiError.response.status}${colors.reset}`);
        console.error(`${colors.red}Response data:${colors.reset}`, JSON.stringify(apiError.response.data, null, 2));
      }
    }
    
    // Clean up the test file
    console.log(`${colors.blue}Cleaning up test file...${colors.reset}`);
    
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([`test/${receiptFileName}`]);
    
    if (deleteError) {
      console.error(`${colors.yellow}Warning: Could not delete test file: ${deleteError.message}${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ Successfully cleaned up test file${colors.reset}`);
    }
    
    console.log(`\n${colors.green}=== OCR Receipt Processing Test Complete ===${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Unexpected error during testing:${colors.reset}`, error);
    console.log(`\n${colors.red}=== OCR Receipt Processing Test Failed ===${colors.reset}`);
  }
}

// Run the test
testOcrFunctionality();
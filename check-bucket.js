// Script to check Supabase bucket configuration
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // Load environment variables from .env file

async function checkBucketConfiguration() {
  try {
    // Get environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const configuredBucketName = process.env.SUPABASE_BUCKET_NAME;
    
    console.log('Environment configuration:');
    console.log(`- SUPABASE_URL: ${supabaseUrl ? 'Set' : 'Not set'}`);
    console.log(`- SUPABASE_SERVICE_KEY: ${supabaseKey ? 'Set' : 'Not set'}`);
    console.log(`- SUPABASE_BUCKET_NAME: ${configuredBucketName || 'Not set'}`);
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Error: Supabase URL or key not configured');
      return;
    }
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check for hardcoded bucket names in the code
    const hardcodedBucketName = 'expenses-receipts';
    const fallbackBucketName = 'receipts';
    
    console.log('\nChecking buckets:');
    
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    console.log('Available buckets:');
    if (buckets && buckets.length > 0) {
      buckets.forEach(bucket => {
        console.log(`- ${bucket.name}`);
      });
    } else {
      console.log('No buckets found');
    }
    
    // Check if the hardcoded bucket exists
    const hardcodedBucketExists = buckets?.some(b => b.name === hardcodedBucketName);
    console.log(`\nHardcoded bucket 'expenses-receipts' exists: ${hardcodedBucketExists ? 'Yes' : 'No'}`);
    
    // Check if the fallback bucket exists
    const fallbackBucketExists = buckets?.some(b => b.name === fallbackBucketName);
    console.log(`Fallback bucket 'receipts' exists: ${fallbackBucketExists ? 'Yes' : 'No'}`);
    
    // Check if the configured bucket exists
    if (configuredBucketName) {
      const configuredBucketExists = buckets?.some(b => b.name === configuredBucketName);
      console.log(`Configured bucket '${configuredBucketName}' exists: ${configuredBucketExists ? 'Yes' : 'No'}`);
    }
    
    console.log('\nDiagnosis:');
    if (!hardcodedBucketExists) {
      console.log(`- The hardcoded bucket 'expenses-receipts' does not exist in Supabase.`);
      console.log(`- This is likely causing the 'Bucket not found' error when uploading files.`);
      
      if (fallbackBucketExists) {
        console.log(`- The fallback bucket 'receipts' exists, but the compiled code is not using it.`);
        console.log(`- There appears to be a mismatch between the source code and compiled code.`);
      }
    }
  } catch (error) {
    console.error('Error checking bucket configuration:', error);
  }
}

checkBucketConfiguration();
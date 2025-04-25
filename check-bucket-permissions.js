// Script to check Supabase bucket configuration and permissions
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // Load environment variables from .env file

async function checkBucketPermissions() {
  try {
    // Get environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const configuredBucketName = process.env.SUPABASE_BUCKET_NAME;
    
    console.log('Environment configuration:');
    console.log(`- SUPABASE_URL: ${supabaseUrl || 'Not set'}`);
    console.log(`- SUPABASE_SERVICE_KEY: ${supabaseKey ? (supabaseKey.substring(0, 10) + '...') : 'Not set'}`);
    console.log(`- SUPABASE_BUCKET_NAME: ${configuredBucketName || 'Not set'}`);
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Error: Supabase URL or key not configured');
      return;
    }
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check for hardcoded bucket names in the code
    const hardcodedBucketName = 'expenses-receipts';
    
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
        console.log(`- ${bucket.name} (id: ${bucket.id})`);
      });
    } else {
      console.log('No buckets found');
    }
    
    // Check if the hardcoded bucket exists
    const hardcodedBucket = buckets?.find(b => b.name === hardcodedBucketName);
    const hardcodedBucketExists = !!hardcodedBucket;
    console.log(`\nHardcoded bucket '${hardcodedBucketName}' exists: ${hardcodedBucketExists ? 'Yes' : 'No'}`);
    
    if (hardcodedBucketExists) {
      console.log(`Bucket details: ${JSON.stringify(hardcodedBucket, null, 2)}`);
      
      // Test permission by trying to list files in the bucket
      console.log(`\nTesting permissions for bucket '${hardcodedBucketName}':`);
      const { data: files, error: listFilesError } = await supabase.storage
        .from(hardcodedBucketName)
        .list();
      
      if (listFilesError) {
        console.error(`Error listing files in bucket '${hardcodedBucketName}':`, listFilesError);
        console.log(`This suggests a permission issue with the bucket.`);
      } else {
        console.log(`Successfully listed files in bucket '${hardcodedBucketName}'.`);
        console.log(`Files count: ${files?.length || 0}`);
      }
      
      // Test uploading a small test file
      console.log(`\nTesting file upload to bucket '${hardcodedBucketName}':`);
      const testContent = Buffer.from('test content');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(hardcodedBucketName)
        .upload('test-file.txt', testContent, {
          contentType: 'text/plain',
          upsert: true
        });
      
      if (uploadError) {
        console.error(`Error uploading test file to bucket '${hardcodedBucketName}':`, uploadError);
        console.log(`This suggests an issue with upload permissions.`);
      } else {
        console.log(`Successfully uploaded test file to bucket '${hardcodedBucketName}'.`);
        console.log(`Upload result: ${JSON.stringify(uploadData, null, 2)}`);
        
        // Clean up the test file
        const { error: deleteError } = await supabase.storage
          .from(hardcodedBucketName)
          .remove(['test-file.txt']);
        
        if (deleteError) {
          console.error(`Error deleting test file:`, deleteError);
        } else {
          console.log(`Successfully deleted test file.`);
        }
      }
    }
    
    // Check project reference in the URL
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    console.log(`\nProject reference in URL: ${projectRef || 'Not found'}`);
    
    // Check if the error might be related to case sensitivity
    if (hardcodedBucketExists) {
      const lowerCaseBucket = buckets?.find(b => b.name.toLowerCase() === hardcodedBucketName.toLowerCase() && b.name !== hardcodedBucketName);
      if (lowerCaseBucket) {
        console.log(`\nFound a bucket with case-insensitive match: ${lowerCaseBucket.name}`);
        console.log(`This might cause issues if the code is case-sensitive.`);
      }
    }
    
    console.log('\nDiagnosis:');
    if (!hardcodedBucketExists) {
      console.log(`- The hardcoded bucket '${hardcodedBucketName}' does not exist in Supabase.`);
      console.log(`- This is likely causing the 'Bucket not found' error when uploading files.`);
    } else if (hardcodedBucketExists) {
      console.log(`- The hardcoded bucket '${hardcodedBucketName}' exists in Supabase.`);
      console.log(`- If you're still seeing 'Bucket not found' errors, it might be due to:`);
      console.log(`  1. Permission issues with the Supabase service key`);
      console.log(`  2. Region/project mismatch between the code and Supabase`);
      console.log(`  3. Case sensitivity issues with the bucket name`);
    }
  } catch (error) {
    console.error('Error checking bucket configuration:', error);
  }
}

checkBucketPermissions();
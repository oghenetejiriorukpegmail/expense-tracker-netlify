# Receipt Upload Verification

This document provides instructions on how to verify that the 'expenses-receipts' bucket in Supabase is correctly configured and working for file uploads.

## Background

The expense tracker application was experiencing an issue where file uploads were failing because the code was trying to upload files to a bucket named 'expenses-receipts' (plural form), but the Supabase project only had buckets named 'expenses' and 'expense-receipts' (singular form).

The solution was to create a new bucket in Supabase with the exact name 'expenses-receipts' to match what the code is expecting.

## Verification Script

The `verify-receipt-upload.js` script has been created to help you verify that the solution works correctly. This script:

1. Connects to your Supabase project
2. Checks if the 'expenses-receipts' bucket exists
3. Attempts to upload a test file to the bucket
4. Attempts to upload a sample receipt image (if available)
5. Verifies that the uploads were successful
6. Cleans up the test files
7. Provides clear success/failure messages

## Prerequisites

Before running the verification script, ensure you have:

1. Node.js installed on your system
2. A `.env` file in the project root with the following variables:
   ```
   SUPABASE_URL=your-supabase-project-url
   SUPABASE_SERVICE_KEY=your-supabase-service-key
   ```

## Running the Verification Script

To run the verification script:

1. Open a terminal in the project root directory
2. Run the following command:
   ```
   node verify-receipt-upload.js
   ```

## Interpreting the Results

### Successful Verification

If the verification is successful, you will see:

```
=== VERIFICATION SUCCESSFUL ===
The 'expenses-receipts' bucket exists and is working correctly.
File uploads to this bucket are functioning as expected.
```

This confirms that:
- The 'expenses-receipts' bucket exists in your Supabase project
- Your application has the necessary permissions to upload files to this bucket
- The file upload functionality is working correctly

### Failed Verification

If the verification fails, the script will provide specific error messages and possible causes:

1. **Bucket does not exist**:
   ```
   Error: Bucket 'expenses-receipts' does not exist in Supabase
   ```
   Solution: Follow the instructions to create the bucket in your Supabase dashboard.

2. **Upload permission issues**:
   ```
   Error uploading test file: [error message]
   ```
   Possible causes include insufficient permissions, storage quota exceeded, or bucket policy restrictions.

3. **Connection issues**:
   ```
   Error listing buckets: [error message]
   ```
   Check your Supabase URL and service key in the `.env` file.

## Next Steps

After successful verification:

1. Test the actual application to ensure that receipt uploads are working correctly
2. Monitor the application logs for any related errors
3. Consider implementing additional error handling in the application code to better handle bucket-related issues in the future

## Troubleshooting

If you encounter issues with the verification script:

1. Check that your `.env` file contains the correct Supabase URL and service key
2. Ensure that your Supabase service key has the necessary permissions for storage operations
3. Verify that the 'expenses-receipts' bucket exists in your Supabase project
4. Check your network connection to ensure you can reach the Supabase API
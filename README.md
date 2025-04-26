# Git File Removal Guide

## Scenarios for Removing Files in Git

### 1. Remove a File from Git Repository and Local Filesystem
```bash
# Remove file from Git tracking and delete from filesystem
git rm <filename>

# Example
git rm README.txt
```
- This command removes the file from Git version control
- The file is also deleted from your local filesystem
- Changes are staged and ready to be committed

### 2. Remove a File from Git Repository (Keep in Local Filesystem)
```bash
# Remove file from Git tracking but keep in local filesystem
git rm --cached <filename>

# Example
git rm --cached sensitive-config.json
```
- The file is removed from Git tracking
- The file remains in your local filesystem
- Useful for files you don't want to track anymore but want to keep locally

### 3. Remove Multiple Files at Once
```bash
# Remove multiple specific files
git rm <file1> <file2> <file3>

# Remove files using a pattern
git rm *.log
git rm docs/*.txt
```
- You can specify multiple files or use wildcard patterns
- Removes files from both Git tracking and local filesystem

### 4. Remove Files Using Pattern Matching
```bash
# Remove all .log files in the project
git rm **/*.log

# Remove all temporary files
git rm **/*~
```
- Use double asterisk (**) for recursive pattern matching
- Matches files in all subdirectories
- Useful for removing multiple files across the entire project

### Important Notes
- Always commit your changes after using `git rm`
- Use `git rm --cached` if you want to stop tracking a file without deleting it
- Be careful with pattern matching to avoid accidentally removing important files

### Recovering Removed Files
```bash
# If file was just removed and not committed
git checkout -- <filename>

# If file was already committed
git checkout <commit-hash> -- <filename>
```
- Checkout can help recover recently removed files
- Specify the commit hash to retrieve a file from a previous state

### Best Practices
1. Review files before removal
2. Use `--cached` for sensitive or configuration files
3. Commit removals promptly
4. Use `.gitignore` to prevent tracking unwanted files
=======
# Expense Tracker MVP with Supabase

A full-stack expense tracking application built with:

- **Authentication**: Clerk for user authentication
- **Database/Storage**: Supabase for database and file storage
- **OCR**: AI-powered receipt scanning and data extraction
- **Export**: CSV and Excel export capabilities
- **Deployment**: Optimized for Netlify serverless functions

## Features

- User authentication with Clerk
- Expense tracking with receipt uploads
- OCR processing for automatic data extraction
- Trip organization
- Mileage tracking
- Data export to CSV/Excel
- Responsive UI

## Recent Updates

- Fixed authentication middleware for Netlify deployment
- Improved error handling
- Standardized authentication flow across all API routes
- Fixed Clerk publishable key configuration for Netlify environment
- Added automatic user creation for new Clerk users
- Fixed sign-in/sign-up page routing and redirection
- Fixed authentication redirect after successful sign-in
- Implemented `AuthCallbackHandler` component to correctly handle Clerk authentication sub-paths (e.g., SSO, MFA)
- Enhanced auth callback handling to support all Clerk SSO paths and fallback redirects
- Updated Clerk redirect configuration with proper appearance settings and redirect URLs
- Fixed social authentication (Google) sign-in and sign-up flows
- Added comprehensive support for all Clerk authentication paths including OAuth callbacks

## Clerk Webhook Integration

The application uses Clerk webhooks to synchronize user data between Clerk and Supabase. This integration ensures that user information stays consistent across both systems.

### How It Works

1. **Webhook Setup**: Clerk sends events (user created, updated, deleted) to our Netlify serverless function endpoint.
2. **Event Processing**: The webhook handler validates the event signature and processes the payload.
3. **Database Synchronization**: User data is created, updated, or deleted in Supabase based on the event type.

### Implementation Details

- Direct database connection in the webhook handler to avoid dependency issues
- Idempotent operations to prevent duplicate user records
- Transaction-based deletion to maintain data consistency
- Comprehensive error handling with detailed logging

### Troubleshooting

If you encounter issues with the Clerk webhook integration:

1. **Webhook Not Firing**: Verify webhook configuration in the Clerk dashboard and check that the endpoint URL is correct.
2. **Signature Verification Errors**: Ensure the `CLERK_WEBHOOK_SIGNING_SECRET` environment variable is correctly set.
3. **Database Connection Issues**: Confirm the `DATABASE_URL` environment variable is properly configured.
4. **Missing User Data**: Check the Netlify function logs for detailed error messages.

For detailed logs, run: `netlify functions:invoke clerk-webhook --no-identity`
>>>>>>> 1cb62c7b4090e715f43edfce0160326cb5aa345f

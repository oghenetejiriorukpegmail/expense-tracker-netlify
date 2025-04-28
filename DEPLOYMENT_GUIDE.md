# Expense Tracker Deployment Guide

This guide explains how to deploy the Expense Tracker application to Netlify. The application has been migrated from a React frontend with Clerk authentication to a SvelteKit frontend with Firebase authentication, while maintaining the Supabase database backend.

## Architecture Overview

The Expense Tracker application consists of:

1. **Frontend**: SvelteKit application with Firebase Authentication
2. **Backend**: 
   - SvelteKit API routes for server-side logic
   - Netlify Functions for specific operations (OCR, webhooks, etc.)
3. **Database**: PostgreSQL database hosted on Supabase
4. **Storage**: Supabase Storage for file uploads (receipts, etc.)

## Prerequisites

- Node.js v18 or later
- npm v9 or later
- A Supabase account and project
- A Firebase project with Authentication enabled
- A Netlify account

## Configuration Files

The application uses the following configuration files:

- `netlify.toml`: Netlify deployment configuration
- `expense-tracker-svelte/.env`: Environment variables for the SvelteKit app
- `expense-tracker-svelte/svelte.config.js`: SvelteKit configuration with Netlify adapter

## Environment Variables

The following environment variables need to be set in Netlify:

### Firebase Authentication
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### Database Configuration (Supabase PostgreSQL)
- `DATABASE_URL`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_SSL`

### Other Configuration
- `NODE_ENV`

## Deployment Steps

### Local Testing

1. Ensure all environment variables are set in `expense-tracker-svelte/.env`
2. Run the deployment script:
   ```powershell
   .\deploy-to-netlify.ps1
   ```
3. Test the application locally

### Deploying to Netlify

#### Option 1: Using Netlify CLI

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```bash
   netlify login
   ```

3. Initialize the site:
   ```bash
   netlify init
   ```

4. Deploy:
   ```bash
   netlify deploy --prod
   ```

#### Option 2: Using Netlify UI

1. Go to [Netlify](https://app.netlify.com)
2. Create a new site from Git
3. Connect to your GitHub repository
4. Configure build settings:
   - Build command: `cd expense-tracker-svelte && npm install && npm run build`
   - Publish directory: `expense-tracker-svelte/build`
5. Set up environment variables in the Netlify dashboard

## Netlify Functions

The application uses several Netlify Functions:

- `api.ts`: Main API endpoint that handles server-side logic
- `clerk-webhook.ts`: Handles Clerk authentication webhooks (legacy)
- `process-ocr.ts`: Processes receipt OCR
- `batch-upload.ts`: Handles batch uploads
- `export-expenses.ts`: Handles expense exports

## Migration Notes

The application has been migrated from:
- React frontend to SvelteKit
- Clerk authentication to Firebase Authentication
- Direct API calls to tRPC

The database remains on Supabase, and the existing Netlify Functions have been preserved for backward compatibility.

## Troubleshooting

### Build Failures

If the build fails, check:
1. Environment variables are correctly set
2. Dependencies are installed
3. SvelteKit adapter is correctly configured

### Authentication Issues

If authentication fails:
1. Verify Firebase configuration
2. Check browser console for errors
3. Ensure Firebase project has the correct authentication methods enabled

### Database Connection Issues

If database connection fails:
1. Verify Supabase credentials
2. Check network connectivity
3. Ensure database permissions are correctly set

## Maintenance

For future updates:
1. Update the SvelteKit application in the `expense-tracker-svelte` directory
2. Test locally using the deployment script
3. Deploy to Netlify using the same configuration
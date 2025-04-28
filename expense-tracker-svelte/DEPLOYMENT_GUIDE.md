# Expense Tracker Deployment Guide

This guide provides instructions for deploying the Expense Tracker application to Netlify.

## Prerequisites

- Node.js (v18 or later)
- npm (v8 or later)
- A Netlify account
- A Supabase account (for database)
- A Firebase account (for authentication, if used)
- A Clerk account (for authentication, if used)

## Environment Variables

Before deploying, you need to set up the following environment variables in your Netlify dashboard:

1. Go to your Netlify site dashboard
2. Navigate to Site settings > Build & deploy > Environment
3. Add the following environment variables (refer to `.env.example` for the complete list):

```
PUBLIC_SUPABASE_URL=your-supabase-url
PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
...
```

## Deployment Steps

### Option 1: Deploy via Netlify CLI

1. Install the Netlify CLI:
   ```
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```
   netlify login
   ```

3. Initialize your site:
   ```
   netlify init
   ```

4. Deploy your site:
   ```
   netlify deploy --prod
   ```

### Option 2: Deploy via GitHub Integration

1. Push your code to a GitHub repository
2. Log in to your Netlify account
3. Click "New site from Git"
4. Select GitHub and authorize Netlify
5. Select your repository
6. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.svelte-kit/output`
7. Click "Deploy site"

## Netlify Configuration

The `netlify.toml` file in the root directory contains the configuration for the Netlify deployment:

- Build settings
- Redirect rules
- Environment variables
- Function settings
- Security headers

## Netlify Functions

The application uses Netlify Functions for server-side operations:

- `/netlify/functions/api.ts`: Main API endpoint for tRPC
- `/netlify/functions/clerk-webhook.ts`: Webhook handler for Clerk authentication
- `/netlify/functions/batch-upload.ts`: Handles batch uploads
- `/netlify/functions/export-expenses.ts`: Handles expense exports
- `/netlify/functions/process-ocr.ts`: Processes OCR for receipts

## Database Migrations

Before deploying, ensure that all database migrations have been applied to your Supabase instance:

1. Run migrations:
   ```
   npm run migrate
   ```

## Post-Deployment Verification

After deployment, verify the following:

1. The application loads correctly
2. Authentication works
3. Database connections are successful
4. File uploads work correctly
5. API endpoints are accessible
6. Netlify Functions are working

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check build logs in Netlify dashboard
   - Ensure all dependencies are installed
   - Verify environment variables are set correctly

2. **API Connection Issues**:
   - Check CORS settings in Supabase
   - Verify API URLs are correct
   - Check network requests in browser console

3. **Authentication Problems**:
   - Verify Firebase/Clerk configuration
   - Check authentication redirects
   - Ensure webhook secrets are set correctly

### Support

For additional support, refer to:
- [Netlify Documentation](https://docs.netlify.com/)
- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [Supabase Documentation](https://supabase.io/docs)

## Rollback Procedure

If you need to rollback to a previous version:

1. Go to your Netlify site dashboard
2. Navigate to Deploys
3. Find the previous working deploy
4. Click "Publish deploy"

## Monitoring

Monitor your application using:

1. Netlify Analytics
2. Supabase Dashboard
3. Firebase Console (if used)
4. Application logs in Netlify Functions
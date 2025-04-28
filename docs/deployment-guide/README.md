# Deployment Guide

This guide provides comprehensive instructions for deploying the Expense Tracker application to Netlify. It covers environment configuration, deployment steps, database migration, monitoring setup, and troubleshooting.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Environment Configuration](#environment-configuration)
4. [Netlify Deployment Steps](#netlify-deployment-steps)
5. [Database Migration](#database-migration)
6. [Monitoring Setup](#monitoring-setup)
7. [Troubleshooting](#troubleshooting)

## Architecture Overview

The Expense Tracker application follows a modern serverless architecture:

```mermaid
graph TD
    subgraph "Frontend"
        A[SvelteKit Application]
        B[Firebase Authentication]
    end

    subgraph "Backend"
        C[Netlify Functions]
        D[SvelteKit API Routes]
    end

    subgraph "Database"
        E[Supabase PostgreSQL]
        F[Supabase Storage]
    end

    A --> B
    A --> C
    A --> D
    C --> E
    C --> F
    D --> E
    D --> F
```

- **Frontend**: SvelteKit application with Firebase Authentication
- **Backend**:
  - SvelteKit API routes for server-side logic
  - Netlify Functions for specific operations (OCR, webhooks, etc.)
- **Database**: PostgreSQL database hosted on Supabase
- **Storage**: Supabase Storage for file uploads (receipts, etc.)

## Prerequisites

Before deploying the application, ensure you have:

- **Node.js**: v18 or later
- **npm**: v9 or later
- **Git**: For version control
- **Accounts**:
  - Supabase account with a project set up
  - Firebase project with Authentication enabled
  - Netlify account

## Environment Configuration

The application requires several environment variables to be configured in Netlify. These variables are essential for connecting to various services and configuring the application behavior.

### Required Environment Variables

#### Firebase Authentication

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | `AIzaSyC1a8pQ7Xyzx123456789` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | `your-project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `your-project-id.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | `123456789012` |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | `1:123456789012:web:abc123def456` |

#### Supabase Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://abcdefghijklm.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_ANON_KEY` | Supabase anon key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_BUCKET_NAME` | Supabase storage bucket name | `receipts` |

#### Database Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@db.abcdefghijklm.supabase.co:5432/postgres` |
| `POSTGRES_HOST` | PostgreSQL host | `db.abcdefghijklm.supabase.co` |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |
| `POSTGRES_DB` | PostgreSQL database name | `postgres` |
| `POSTGRES_USER` | PostgreSQL username | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `your-password` |
| `POSTGRES_SSL` | PostgreSQL SSL mode | `require` |

#### OCR Configuration (Optional)

| Variable | Description | Example |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | `your-gemini-api-key` |
| `OPENAI_API_KEY` | OpenAI API key | `your-openai-api-key` |
| `CLAUDE_API_KEY` | Anthropic Claude API key | `your-claude-api-key` |

#### Other Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Node environment | `production` |
| `PORT` | Port for local development | `3000` |

### Setting Environment Variables in Netlify

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** > **Environment variables**
3. Click **Add variable** and add each variable with its value
4. For sensitive variables, mark them as **Sensitive**
5. Click **Save**

## Netlify Deployment Steps

### Option 1: Using Netlify CLI (Recommended)

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Initialize the site** (if not already done):
   ```bash
   netlify init
   ```
   - Select "Create & configure a new site"
   - Choose your team
   - Enter a site name or leave blank for a random name

4. **Configure build settings**:
   ```bash
   netlify sites:create --name your-site-name
   netlify link
   ```

5. **Set up environment variables**:
   ```bash
   netlify env:import .env
   ```
   Or set them manually:
   ```bash
   netlify env:set KEY VALUE
   ```

6. **Deploy the site**:
   ```bash
   netlify deploy --build --prod
   ```

### Option 2: Using Netlify UI

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Connect to Netlify**:
   - Go to [Netlify](https://app.netlify.com)
   - Click "New site from Git"
   - Select GitHub and authorize Netlify
   - Select your repository

3. **Configure build settings**:
   - Build command: `npm run build`
   - Publish directory: `build`
   - Click "Show advanced" and add your environment variables

4. **Deploy the site**:
   - Click "Deploy site"
   - Wait for the build to complete

### Option 3: Using the Deployment Script

The repository includes a PowerShell deployment script that automates the deployment process:

```powershell
.\deploy-to-netlify.ps1
```

This script:
1. Builds the application
2. Runs any necessary pre-deployment tasks
3. Deploys to Netlify using the Netlify CLI

## Database Migration

When deploying updates that include database schema changes, you need to run migrations to update the database structure.

### Migration Process

1. **Create migration files** (if not already created):
   ```bash
   npm run migrate:create
   ```

2. **Test migrations locally**:
   ```bash
   npm run migrate:test
   ```

3. **Apply migrations in production**:
   - Option 1: Run migrations automatically during deployment:
     ```bash
     # In netlify.toml
     [build]
       command = "npm run build && npm run migrate:deploy"
     ```

   - Option 2: Run migrations manually after deployment:
     ```bash
     netlify functions:invoke migrate --no-identity
     ```

### Rollback Process

If a migration fails or causes issues:

1. **Identify the problematic migration**:
   ```bash
   npm run migrate:status
   ```

2. **Rollback to a specific migration**:
   ```bash
   npm run migrate:down -- --to <migration-id>
   ```

3. **Fix the migration file and redeploy**

## Monitoring Setup

Monitoring is essential for ensuring the application runs smoothly in production.

### Netlify Analytics

1. **Enable Netlify Analytics**:
   - Go to your site in the Netlify dashboard
   - Navigate to **Analytics**
   - Click **Enable Analytics**

2. **Monitor key metrics**:
   - Page views
   - Unique visitors
   - Bandwidth usage
   - Top pages
   - Error pages

### Error Tracking

1. **Set up error logging**:
   - The application logs errors to the console by default
   - Consider integrating with a service like Sentry for better error tracking

2. **Configure Sentry** (recommended):
   - Create a Sentry account and project
   - Add the Sentry SDK to the application
   - Set the `SENTRY_DSN` environment variable in Netlify

### Performance Monitoring

1. **Enable Netlify Edge Functions Analytics**:
   - Go to your site in the Netlify dashboard
   - Navigate to **Functions**
   - View function invocations, duration, and errors

2. **Set up custom monitoring**:
   - Add performance measurement code to critical paths
   - Log performance metrics to a monitoring service

### Database Monitoring

1. **Monitor Supabase usage**:
   - Go to your Supabase project dashboard
   - Navigate to **Reports**
   - Monitor database size, queries, and performance

2. **Set up alerts**:
   - Configure alerts for database usage thresholds
   - Monitor database connection errors

## Troubleshooting

### Common Deployment Issues

#### Build Failures

| Issue | Solution |
|-------|----------|
| **Missing dependencies** | Ensure all dependencies are correctly listed in `package.json` |
| **Node.js version mismatch** | Set the correct Node.js version in `netlify.toml` or `.nvmrc` |
| **Environment variables missing** | Check that all required environment variables are set in Netlify |
| **Build command errors** | Review the build logs for specific errors and fix them |

#### Runtime Errors

| Issue | Solution |
|-------|----------|
| **API connection failures** | Check environment variables for API endpoints and credentials |
| **Authentication issues** | Verify Firebase configuration and permissions |
| **Database connection errors** | Check database credentials and network access |
| **Function timeouts** | Optimize function code or increase timeout limits |

### Debugging Techniques

1. **Check Netlify function logs**:
   ```bash
   netlify functions:log
   ```

2. **Test functions locally**:
   ```bash
   netlify dev
   ```

3. **Verify environment variables**:
   ```bash
   netlify env:list
   ```

4. **Inspect build logs**:
   - Go to your site in the Netlify dashboard
   - Navigate to **Deploys**
   - Click on a deploy
   - Click **View summary**

### Recovery Procedures

1. **Rollback to a previous deploy**:
   - Go to your site in the Netlify dashboard
   - Navigate to **Deploys**
   - Find a working deploy
   - Click the three-dot menu and select **Publish deploy**

2. **Restore database from backup**:
   - Go to your Supabase project dashboard
   - Navigate to **Database**
   - Click **Backups**
   - Select a backup and restore

3. **Emergency fixes**:
   - Make critical fixes directly in the Netlify dashboard
   - Use the Netlify function editor for quick fixes
   - Deploy a hotfix branch for urgent issues

## Continuous Deployment

For a smooth continuous deployment workflow:

1. **Set up branch deploys**:
   - Configure Netlify to deploy preview branches
   - Test changes in isolation before merging to main

2. **Implement deployment checks**:
   - Add pre-deployment tests
   - Use build plugins for additional checks

3. **Automate database migrations**:
   - Include migration steps in the build process
   - Test migrations in a staging environment first

4. **Monitor deployments**:
   - Set up notifications for successful/failed deployments
   - Review deploy summaries regularly
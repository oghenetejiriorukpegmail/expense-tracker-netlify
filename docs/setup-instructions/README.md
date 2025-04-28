# Setup Instructions

This guide provides comprehensive instructions for setting up the Expense Tracker application for development, testing, and deployment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Environment Setup](#development-environment-setup)
3. [Database Setup](#database-setup)
4. [Firebase Authentication Setup](#firebase-authentication-setup)
5. [Environment Variables](#environment-variables)
6. [Running Locally](#running-locally)
7. [Testing Setup](#testing-setup)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v16.x or higher
- **npm**: v7.x or higher
- **Git**: For version control
- **PostgreSQL**: v13.x or higher (if running the database locally)
- **Modern web browser**: Chrome, Firefox, Safari, or Edge

You'll also need accounts for the following services:

- **Supabase**: For database and storage
- **Firebase**: For authentication
- **Netlify**: For deployment (optional for local development)

## Development Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/expense-tracker.git
cd expense-tracker
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..

# Install server dependencies
cd server
npm install
cd ..
```

### 3. Set Up Development Tools

The project uses several development tools that should be configured:

#### ESLint and Prettier

The project comes with pre-configured ESLint and Prettier settings. You can install the VSCode extensions for these tools for a better development experience:

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

#### TypeScript

The project uses TypeScript for type safety. Make sure your editor supports TypeScript or install the appropriate extension:

- [TypeScript VSCode Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-next)

## Database Setup

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign up or log in
2. Create a new project
3. Choose a name and password for your project
4. Select a region close to your users
5. Wait for the project to be created

### 2. Set Up Database Schema

The project includes migration files that will set up the database schema automatically. You'll run these migrations after configuring your environment variables.

### 3. Get Supabase Credentials

From your Supabase project dashboard:

1. Go to Project Settings > API
2. Copy the URL, anon key, and service role key
3. You'll need these for your environment variables

### 4. Configure Supabase Storage

1. In your Supabase dashboard, go to Storage
2. Create a new bucket called `receipts`
3. Set the bucket's privacy setting to "Authenticated users only"
4. Create appropriate policies for the bucket (see below)

#### Example Storage Policies

For the `receipts` bucket, create the following policies:

**Read Policy:**
```sql
(auth.uid() = owner) OR (auth.uid() IN (
  SELECT user_id FROM trip_members WHERE trip_id IN (
    SELECT trip_id FROM expenses WHERE receipt_path LIKE '%' || storage.filename(objects.name) || '%'
  )
))
```

**Insert Policy:**
```sql
auth.uid() = owner
```

**Update Policy:**
```sql
auth.uid() = owner
```

**Delete Policy:**
```sql
auth.uid() = owner
```

## Firebase Authentication Setup

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "Expense Tracker")
4. Choose whether to enable Google Analytics (recommended)
5. Accept the terms and click "Create project"
6. Wait for the project to be created, then click "Continue"

### 2. Set Up Firebase Authentication

1. In the Firebase Console, select your project
2. In the left sidebar, click "Authentication"
3. Click "Get started"
4. Enable the authentication methods you want to use:
   - Email/Password (required)
   - Google (recommended)
   - Other providers as needed
5. For each provider, follow the setup instructions provided by Firebase

### 3. Create a Web App in Firebase

1. In the Firebase Console, select your project
2. Click the web icon (</>) to add a web app
3. Enter a nickname for your app (e.g., "Expense Tracker Web")
4. Check "Also set up Firebase Hosting" if you plan to use Firebase Hosting
5. Click "Register app"
6. Copy the Firebase configuration object (you'll need this for your environment variables)

### 4. Generate a Firebase Admin SDK Service Account Key

1. In the Firebase Console, select your project
2. Click the gear icon next to "Project Overview" and select "Project settings"
3. Go to the "Service accounts" tab
4. Click "Generate new private key"
5. Save the JSON file securely (you'll need this for server-side authentication)

For more detailed instructions, refer to the [Firebase Authentication Setup Guide](../firebase-auth-setup.md).

## Environment Variables

Create a `.env` file in the root directory of the project with the following variables:

```
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/expense_tracker

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_BUCKET_NAME=receipts

# Firebase Configuration (Client-side)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Firebase Admin (Server-side)
# This should be a JSON string of your Firebase service account key
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your_project_id",...}

# OCR API Keys (Optional)
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
CLAUDE_API_KEY=your-claude-api-key
OPENROUTER_API_KEY=your-openrouter-api-key

# Node Environment
NODE_ENV=development

# Server Configuration
PORT=3000
```

Replace all placeholder values with your actual credentials.

## Running Locally

### 1. Run Database Migrations

```bash
npm run migrate
```

This will set up your database schema using the migration files in the `migrations` directory.

### 2. Start the Development Server

```bash
# Start the development server
npm run dev
```

This will start both the client and server in development mode. The application will be available at `http://localhost:3000`.

### 3. Access the Application

Open your browser and navigate to `http://localhost:3000`. You should see the Expense Tracker application running.

## Testing Setup

The project uses Vitest for unit tests and Playwright for end-to-end tests.

### Running Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm test -- --watch
```

### Running End-to-End Tests

```bash
# Install Playwright browsers
npx playwright install

# Run end-to-end tests
npm run test:e2e
```

### Test Database Setup

For testing, it's recommended to use a separate database to avoid affecting your development data. You can create a test database in Supabase and update your test environment variables accordingly.

Create a `.env.test` file with your test database configuration:

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/expense_tracker_test
SUPABASE_URL=https://your-test-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-test-supabase-service-key
SUPABASE_ANON_KEY=your-test-supabase-anon-key
```

## Troubleshooting

### Common Issues

#### Database Connection Issues

- Ensure your PostgreSQL server is running
- Verify your DATABASE_URL is correct
- Check that your Supabase credentials are valid

#### Authentication Issues

- Verify your Firebase configuration
- Ensure the authentication methods you want to use are enabled in Firebase
- Check that your environment variables are set correctly

#### Build Errors

- Make sure all dependencies are installed (`npm install`)
- Check for TypeScript errors (`npm run check`)
- Ensure your Node.js version is compatible (v16+)

### Getting Help

If you encounter issues not covered in this guide:

1. Check the project's GitHub issues to see if the problem has been reported
2. Consult the documentation for the specific technology causing the issue
3. Reach out to the project maintainers for assistance

## Next Steps

Once you have the application running locally, you might want to:

- Explore the [API Documentation](../api-documentation/README.md) to understand the available endpoints
- Review the [Development Guidelines](../development-guidelines/README.md) to learn about coding standards
- Check out the [User Guide](../user-guide/README.md) to understand the application's features
# Firebase Authentication Setup Guide

This guide will walk you through setting up Firebase Authentication for the Expense Tracker application.

## Prerequisites

- A Google account
- Node.js and npm installed
- The Expense Tracker application codebase

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "Expense Tracker")
4. Choose whether to enable Google Analytics (recommended)
5. Accept the terms and click "Create project"
6. Wait for the project to be created, then click "Continue"

## Step 2: Set Up Firebase Authentication

1. In the Firebase Console, select your project
2. In the left sidebar, click "Authentication"
3. Click "Get started"
4. Enable the authentication methods you want to use:
   - Email/Password (required)
   - Google (recommended)
   - Other providers as needed
5. For each provider, follow the setup instructions provided by Firebase

## Step 3: Create a Web App in Firebase

1. In the Firebase Console, select your project
2. Click the web icon (</>) to add a web app
3. Enter a nickname for your app (e.g., "Expense Tracker Web")
4. Check "Also set up Firebase Hosting" if you plan to use Firebase Hosting
5. Click "Register app"
6. Copy the Firebase configuration object (you'll need this later)

## Step 4: Generate a Firebase Admin SDK Service Account Key

1. In the Firebase Console, select your project
2. Click the gear icon next to "Project Overview" and select "Project settings"
3. Go to the "Service accounts" tab
4. Click "Generate new private key"
5. Save the JSON file securely (you'll need this for server-side authentication)

## Step 5: Configure Environment Variables

1. Create a `.env` file in the root of your project (or update your existing one)
2. Add the following Firebase-related environment variables:

```
# Firebase (Client-side)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin (Server-side)
# This should be a JSON string of your Firebase service account key
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your_project_id",...}
```

Replace the placeholder values with the actual values from your Firebase project.

For the `FIREBASE_SERVICE_ACCOUNT` variable, you need to convert the JSON file you downloaded into a single-line string. You can use a tool like [JSON Minifier](https://www.cleancss.com/json-minify/) to do this.

## Step 6: Install Firebase Dependencies

Run the following commands to install the required Firebase packages:

```bash
# Client-side Firebase
cd client
npm install firebase

# Server-side Firebase Admin
cd ..
npm install firebase-admin
```

## Step 7: Update Netlify Environment Variables

If you're deploying to Netlify, make sure to add all the Firebase environment variables to your Netlify site's environment variables:

1. Go to the Netlify dashboard
2. Select your site
3. Go to Site settings > Build & deploy > Environment
4. Add all the Firebase environment variables listed in Step 5

## Troubleshooting

- **Authentication not working**: Make sure your Firebase project has the correct authentication methods enabled and that your environment variables are set correctly.
- **Server-side authentication failing**: Check that your `FIREBASE_SERVICE_ACCOUNT` environment variable contains the complete service account JSON as a string.
- **CORS issues**: Ensure that your Firebase project's authentication settings allow requests from your application's domain.

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file in the root directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountString) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountString);
} catch (error) {
  console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:", error);
  throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not valid JSON.');
}

// Check if the app is already initialized to prevent errors during hot-reloading
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK initialized.');
} else {
  console.log('Firebase Admin SDK already initialized.');
}


export const adminAuth = admin.auth();
export default admin;
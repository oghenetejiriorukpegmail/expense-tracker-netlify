/**
 * Test Setup
 * 
 * This file sets up the testing environment for the application.
 * It includes:
 * - Environment configuration
 * - Test database setup
 * - Mock services
 * - Test utilities
 */

import { config } from 'dotenv';
import { join } from 'path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as schema from '../../shared/schema';
import { StorageFactory, StorageConfig } from '../storage/storage-factory';
import { createClient } from '@supabase/supabase-js';

// Load test environment variables
config({ path: join(__dirname, '../../.env.test') });

// Test database configuration
const TEST_DB_URL = process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/expense_tracker_test';
const TEST_SUPABASE_URL = process.env.TEST_SUPABASE_URL || 'http://localhost:54321';
const TEST_SUPABASE_KEY = process.env.TEST_SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.vI9obAHOGyVVKa3pD--kJlyxp-Z2zV9UUMAhKpNLAcU';
const TEST_BUCKET_NAME = 'test-receipts';

// Test storage factory
export const testStorageFactory = StorageFactory.getInstance();

// Test database client
let pgClient: postgres.Sql;
let db: ReturnType<typeof drizzle>;

// Test Supabase client
let supabase: ReturnType<typeof createClient>;

/**
 * Initialize the test environment
 */
export async function setupTestEnvironment() {
  console.log('Setting up test environment...');
  
  // Create database client
  pgClient = postgres(TEST_DB_URL, { max: 1 });
  db = drizzle(pgClient, { schema });
  
  // Create Supabase client
  supabase = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_KEY);
  
  // Run migrations
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: join(__dirname, '../../migrations') });
  
  // Create test bucket if it doesn't exist
  try {
    const { error } = await supabase.storage.createBucket(TEST_BUCKET_NAME, {
      public: false,
      fileSizeLimit: 1024 * 1024 * 10, // 10MB
    });
    
    if (error && error.message !== 'Bucket already exists') {
      console.error('Error creating test bucket:', error);
    }
  } catch (error) {
    console.error('Error creating test bucket:', error);
  }
  
  // Initialize test storage
  const storageConfig: StorageConfig = {
    provider: 'supabase',
    databaseUrl: TEST_DB_URL,
    supabaseUrl: TEST_SUPABASE_URL,
    supabaseServiceKey: TEST_SUPABASE_KEY,
    bucketName: TEST_BUCKET_NAME
  };
  
  await testStorageFactory.createStorage(storageConfig, 'test');
  
  console.log('Test environment setup complete');
}

/**
 * Clean up the test environment
 */
export async function teardownTestEnvironment() {
  console.log('Tearing down test environment...');
  
  // Clear all data from tables
  await db.delete(schema.mileageLogs);
  await db.delete(schema.expenses);
  await db.delete(schema.trips);
  await db.delete(schema.backgroundTasks);
  await db.delete(schema.users);
  
  // Clear test bucket
  try {
    const { data, error } = await supabase.storage.from(TEST_BUCKET_NAME).list();
    
    if (error) {
      console.error('Error listing files in test bucket:', error);
    } else if (data && data.length > 0) {
      const filesToDelete = data.map(file => file.name);
      await supabase.storage.from(TEST_BUCKET_NAME).remove(filesToDelete);
    }
  } catch (error) {
    console.error('Error clearing test bucket:', error);
  }
  
  // Close database connection
  await pgClient.end();
  
  // Clear storage factory
  testStorageFactory.clearStorage();
  
  console.log('Test environment teardown complete');
}

/**
 * Create a test user
 */
export async function createTestUser(overrides: Partial<schema.InsertUser> = {}) {
  const storage = testStorageFactory.getStorageOrThrow('test');
  
  const userData: schema.InsertUser = {
    username: `test-user-${Date.now()}`,
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: '555-123-4567',
    email: `test-${Date.now()}@example.com`,
    ...overrides
  };
  
  const user = await db.insert(schema.users).values(userData).returning();
  return user[0];
}

/**
 * Create a test trip
 */
export async function createTestTrip(userId: number, overrides: Partial<schema.InsertTrip> = {}) {
  const tripData: schema.InsertTrip & { userId: number } = {
    userId,
    name: `Test Trip ${Date.now()}`,
    description: 'Test trip description',
    ...overrides
  };
  
  const trip = await db.insert(schema.trips).values(tripData).returning();
  return trip[0];
}

/**
 * Create a test expense
 */
export async function createTestExpense(userId: number, tripName: string, overrides: Partial<schema.InsertExpense> = {}) {
  const today = new Date().toISOString().split('T')[0];
  
  const expenseData: schema.InsertExpense & { userId: number } = {
    userId,
    type: 'Food',
    date: today ? today : '2023-01-01', // Fallback date if split fails
    vendor: 'Test Vendor',
    location: 'Test Location',
    cost: '100.00',
    tripName,
    ...overrides
  };
  
  const expense = await db.insert(schema.expenses).values(expenseData).returning();
  return expense[0];
}

/**
 * Create a test mileage log
 */
export async function createTestMileageLog(userId: number, overrides: Partial<any> = {}) {
  // Use any type temporarily to avoid schema issues
  const logData = {
    userId,
    tripDate: new Date(),
    startOdometer: '1000',
    endOdometer: '1100',
    entryMethod: 'manual',
    calculatedDistance: '100',
    ...overrides
  };
  
  const log = await db.insert(schema.mileageLogs).values(logData).returning();
  return log[0];
}

/**
 * Create a test background task
 */
export async function createTestBackgroundTask(userId: number, overrides: Partial<schema.InsertBackgroundTask> = {}) {
  const taskData: schema.InsertBackgroundTask = {
    userId,
    type: 'receipt_ocr',
    status: 'pending',
    ...overrides
  };
  
  const task = await db.insert(schema.backgroundTasks).values(taskData).returning();
  return task[0];
}

/**
 * Upload a test file to storage
 */
export async function uploadTestFile(filePath: string, content: Buffer | string) {
  const buffer = typeof content === 'string' ? Buffer.from(content) : content;
  const contentType = filePath.endsWith('.pdf') ? 'application/pdf' : 
                      filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') ? 'image/jpeg' :
                      filePath.endsWith('.png') ? 'image/png' : 'application/octet-stream';
  
  const { data, error } = await supabase.storage
    .from(TEST_BUCKET_NAME)
    .upload(filePath, buffer, {
      contentType,
      upsert: true
    });
  
  if (error) {
    throw new Error(`Failed to upload test file: ${error.message}`);
  }
  
  return data;
}

/**
 * Generate a random string
 */
export function randomString(length = 10) {
  return Math.random().toString(36).substring(2, length + 2);
}

/**
 * Generate a random email
 */
export function randomEmail() {
  return `test-${randomString()}@example.com`;
}

/**
 * Generate a random date in the past year
 */
export function randomPastDate(daysAgo = 365) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
}

/**
 * Generate a random amount between min and max
 */
export function randomAmount(min = 1, max = 1000) {
  return (Math.random() * (max - min) + min).toFixed(2);
}
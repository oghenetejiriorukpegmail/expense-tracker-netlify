import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create a pool instance with Supabase configuration
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Function to execute a migration file
async function executeMigration(filePath: string): Promise<void> {
  try {
    const sql = fs.readFileSync(filePath, 'utf-8');
    await pool.query(sql);
    console.log(`Successfully executed migration: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`Failed to execute migration ${path.basename(filePath)}:`, error);
    throw error;
  }
}

// Function to get all migration files
function getMigrationFiles(): string[] {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  return fs
    .readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort()
    .map(file => path.join(migrationsDir, file));
}

// Function to create migrations table if it doesn't exist
async function createMigrationsTable(): Promise<void> {
  const sql = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(sql);
}

// Function to check if a migration has been executed
async function isMigrationExecuted(migrationName: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT COUNT(*) FROM migrations WHERE name = $1',
    [migrationName]
  );
  return parseInt(result.rows[0].count) > 0;
}

// Function to record a migration
async function recordMigration(migrationName: string): Promise<void> {
  await pool.query(
    'INSERT INTO migrations (name) VALUES ($1)',
    [migrationName]
  );
}

// Main migration function
export async function migrate(): Promise<void> {
  const client = await pool.connect();

  try {
    // Start transaction
    await client.query('BEGIN');

    // Create migrations table
    await createMigrationsTable();

    // Get all migration files
    const migrationFiles = getMigrationFiles();

    // Execute each migration that hasn't been run yet
    for (const filePath of migrationFiles) {
      const migrationName = path.basename(filePath);
      
      if (await isMigrationExecuted(migrationName)) {
        console.log(`Skipping already executed migration: ${migrationName}`);
        continue;
      }

      console.log(`Executing migration: ${migrationName}`);
      await executeMigration(filePath);
      await recordMigration(migrationName);
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log('All migrations completed successfully');
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    // Release client back to pool
    client.release();
    await pool.end();
  }
}

// Execute migrations if this file is run directly
if (require.main === module) {
  migrate().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}
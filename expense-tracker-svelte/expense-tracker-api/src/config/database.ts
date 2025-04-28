import { Pool, PoolConfig } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const {
  DATABASE_URL,
  POSTGRES_HOST = 'localhost',
  POSTGRES_PORT = '5432',
  POSTGRES_DB = 'postgres',
  POSTGRES_USER = 'postgres',
  POSTGRES_PASSWORD = 'postgres',
  POSTGRES_SSL = 'false',
  NODE_ENV = 'development'
} = process.env;

// Database configuration
const config: PoolConfig = DATABASE_URL
  ? {
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    }
  : {
      host: POSTGRES_HOST,
      port: parseInt(POSTGRES_PORT, 10),
      database: POSTGRES_DB,
      user: POSTGRES_USER,
      password: POSTGRES_PASSWORD,
      ssl: POSTGRES_SSL === 'true'
        ? {
            rejectUnauthorized: false
          }
        : undefined,
      // Connection pool configuration
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
      connectionTimeoutMillis: 2000 // How long to wait when connecting a new client
    };

// Create a singleton pool instance
class DatabasePool {
  private static instance: Pool;

  static getInstance(): Pool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new Pool(config);

      // Error handling
      DatabasePool.instance.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
        process.exit(-1);
      });

      // Log when pool connects
      DatabasePool.instance.on('connect', () => {
        console.log('New client connected to database');
      });
    }

    return DatabasePool.instance;
  }

  // Prevent creating instances
  private constructor() {}
}

// Function to test database connection
export async function testConnection(): Promise<void> {
  const pool = DatabasePool.getInstance();
  try {
    const client = await pool.connect();
    console.log('Successfully connected to database');
    client.release();
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
}

// Export the pool instance getter
export const getPool = DatabasePool.getInstance;

// Export a function to close the pool (useful for testing and graceful shutdown)
export async function closePool(): Promise<void> {
  const pool = DatabasePool.getInstance();
  await pool.end();
  console.log('Database pool closed');
}

// Initialize services that require database access
import { ExpenseService } from '../services/expense.service';

export function initializeServices() {
  const pool = getPool();
  return {
    expenseService: new ExpenseService(pool)
  };
}

// Export types
export type Services = ReturnType<typeof initializeServices>;
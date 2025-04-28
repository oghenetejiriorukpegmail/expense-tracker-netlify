import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { migrate } from '../src/migrate';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

async function setupDatabase() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('Successfully connected to Supabase database');

    // Run migrations
    await migrate();
    console.log('Migrations completed successfully');

    // Insert test data if in development environment
    if (process.env.NODE_ENV === 'development') {
      try {
        // Insert test user
        const userResult = await pool.query(
          `INSERT INTO users (id, email, username)
           VALUES ($1, $2, $3)
           ON CONFLICT (id) DO NOTHING
           RETURNING id`,
          [1, 'test@example.com', 'testuser']
        );

        if (userResult.rows.length > 0) {
          // Insert test expenses
          const testExpenses = [
            {
              amount: 50.00,
              currency: 'USD',
              date: new Date(),
              category: 'Food',
              description: 'Grocery shopping',
              location: 'Local Market',
              vendor: 'Whole Foods'
            },
            {
              amount: 25.00,
              currency: 'USD',
              date: new Date(),
              category: 'Transportation',
              description: 'Bus fare',
              location: 'Downtown',
              vendor: 'Transit Authority'
            },
            {
              amount: 100.00,
              currency: 'USD',
              date: new Date(),
              category: 'Entertainment',
              description: 'Movie tickets',
              location: 'Cinema',
              vendor: 'AMC Theaters'
            }
          ];

          for (const expense of testExpenses) {
            await pool.query(
              `INSERT INTO expenses (
                user_id,
                amount,
                currency,
                date,
                category,
                description,
                location,
                vendor
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                1, // Using the test user ID
                expense.amount,
                expense.currency,
                expense.date,
                expense.category,
                expense.description,
                expense.location,
                expense.vendor
              ]
            );
          }

          console.log('Test data inserted successfully');
        }
      } catch (error) {
        console.error('Error inserting test data:', error);
        // Don't throw here - test data is optional
      }
    }

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Database setup failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

export { setupDatabase };
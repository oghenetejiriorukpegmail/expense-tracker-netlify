import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

async function verifySetup() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Read and execute the verification queries
    const sqlPath = path.join(__dirname, 'verify-setup.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    // Split the SQL file into individual queries
    const queries = sql.split(';').filter(query => query.trim());
    
    // Execute each query
    for (let i = 0; i < queries.length; i++) {
      const result = await pool.query(queries[i]);
      
      if (i === 0) {
        console.log('\nExpenses Table Structure:');
        console.log('------------------------');
        result.rows.forEach(row => {
          console.log(`Column: ${row.column_name}`);
          console.log(`Type: ${row.data_type}`);
          console.log(`Nullable: ${row.is_nullable}`);
          console.log('------------------------');
        });
      } else if (i === 1) {
        console.log('\nTest Data:');
        console.log('------------------------');
        result.rows.forEach(row => {
          console.log(`ID: ${row.id}`);
          console.log(`User: ${row.email}`);
          console.log(`Amount: ${row.currency} ${row.amount}`);
          console.log(`Category: ${row.category}`);
          console.log(`Description: ${row.description}`);
          console.log(`Date: ${row.date}`);
          console.log('------------------------');
        });
      }
    }
  } catch (error) {
    console.error('Error verifying setup:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run verification if this file is executed directly
if (require.main === module) {
  verifySetup().catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
}
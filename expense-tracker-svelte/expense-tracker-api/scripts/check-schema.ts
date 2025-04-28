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

async function checkSchema() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Read and execute the schema check query
    const sqlPath = path.join(__dirname, 'check-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    const result = await pool.query(sql);

    // Print the results in a table format
    console.log('\nCurrent Database Schema:');
    console.log('------------------------');
    result.rows.forEach(row => {
      console.log(`Table: ${row.table_name}`);
      console.log(`Column: ${row.column_name}`);
      console.log(`Type: ${row.data_type}`);
      console.log(`Nullable: ${row.is_nullable}`);
      console.log('------------------------');
    });
  } catch (error) {
    console.error('Error checking schema:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run check if this file is executed directly
if (require.main === module) {
  checkSchema().catch(error => {
    console.error('Schema check failed:', error);
    process.exit(1);
  });
}
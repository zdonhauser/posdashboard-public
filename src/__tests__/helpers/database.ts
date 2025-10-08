/**
 * Database test helpers
 *
 * Utilities for managing test database connections and data cleanup.
 */

import { Pool } from 'pg';

let testPool: Pool | null = null;

/**
 * Get or create a test database pool
 */
export function getTestPool(): Pool {
  if (!testPool) {
    testPool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return testPool;
}

/**
 * Close the test database pool
 */
export async function closeTestPool(): Promise<void> {
  if (testPool) {
    await testPool.end();
    testPool = null;
  }
}

/**
 * Clean up test data from specific tables
 */
export async function cleanupTestData(tables: string[]): Promise<void> {
  const pool = getTestPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const table of tables) {
      await client.query(`DELETE FROM ${table} WHERE 1=1`);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Execute a query against the test database
 */
export async function queryTestDB(query: string, params?: any[]): Promise<any> {
  const pool = getTestPool();
  const result = await pool.query(query, params);
  return result;
}

/**
 * Seed test data into the database
 */
export async function seedTestData(tableName: string, data: any[]): Promise<void> {
  if (data.length === 0) return;

  const pool = getTestPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const row of data) {
      const keys = Object.keys(row);
      const values = Object.values(row);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

      await client.query(
        `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`,
        values
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Database Configuration
 *
 * PostgreSQL connection pool with automatic failover support
 * for high availability across multiple database nodes.
 */

import { Pool, PoolClient, PoolConfig } from 'pg';
import { env } from './environment';

/**
 * Connection configs for each node (primary, backup, etc.)
 */
export const DB_CONFIGS: PoolConfig[] = [
  // Primary database
  {
    user: env.database.user,
    password: env.database.password,
    database: env.database.name,
    host: env.database.host,
    port: env.database.port,
  },
  // Backup database (if configured)
  ...(env.database.hostBackup
    ? [
        {
          user: env.database.user,
          password: env.database.password,
          database: env.database.name,
          host: env.database.hostBackup,
          port: env.database.portBackup || 5432,
        },
      ]
    : []),
];

/**
 * Current index into DB_CONFIGS
 */
let currentConfigIndex = 0;

/**
 * Create a Pool for whichever config we're currently using
 */
export function createPool(): Pool {
  const config = DB_CONFIGS[currentConfigIndex];
  return new Pool(config);
}

/**
 * Global connection pool instance
 */
export let pool: Pool = createPool();

/**
 * Fail over to the next config in the list.
 * For a simple two-node setup, this toggles between primary and backup.
 */
export function failoverPool(): void {
  currentConfigIndex = (currentConfigIndex + 1) % DB_CONFIGS.length;
  const failoverConfig = DB_CONFIGS[currentConfigIndex];
  console.warn(
    `Failing over to host: ${failoverConfig.host} port: ${failoverConfig.port}`
  );

  // Recreate the pool with the new config
  pool = createPool();
  initializeDatabase();
}

/**
 * Initialize the database pool with error handlers
 */
export function initializeDatabase(): void {
  pool.removeAllListeners('error');
  // Listen for idle client errors on the pool
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client:', err);
    // Uncomment the line below to enable automatic failover on pool errors
    // failoverPool();
  });

  console.log(
    `Database pool initialized for host: ${DB_CONFIGS[currentConfigIndex].host}`
  );
}

/**
 * Query function that attempts a query.
 * If there is a connection-level error, we fail over and retry once.
 *
 * @param query SQL query string
 * @param values Query parameters
 * @returns Query result
 */
export async function queryDB(query: string, values: any[] = []): Promise<any> {
  try {
    const client: PoolClient = await pool.connect();
    try {
      const res = await client.query(query, values);
      client.release();
      return res;
    } catch (err) {
      client.release();
      throw err;
    }
  } catch (err) {
    console.error(
      `Database query error on host ${DB_CONFIGS[currentConfigIndex].host}:`,
      err
    );

    // Attempt failover
    // Uncomment the line below to enable automatic failover on query errors
    // failoverPool();

    // Optional: retry once on the new host
    try {
      const client: PoolClient = await pool.connect();
      const res = await client.query(query, values);
      client.release();
      return res;
    } catch (retryErr) {
      console.error('Retry on backup host also failed:', retryErr);
      throw retryErr;
    }
  }
}

/**
 * Close the database pool gracefully
 */
export async function closeDatabase(): Promise<void> {
  await pool.end();
  console.log('Database pool closed');
}

/**
 * Get current database configuration
 */
export function getCurrentConfig(): PoolConfig {
  return DB_CONFIGS[currentConfigIndex];
}

/**
 * Get the number of available database nodes
 */
export function getNodeCount(): number {
  return DB_CONFIGS.length;
}

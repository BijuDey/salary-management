import { openDatabase, runMigrations, type Database } from '../db/client.js';
import { upsertCountries } from '../seed/reference-data.js';

/**
 * A fresh in-memory database with the schema and reference data applied.
 * Each call is fully isolated, so tests can run in parallel without shared state.
 */
export function createTestDatabase(): Database {
  const { db } = openDatabase(':memory:');
  runMigrations(db);
  upsertCountries(db);
  return db;
}

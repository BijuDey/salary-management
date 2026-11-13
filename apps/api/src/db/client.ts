import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import BetterSqlite3 from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema.js';

export type Database = BetterSQLite3Database<typeof schema>;

export interface DatabaseHandle {
  db: Database;
  close: () => void;
}

const MIGRATIONS_FOLDER = fileURLToPath(new URL('../../drizzle', import.meta.url));

/**
 * Opens a SQLite database. Pass `':memory:'` for an isolated, throwaway database (used by tests).
 */
export function openDatabase(path: string): DatabaseHandle {
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true });
  }

  const sqlite = new BetterSqlite3(path);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  return {
    db: drizzle(sqlite, { schema }),
    close: () => sqlite.close(),
  };
}

export function runMigrations(db: Database): void {
  migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
}

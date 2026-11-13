import { count } from 'drizzle-orm';
import type { Database } from '../db/client.js';
import { employees, salaryChanges } from '../db/schema.js';
import { generateEmployees } from './employee-generator.js';
import { upsertCountries } from './reference-data.js';

/** Rows per INSERT statement, comfortably below SQLite's bound-parameter limit. */
const BATCH_SIZE = 500;

export interface SeedOptions {
  count: number;
  seed?: number;
}

/**
 * Replaces all employee data with a freshly generated, deterministic data set.
 * Runs in a single transaction: the database is never left half-seeded.
 */
export function seedDatabase(db: Database, options: SeedOptions): void {
  const generated = generateEmployees(options);

  db.transaction((tx) => {
    tx.delete(salaryChanges).run();
    tx.delete(employees).run();
    upsertCountries(tx);

    for (const batch of chunk(generated, BATCH_SIZE)) {
      tx.insert(employees)
        .values(batch.map((item) => item.employee))
        .run();
      tx.insert(salaryChanges)
        .values(batch.flatMap((item) => item.salaryHistory))
        .run();
    }
  });
}

export function countEmployees(db: Database): number {
  return db.select({ value: count() }).from(employees).get()?.value ?? 0;
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

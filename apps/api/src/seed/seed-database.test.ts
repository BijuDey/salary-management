import { count } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { salaryChanges } from '../db/schema.js';
import { createTestDatabase } from '../test-utils/database.js';
import { countEmployees, seedDatabase } from './seed-database.js';

describe('seedDatabase', () => {
  it('inserts employees with their salary history', () => {
    const db = createTestDatabase();

    seedDatabase(db, { count: 1_200 });

    expect(countEmployees(db)).toBe(1_200);
    const historyRows = db.select({ value: count() }).from(salaryChanges).get()?.value ?? 0;
    expect(historyRows).toBeGreaterThanOrEqual(1_200);
  });

  it('replaces existing data instead of appending to it', () => {
    const db = createTestDatabase();

    seedDatabase(db, { count: 300 });
    seedDatabase(db, { count: 100 });

    expect(countEmployees(db)).toBe(100);
  });
});

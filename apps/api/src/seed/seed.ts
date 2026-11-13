/**
 * Seeds the database with generated employees.
 *
 *   pnpm db:seed                    # replace all data with 10,000 employees
 *   pnpm db:seed --count=500        # custom size
 *   pnpm db:seed --if-empty         # only seed a fresh database (safe on every deploy)
 */
import { parseArgs } from 'node:util';
import { loadConfig } from '../config.js';
import { openDatabase, runMigrations } from '../db/client.js';
import { countEmployees, seedDatabase } from './seed-database.js';

const DEFAULT_EMPLOYEE_COUNT = 10_000;

const { values: args } = parseArgs({
  options: {
    count: { type: 'string', default: String(DEFAULT_EMPLOYEE_COUNT) },
    seed: { type: 'string', default: '42' },
    'if-empty': { type: 'boolean', default: false },
  },
});

const config = loadConfig();
const { db, close } = openDatabase(config.DATABASE_PATH);

try {
  runMigrations(db);

  const existing = countEmployees(db);
  if (args['if-empty'] && existing > 0) {
    console.log(`Skipping seed: database already has ${existing} employees.`);
  } else {
    const startedAt = performance.now();
    seedDatabase(db, { count: Number(args.count), seed: Number(args.seed) });
    const elapsed = Math.round(performance.now() - startedAt);
    console.log(`Seeded ${countEmployees(db)} employees in ${elapsed}ms.`);
  }
} finally {
  close();
}

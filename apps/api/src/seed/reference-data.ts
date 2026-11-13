import { sql } from 'drizzle-orm';
import type { DbExecutor } from '../db/client.js';
import { countries } from '../db/schema.js';
import { COUNTRIES } from '../domain/countries.js';

/** Inserts the country list, updating names and rates of countries that already exist. */
export function upsertCountries(db: DbExecutor): void {
  db.insert(countries)
    .values([...COUNTRIES])
    .onConflictDoUpdate({
      target: countries.code,
      set: {
        name: sql`excluded.name`,
        currency: sql`excluded.currency`,
        usdRate: sql`excluded.usd_rate`,
      },
    })
    .run();
}

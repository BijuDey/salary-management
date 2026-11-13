import { asc, eq } from 'drizzle-orm';
import type { DbExecutor } from '../../db/client.js';
import { countries, employees, type CountryRow } from '../../db/schema.js';

export class ReferenceRepository {
  constructor(private readonly db: DbExecutor) {}

  countries(): CountryRow[] {
    return this.db.select().from(countries).orderBy(asc(countries.name)).all();
  }

  findCountry(code: string): CountryRow | undefined {
    return this.db.select().from(countries).where(eq(countries.code, code)).get();
  }

  /** Job titles currently in use, for filters and form suggestions. */
  jobTitles(): string[] {
    return this.db
      .selectDistinct({ jobTitle: employees.jobTitle })
      .from(employees)
      .orderBy(asc(employees.jobTitle))
      .all()
      .map((row) => row.jobTitle);
  }
}

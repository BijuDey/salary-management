import { and, eq } from 'drizzle-orm';
import type { DbExecutor } from '../../db/client.js';
import { countries, employees } from '../../db/schema.js';
import type { Department } from '../../domain/employee.js';
import type { PayRecord } from './insights.calculations.js';

export interface PayRecordFilter {
  countryCode?: string;
  department?: Department;
}

export class InsightsRepository {
  constructor(private readonly db: DbExecutor) {}

  /**
   * Loads only the columns analytics need. At 10k employees this is a few hundred KB and
   * aggregates in milliseconds; see docs/04-performance.md for how this would change at scale.
   */
  payRecords(filter: PayRecordFilter = {}): PayRecord[] {
    return this.db
      .select({
        countryCode: employees.countryCode,
        countryName: countries.name,
        currency: countries.currency,
        usdRate: countries.usdRate,
        department: employees.department,
        jobTitle: employees.jobTitle,
        annualSalary: employees.annualSalary,
      })
      .from(employees)
      .innerJoin(countries, eq(employees.countryCode, countries.code))
      .where(
        and(
          filter.countryCode ? eq(employees.countryCode, filter.countryCode) : undefined,
          filter.department ? eq(employees.department, filter.department) : undefined,
        ),
      )
      .all();
  }
}

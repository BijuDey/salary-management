import { and, asc, count, desc, eq, max, or, sql, type SQL } from 'drizzle-orm';
import type { DbExecutor } from '../../db/client.js';
import {
  countries,
  employees,
  salaryChanges,
  type CountryRow,
  type EmployeeRow,
  type NewEmployeeRow,
  type NewSalaryChangeRow,
  type SalaryChangeRow,
} from '../../db/schema.js';
import { formatEmployeeCode } from '../../domain/employee.js';
import { ConflictError } from '../../lib/errors.js';
import type { ListEmployeesQuery } from './employee.schemas.js';

export type EmployeeWithCountry = EmployeeRow & {
  countryName: string;
  currency: string;
  usdRate: number;
};

export interface EmployeePage {
  rows: EmployeeWithCountry[];
  total: number;
}

const employeeWithCountryColumns = {
  id: employees.id,
  employeeCode: employees.employeeCode,
  firstName: employees.firstName,
  lastName: employees.lastName,
  email: employees.email,
  jobTitle: employees.jobTitle,
  department: employees.department,
  countryCode: employees.countryCode,
  annualSalary: employees.annualSalary,
  employmentType: employees.employmentType,
  hireDate: employees.hireDate,
  createdAt: employees.createdAt,
  updatedAt: employees.updatedAt,
  countryName: countries.name,
  currency: countries.currency,
  usdRate: countries.usdRate,
};

export class EmployeeRepository {
  constructor(private readonly db: DbExecutor) {}

  list(query: ListEmployeesQuery): EmployeePage {
    const where = and(
      query.search ? matchesSearch(query.search) : undefined,
      query.country ? eq(employees.countryCode, query.country) : undefined,
      query.department ? eq(employees.department, query.department) : undefined,
      query.jobTitle ? eq(employees.jobTitle, query.jobTitle) : undefined,
    );

    const rows = this.db
      .select(employeeWithCountryColumns)
      .from(employees)
      .innerJoin(countries, eq(employees.countryCode, countries.code))
      .where(where)
      .orderBy(...orderBy(query))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize)
      .all();

    const total = this.db.select({ value: count() }).from(employees).where(where).get()?.value ?? 0;

    return { rows, total };
  }

  findById(id: number): EmployeeWithCountry | undefined {
    return this.db
      .select(employeeWithCountryColumns)
      .from(employees)
      .innerJoin(countries, eq(employees.countryCode, countries.code))
      .where(eq(employees.id, id))
      .get();
  }

  findCountry(code: string): CountryRow | undefined {
    return this.db.select().from(countries).where(eq(countries.code, code)).get();
  }

  salaryHistory(employeeId: number): SalaryChangeRow[] {
    return this.db
      .select()
      .from(salaryChanges)
      .where(eq(salaryChanges.employeeId, employeeId))
      .orderBy(desc(salaryChanges.effectiveDate), desc(salaryChanges.id))
      .all();
  }

  /** Inserts the employee and their opening salary history entry atomically. */
  create(
    employee: Omit<NewEmployeeRow, 'employeeCode'>,
    initialSalary: Omit<NewSalaryChangeRow, 'employeeId'>,
  ): number {
    return withUniqueEmailGuard(() =>
      this.db.transaction((tx) => {
        const lastId =
          tx
            .select({ value: max(employees.id) })
            .from(employees)
            .get()?.value ?? 0;
        const inserted = tx
          .insert(employees)
          .values({ ...employee, employeeCode: formatEmployeeCode(lastId + 1) })
          .returning({ id: employees.id })
          .get();

        tx.insert(salaryChanges)
          .values({ ...initialSalary, employeeId: inserted.id })
          .run();
        return inserted.id;
      }),
    );
  }

  /** Applies profile changes and, when given, records the salary change in the same transaction. */
  update(
    id: number,
    changes: Partial<NewEmployeeRow>,
    salaryChange?: Omit<NewSalaryChangeRow, 'employeeId'>,
  ): void {
    withUniqueEmailGuard(() =>
      this.db.transaction((tx) => {
        tx.update(employees)
          .set({ ...changes, updatedAt: new Date().toISOString() })
          .where(eq(employees.id, id))
          .run();

        if (salaryChange) {
          tx.insert(salaryChanges)
            .values({ ...salaryChange, employeeId: id })
            .run();
        }
      }),
    );
  }

  /** @returns whether an employee was deleted */
  delete(id: number): boolean {
    return this.db.delete(employees).where(eq(employees.id, id)).run().changes > 0;
  }
}

/** Case-insensitive "contains" across name, email and employee code. */
function matchesSearch(term: string): SQL | undefined {
  const pattern = `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
  const contains = (expression: SQL) => sql`${expression} LIKE ${pattern} ESCAPE '\\'`;

  return or(
    contains(sql`${employees.firstName} || ' ' || ${employees.lastName}`),
    contains(sql`${employees.email}`),
    contains(sql`${employees.employeeCode}`),
  );
}

function orderBy({ sortBy, sortOrder }: ListEmployeesQuery): SQL[] {
  const direction = sortOrder === 'asc' ? asc : desc;
  switch (sortBy) {
    case 'salary':
      // Compare pay across currencies on a common (USD) basis.
      return [direction(sql`${employees.annualSalary} * ${countries.usdRate}`), asc(employees.id)];
    case 'hireDate':
      return [direction(employees.hireDate), asc(employees.id)];
    case 'name':
      return [direction(employees.lastName), direction(employees.firstName), asc(employees.id)];
  }
}

function withUniqueEmailGuard<T>(operation: () => T): T {
  try {
    return operation();
  } catch (error) {
    if (isUniqueViolation(error, 'employees.email')) {
      throw new ConflictError('An employee with this email address already exists');
    }
    throw error;
  }
}

/** Walks the error chain: Drizzle wraps driver errors, keeping the original as `cause`. */
function isUniqueViolation(error: unknown, column: string): boolean {
  let current: unknown = error;
  while (current instanceof Error) {
    const code = (current as { code?: unknown }).code;
    if (code === 'SQLITE_CONSTRAINT_UNIQUE' && current.message.includes(column)) {
      return true;
    }
    current = current.cause;
  }
  return false;
}

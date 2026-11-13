import { sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { DEPARTMENTS, EMPLOYMENT_TYPES } from '../domain/employee.js';

const timestamps = {
  createdAt: text('created_at')
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
};

/**
 * Reference data: where employees work and the currency they are paid in.
 * `usdRate` is the value of one unit of local currency in USD, used only to compare
 * pay across countries. Salaries themselves are always stored in local currency.
 */
export const countries = sqliteTable('countries', {
  code: text('code').primaryKey(), // ISO 3166-1 alpha-2
  name: text('name').notNull(),
  currency: text('currency').notNull(), // ISO 4217
  usdRate: real('usd_rate').notNull(),
});

export const employees = sqliteTable(
  'employees',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    employeeCode: text('employee_code').notNull().unique(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email').notNull().unique(),
    jobTitle: text('job_title').notNull(),
    department: text('department', { enum: DEPARTMENTS }).notNull(),
    countryCode: text('country_code')
      .notNull()
      .references(() => countries.code),
    /** Annual base salary in whole units of the country's currency. */
    annualSalary: integer('annual_salary').notNull(),
    employmentType: text('employment_type', { enum: EMPLOYMENT_TYPES }).notNull(),
    hireDate: text('hire_date').notNull(), // YYYY-MM-DD
    ...timestamps,
  },
  (table) => [
    index('employees_country_idx').on(table.countryCode),
    index('employees_department_idx').on(table.department),
    index('employees_job_title_idx').on(table.jobTitle),
    index('employees_name_idx').on(table.lastName, table.firstName),
    index('employees_hire_date_idx').on(table.hireDate),
  ],
);

/**
 * Append-only audit trail of salary changes. The currency is captured per entry because an
 * employee who relocates changes currency, and history must stay readable after that.
 */
export const salaryChanges = sqliteTable(
  'salary_changes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    employeeId: integer('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    previousSalary: integer('previous_salary'),
    newSalary: integer('new_salary').notNull(),
    currency: text('currency').notNull(),
    reason: text('reason').notNull(),
    effectiveDate: text('effective_date').notNull(), // YYYY-MM-DD
    createdAt: timestamps.createdAt,
  },
  (table) => [index('salary_changes_employee_idx').on(table.employeeId, table.effectiveDate)],
);

export type CountryRow = typeof countries.$inferSelect;
export type EmployeeRow = typeof employees.$inferSelect;
export type NewEmployeeRow = typeof employees.$inferInsert;
export type SalaryChangeRow = typeof salaryChanges.$inferSelect;
export type NewSalaryChangeRow = typeof salaryChanges.$inferInsert;

import {
  faker as baseFaker,
  fakerDE,
  fakerEN_AU,
  fakerEN_CA,
  fakerEN_GB,
  fakerEN_IN,
  fakerEN_US,
  fakerES,
  fakerFR,
  fakerNL,
  fakerPT_BR,
  type Faker,
} from '@faker-js/faker';
import type { NewEmployeeRow, NewSalaryChangeRow } from '../db/schema.js';
import {
  DEPARTMENTS,
  INITIAL_SALARY_REASON,
  formatEmployeeCode,
  type EmploymentType,
} from '../domain/employee.js';
import { DEPARTMENT_WEIGHTS, JOB_CATALOGUE } from './job-catalogue.js';
import { COUNTRIES } from './reference-data.js';

interface CountryProfile {
  /** Share of global headcount. */
  weight: number;
  /** Local pay relative to the US market for the same role. */
  payFactor: number;
  faker: Faker;
}

const COUNTRY_PROFILES: Record<string, CountryProfile> = {
  US: { weight: 30, payFactor: 1, faker: fakerEN_US },
  IN: { weight: 18, payFactor: 0.3, faker: fakerEN_IN },
  GB: { weight: 10, payFactor: 0.72, faker: fakerEN_GB },
  DE: { weight: 9, payFactor: 0.7, faker: fakerDE },
  CA: { weight: 7, payFactor: 0.78, faker: fakerEN_CA },
  FR: { weight: 6, payFactor: 0.62, faker: fakerFR },
  NL: { weight: 5, payFactor: 0.68, faker: fakerNL },
  ES: { weight: 5, payFactor: 0.5, faker: fakerES },
  BR: { weight: 5, payFactor: 0.32, faker: fakerPT_BR },
  AU: { weight: 5, payFactor: 0.8, faker: fakerEN_AU },
};

const EMPLOYMENT_TYPE_WEIGHTS: { value: EmploymentType; weight: number }[] = [
  { value: 'full_time', weight: 90 },
  { value: 'contract', weight: 6 },
  { value: 'part_time', weight: 4 },
];

const PART_TIME_FACTOR = 0.6;
const EARLIEST_HIRE_DATE = new Date('2012-01-01T00:00:00Z');
const EMAIL_DOMAIN = 'acme.com';

export interface GeneratedEmployee {
  employee: NewEmployeeRow & { id: number };
  salaryHistory: NewSalaryChangeRow[];
}

export interface GeneratorOptions {
  count: number;
  /** Same seed, same data: makes demos and bug reports reproducible. */
  seed?: number;
  /** Upper bound for generated dates. Fixed by default so output does not drift over time. */
  referenceDate?: Date;
}

/**
 * Generates realistic, deterministic employees. Salaries derive from a role's US base pay,
 * scaled by country pay level, with ±15% individual variation, then converted to local currency.
 */
export function generateEmployees({
  count,
  seed = 42,
  referenceDate = new Date('2026-06-30T00:00:00Z'),
}: GeneratorOptions): GeneratedEmployee[] {
  baseFaker.seed(seed);
  Object.values(COUNTRY_PROFILES).forEach((profile, index) => profile.faker.seed(seed + index + 1));

  const usedEmails = new Set<string>();
  const countryChoices = COUNTRIES.map((country) => ({
    value: country,
    weight: COUNTRY_PROFILES[country.code]!.weight,
  }));
  const departmentChoices = DEPARTMENTS.map((department) => ({
    value: department,
    weight: DEPARTMENT_WEIGHTS[department],
  }));

  return Array.from({ length: count }, (_, index) => {
    const id = index + 1;
    const country = baseFaker.helpers.weightedArrayElement(countryChoices);
    const profile = COUNTRY_PROFILES[country.code]!;
    const department = baseFaker.helpers.weightedArrayElement(departmentChoices);
    const job = baseFaker.helpers.weightedArrayElement(
      JOB_CATALOGUE[department].map((role) => ({ value: role, weight: role.weight })),
    );
    const employmentType = baseFaker.helpers.weightedArrayElement(EMPLOYMENT_TYPE_WEIGHTS);

    const firstName = profile.faker.person.firstName();
    const lastName = profile.faker.person.lastName();
    const hireDate = baseFaker.date.between({ from: EARLIEST_HIRE_DATE, to: referenceDate });

    const variation = baseFaker.number.float({ min: 0.85, max: 1.15 });
    const timeFactor = employmentType === 'part_time' ? PART_TIME_FACTOR : 1;
    const salaryUsd = job.baseUsd * profile.payFactor * variation * timeFactor;
    const annualSalary = roundToStep(salaryUsd / country.usdRate, salaryStep(country.usdRate));

    const employee = {
      id,
      employeeCode: formatEmployeeCode(id),
      firstName,
      lastName,
      email: uniqueEmail(firstName, lastName, usedEmails),
      jobTitle: job.title,
      department,
      countryCode: country.code,
      annualSalary,
      employmentType,
      hireDate: toIsoDate(hireDate),
    };

    return {
      employee,
      salaryHistory: buildSalaryHistory(employee, country.currency, hireDate, referenceDate),
    };
  });
}

/**
 * Employees with more than a year of tenure usually had a raise; model that as one prior
 * compensation review so the history view has meaningful data.
 */
function buildSalaryHistory(
  employee: GeneratedEmployee['employee'],
  currency: string,
  hireDate: Date,
  referenceDate: Date,
): NewSalaryChangeRow[] {
  const firstReviewDate = addYears(hireDate, 1);
  const hadRaise = firstReviewDate < referenceDate && baseFaker.datatype.boolean(0.6);

  if (!hadRaise) {
    return [
      {
        employeeId: employee.id,
        previousSalary: null,
        newSalary: employee.annualSalary,
        currency,
        reason: INITIAL_SALARY_REASON,
        effectiveDate: employee.hireDate,
      },
    ];
  }

  const raise = baseFaker.number.float({ min: 1.03, max: 1.12 });
  const startingSalary = Math.round(employee.annualSalary / raise);
  const reviewDate = baseFaker.date.between({ from: firstReviewDate, to: referenceDate });

  return [
    {
      employeeId: employee.id,
      previousSalary: null,
      newSalary: startingSalary,
      currency,
      reason: INITIAL_SALARY_REASON,
      effectiveDate: employee.hireDate,
    },
    {
      employeeId: employee.id,
      previousSalary: startingSalary,
      newSalary: employee.annualSalary,
      currency,
      reason: 'Annual compensation review',
      effectiveDate: toIsoDate(reviewDate),
    },
  ];
}

function uniqueEmail(firstName: string, lastName: string, used: Set<string>): string {
  const base = `${slugify(firstName)}.${slugify(lastName)}`;
  let candidate = base;
  for (let suffix = 2; used.has(candidate); suffix++) {
    candidate = `${base}${suffix}`;
  }
  used.add(candidate);
  return `${candidate}@${EMAIL_DOMAIN}`;
}

/** "José María" → "josemaria" */
function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

/** Salaries are quoted in round numbers; low-value currencies round to larger steps. */
function salaryStep(usdRate: number): number {
  return usdRate < 0.05 ? 10_000 : 500;
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setUTCFullYear(result.getUTCFullYear() + years);
  return result;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

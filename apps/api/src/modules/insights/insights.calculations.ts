/**
 * Pure aggregation functions behind the pay insights. Kept free of I/O so the maths can be
 * tested exhaustively with plain arrays.
 */
import type { Department } from '../../domain/employee.js';
import { toUsd } from '../../lib/currency.js';
import {
  histogram,
  summarize,
  type HistogramBucket,
  type SalaryStats,
} from '../../lib/statistics.js';

export interface PayRecord {
  countryCode: string;
  countryName: string;
  currency: string;
  usdRate: number;
  department: Department;
  jobTitle: string;
  annualSalary: number;
}

export interface CountryPay {
  countryCode: string;
  countryName: string;
  currency: string;
  headcount: number;
  annualPayrollUsd: number;
  salaryLocal: SalaryStats;
  salaryUsd: SalaryStats;
}

export interface DepartmentPay {
  department: Department;
  headcount: number;
  annualPayrollUsd: number;
  salaryUsd: SalaryStats;
}

export interface RolePay {
  jobTitle: string;
  department: Department;
  headcount: number;
  salary: SalaryStats;
}

export interface PaySummary {
  overview: {
    headcount: number;
    countryCount: number;
    annualPayrollUsd: number;
    salaryUsd: SalaryStats | null;
  };
  byCountry: CountryPay[];
  byDepartment: DepartmentPay[];
  distribution: HistogramBucket[];
}

export const DISTRIBUTION_BUCKET_USD = 20_000;

export function buildPaySummary(records: readonly PayRecord[]): PaySummary {
  const usdSalaries = records.map(salaryInUsd);
  const overallStats = records.length > 0 ? statsOf(usdSalaries) : null;

  const byCountry = [...groupBy(records, (r) => r.countryCode).values()]
    .map((group): CountryPay => {
      const { countryCode, countryName, currency } = group[0]!;
      const salaryUsd = statsOf(group.map(salaryInUsd));
      return {
        countryCode,
        countryName,
        currency,
        headcount: group.length,
        annualPayrollUsd: salaryUsd.total,
        salaryLocal: statsOf(group.map((r) => r.annualSalary)),
        salaryUsd,
      };
    })
    .sort((a, b) => b.headcount - a.headcount || a.countryName.localeCompare(b.countryName));

  const byDepartment = [...groupBy(records, (r) => r.department).entries()]
    .map(([department, group]): DepartmentPay => {
      const salaryUsd = statsOf(group.map(salaryInUsd));
      return {
        department,
        headcount: group.length,
        annualPayrollUsd: salaryUsd.total,
        salaryUsd,
      };
    })
    .sort((a, b) => b.salaryUsd.median - a.salaryUsd.median);

  return {
    overview: {
      headcount: records.length,
      countryCount: byCountry.length,
      annualPayrollUsd: overallStats?.total ?? 0,
      salaryUsd: overallStats,
    },
    byCountry,
    byDepartment,
    distribution: histogram(usdSalaries, DISTRIBUTION_BUCKET_USD),
  };
}

/**
 * Pay per job title, highest median first. Within a single country the figures stay in local
 * currency (how HR benchmarks a role); across countries they are normalised to USD.
 */
export function buildRoleBreakdown(
  records: readonly PayRecord[],
  { inLocalCurrency }: { inLocalCurrency: boolean },
): RolePay[] {
  const amount = inLocalCurrency ? (r: PayRecord) => r.annualSalary : salaryInUsd;

  return [...groupBy(records, (r) => r.jobTitle).entries()]
    .map(([jobTitle, group]) => ({
      jobTitle,
      department: group[0]!.department,
      headcount: group.length,
      salary: statsOf(group.map(amount)),
    }))
    .sort((a, b) => b.salary.median - a.salary.median || a.jobTitle.localeCompare(b.jobTitle));
}

function salaryInUsd(record: PayRecord): number {
  return toUsd(record.annualSalary, record.usdRate);
}

/** Whole-unit summary statistics for a non-empty group (groups are never empty by construction). */
function statsOf(values: number[]): SalaryStats {
  const stats = summarize(values);
  if (!stats) {
    throw new Error('Cannot summarise an empty group');
  }
  return {
    count: stats.count,
    min: Math.round(stats.min),
    max: Math.round(stats.max),
    mean: Math.round(stats.mean),
    median: Math.round(stats.median),
    p25: Math.round(stats.p25),
    p75: Math.round(stats.p75),
    total: Math.round(stats.total),
  };
}

function groupBy<T, K>(items: readonly T[], key: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const groupKey = key(item);
    const group = groups.get(groupKey);
    if (group) {
      group.push(item);
    } else {
      groups.set(groupKey, [item]);
    }
  }
  return groups;
}

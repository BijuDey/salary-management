import { describe, expect, it } from 'vitest';
import { buildPaySummary, buildRoleBreakdown, type PayRecord } from './insights.calculations.js';

const US = { countryCode: 'US', countryName: 'United States', currency: 'USD', usdRate: 1 };
const IN = { countryCode: 'IN', countryName: 'India', currency: 'INR', usdRate: 0.012 };

const record = (overrides: Partial<PayRecord>): PayRecord => ({
  ...US,
  department: 'Engineering',
  jobTitle: 'Software Engineer',
  annualSalary: 100_000,
  ...overrides,
});

const records: PayRecord[] = [
  record({ annualSalary: 100_000 }),
  record({ annualSalary: 140_000, jobTitle: 'Senior Software Engineer' }),
  record({ annualSalary: 60_000, department: 'Sales', jobTitle: 'Account Executive' }),
  record({ ...IN, annualSalary: 2_500_000 }), // 30,000 USD
  record({ ...IN, annualSalary: 5_000_000, jobTitle: 'Senior Software Engineer' }), // 60,000 USD
];

describe('buildPaySummary', () => {
  const summary = buildPaySummary(records);

  it('computes an org-wide overview in USD', () => {
    expect(summary.overview).toMatchObject({
      headcount: 5,
      countryCount: 2,
      annualPayrollUsd: 390_000,
    });
    expect(summary.overview.salaryUsd).toMatchObject({ median: 60_000, min: 30_000, max: 140_000 });
  });

  it('breaks pay down by country in both local currency and USD, largest first', () => {
    expect(summary.byCountry.map((c) => c.countryCode)).toEqual(['US', 'IN']);

    const india = summary.byCountry.find((c) => c.countryCode === 'IN');
    expect(india).toMatchObject({
      currency: 'INR',
      headcount: 2,
      annualPayrollUsd: 90_000,
      salaryLocal: { median: 3_750_000 },
      salaryUsd: { median: 45_000 },
    });
  });

  it('breaks pay down by department, highest median first', () => {
    expect(summary.byDepartment).toEqual([
      expect.objectContaining({
        department: 'Engineering',
        headcount: 4,
        annualPayrollUsd: 330_000,
      }),
      expect.objectContaining({ department: 'Sales', headcount: 1, annualPayrollUsd: 60_000 }),
    ]);
  });

  it('builds a USD salary distribution that accounts for every employee', () => {
    const counted = summary.distribution.reduce((sum, bucket) => sum + bucket.count, 0);
    expect(counted).toBe(records.length);
    expect(summary.distribution[0]).toMatchObject({ from: 20_000, to: 40_000, count: 1 });
  });

  it('handles an empty organisation', () => {
    expect(buildPaySummary([])).toEqual({
      overview: { headcount: 0, countryCount: 0, annualPayrollUsd: 0, salaryUsd: null },
      byCountry: [],
      byDepartment: [],
      distribution: [],
    });
  });
});

describe('buildRoleBreakdown', () => {
  it('normalises to USD across countries, ordered by median', () => {
    const roles = buildRoleBreakdown(records, { inLocalCurrency: false });

    expect(roles.map((r) => [r.jobTitle, r.headcount, r.salary.median])).toEqual([
      ['Senior Software Engineer', 2, 100_000],
      ['Software Engineer', 2, 65_000],
      ['Account Executive', 1, 60_000],
    ]);
  });

  it('keeps local currency figures when looking at a single country', () => {
    const india = records.filter((r) => r.countryCode === 'IN');

    const roles = buildRoleBreakdown(india, { inLocalCurrency: true });

    expect(roles[0]).toMatchObject({
      jobTitle: 'Senior Software Engineer',
      salary: { median: 5_000_000 },
    });
  });
});

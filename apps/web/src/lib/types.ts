/**
 * API contract types. They mirror the DTOs returned by apps/api; keeping them in one file makes
 * any drift easy to spot (see docs/03-decisions.md on why there is no shared package yet).
 */

export interface Session {
  username: string;
  expiresAt: string;
}

export type EmploymentType = 'full_time' | 'part_time' | 'contract';

export interface Country {
  code: string;
  name: string;
  currency: string;
  usdRate: number;
}

export interface ReferenceData {
  countries: Country[];
  departments: string[];
  employmentTypes: EmploymentType[];
  jobTitles: string[];
  exchangeRatesAsOf: string;
}

export interface Employee {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
  country: { code: string; name: string };
  currency: string;
  annualSalary: number;
  annualSalaryUsd: number;
  employmentType: EmploymentType;
  hireDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryChange {
  id: number;
  previousSalary: number | null;
  newSalary: number;
  currency: string;
  reason: string;
  effectiveDate: string;
  createdAt: string;
}

export interface EmployeeDetail extends Employee {
  salaryHistory: SalaryChange[];
}

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type SortField = 'name' | 'salary' | 'hireDate';
export type SortOrder = 'asc' | 'desc';

export interface EmployeeListParams {
  search?: string;
  country?: string;
  department?: string;
  jobTitle?: string;
  sortBy: SortField;
  sortOrder: SortOrder;
  page: number;
  pageSize: number;
}

export interface EmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department: string;
  countryCode: string;
  annualSalary: number;
  employmentType: EmploymentType;
  hireDate: string;
}

export interface SalaryChangeInput {
  annualSalary: number;
  reason: string;
  effectiveDate?: string;
}

export type EmployeeUpdate = Partial<Omit<EmployeeInput, 'annualSalary'>> & {
  salaryChange?: SalaryChangeInput;
};

export interface SalaryStats {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  p25: number;
  p75: number;
  total: number;
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
  department: string;
  headcount: number;
  annualPayrollUsd: number;
  salaryUsd: SalaryStats;
}

export interface HistogramBucket {
  from: number;
  to: number;
  count: number;
}

export interface PaySummary {
  currency: 'USD';
  exchangeRatesAsOf: string;
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

export interface RolePay {
  jobTitle: string;
  department: string;
  headcount: number;
  salary: SalaryStats;
}

export interface RoleInsights {
  currency: string;
  country: { code: string; name: string } | null;
  roles: RolePay[];
}

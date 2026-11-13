import type { CountryRow, SalaryChangeRow } from '../../db/schema.js';
import {
  INITIAL_SALARY_REASON,
  type Department,
  type EmploymentType,
} from '../../domain/employee.js';
import { toUsd } from '../../lib/currency.js';
import { BusinessRuleError, NotFoundError } from '../../lib/errors.js';
import type { EmployeeRepository, EmployeeWithCountry } from './employee.repository.js';
import type {
  CreateEmployeeInput,
  ListEmployeesQuery,
  UpdateEmployeeInput,
} from './employee.schemas.js';

export interface EmployeeDto {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  jobTitle: string;
  department: Department;
  country: { code: string; name: string };
  currency: string;
  annualSalary: number;
  annualSalaryUsd: number;
  employmentType: EmploymentType;
  hireDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryChangeDto {
  id: number;
  previousSalary: number | null;
  newSalary: number;
  currency: string;
  reason: string;
  effectiveDate: string;
  createdAt: string;
}

export interface EmployeeDetailDto extends EmployeeDto {
  salaryHistory: SalaryChangeDto[];
}

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export class EmployeeService {
  constructor(
    private readonly repository: EmployeeRepository,
    private readonly today: () => string = () => new Date().toISOString().slice(0, 10),
  ) {}

  list(query: ListEmployeesQuery): Paginated<EmployeeDto> {
    const { rows, total } = this.repository.list(query);
    return {
      data: rows.map(toEmployeeDto),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  get(id: number): EmployeeDetailDto {
    const employee = this.findOrThrow(id);
    return {
      ...toEmployeeDto(employee),
      salaryHistory: this.repository.salaryHistory(id).map(toSalaryChangeDto),
    };
  }

  create(input: CreateEmployeeInput): EmployeeDetailDto {
    const country = this.requireCountry(input.countryCode);
    const id = this.repository.create(input, {
      previousSalary: null,
      newSalary: input.annualSalary,
      currency: country.currency,
      reason: INITIAL_SALARY_REASON,
      effectiveDate: input.hireDate,
    });

    return this.get(id);
  }

  /**
   * Business rules:
   * - a salary change must differ from the current salary;
   * - moving to a country with a different currency requires a new salary, because the
   *   existing figure would silently be reinterpreted in the wrong currency.
   */
  update(id: number, input: UpdateEmployeeInput): EmployeeDetailDto {
    const current = this.findOrThrow(id);
    const { salaryChange, ...profile } = input;

    const isRelocating =
      profile.countryCode !== undefined && profile.countryCode !== current.countryCode;
    const targetCountry = isRelocating ? this.requireCountry(profile.countryCode!) : undefined;
    const currencyChanges =
      targetCountry !== undefined && targetCountry.currency !== current.currency;

    if (currencyChanges && !salaryChange) {
      throw new BusinessRuleError(
        `Moving to ${targetCountry.name} changes the pay currency to ${targetCountry.currency}; provide a new salary.`,
      );
    }

    if (salaryChange && !currencyChanges && salaryChange.annualSalary === current.annualSalary) {
      throw new BusinessRuleError('The new salary is the same as the current salary');
    }

    const currency = targetCountry?.currency ?? current.currency;

    this.repository.update(
      id,
      salaryChange ? { ...profile, annualSalary: salaryChange.annualSalary } : profile,
      salaryChange && {
        previousSalary: current.annualSalary,
        newSalary: salaryChange.annualSalary,
        currency,
        reason: salaryChange.reason,
        effectiveDate: salaryChange.effectiveDate ?? this.today(),
      },
    );

    return this.get(id);
  }

  delete(id: number): void {
    if (!this.repository.delete(id)) {
      throw new NotFoundError('Employee', id);
    }
  }

  private requireCountry(code: string): CountryRow {
    const country = this.repository.findCountry(code);
    if (!country) {
      throw new BusinessRuleError(`Unknown country code ${code}`);
    }
    return country;
  }

  private findOrThrow(id: number): EmployeeWithCountry {
    const employee = this.repository.findById(id);
    if (!employee) {
      throw new NotFoundError('Employee', id);
    }
    return employee;
  }
}

function toEmployeeDto(row: EmployeeWithCountry): EmployeeDto {
  return {
    id: row.id,
    employeeCode: row.employeeCode,
    firstName: row.firstName,
    lastName: row.lastName,
    fullName: `${row.firstName} ${row.lastName}`,
    email: row.email,
    jobTitle: row.jobTitle,
    department: row.department,
    country: { code: row.countryCode, name: row.countryName },
    currency: row.currency,
    annualSalary: row.annualSalary,
    annualSalaryUsd: toUsd(row.annualSalary, row.usdRate),
    employmentType: row.employmentType,
    hireDate: row.hireDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toSalaryChangeDto(row: SalaryChangeRow): SalaryChangeDto {
  return {
    id: row.id,
    previousSalary: row.previousSalary,
    newSalary: row.newSalary,
    currency: row.currency,
    reason: row.reason,
    effectiveDate: row.effectiveDate,
    createdAt: row.createdAt,
  };
}

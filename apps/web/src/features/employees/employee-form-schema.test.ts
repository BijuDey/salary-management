import { describe, expect, it } from 'vitest';
import type { Employee } from '@/lib/types';
import {
  emptyEmployeeForm,
  employeeFormSchema,
  employeeToForm,
  toEmployeeInput,
  toEmployeeUpdate,
} from './employee-form-schema';

const employee: Employee = {
  id: 7,
  employeeCode: 'EMP-00007',
  firstName: 'Ada',
  lastName: 'Lovelace',
  fullName: 'Ada Lovelace',
  email: 'ada@acme.com',
  jobTitle: 'Software Engineer',
  department: 'Engineering',
  country: { code: 'GB', name: 'United Kingdom' },
  currency: 'GBP',
  annualSalary: 80_000,
  annualSalaryUsd: 101_600,
  employmentType: 'full_time',
  hireDate: '2024-03-01',
  createdAt: '2024-03-01T00:00:00Z',
  updatedAt: '2024-03-01T00:00:00Z',
};

const validNewEmployee = {
  ...emptyEmployeeForm(),
  firstName: 'Grace',
  lastName: 'Hopper',
  email: 'grace@acme.com',
  jobTitle: 'Staff Engineer',
  department: 'Engineering',
  countryCode: 'US',
  annualSalary: '210000',
};

describe('employeeFormSchema', () => {
  it('accepts a complete new employee', () => {
    expect(employeeFormSchema.safeParse(validNewEmployee).success).toBe(true);
  });

  it('requires a whole-number salary when adding an employee', () => {
    const result = employeeFormSchema.safeParse({ ...validNewEmployee, annualSalary: '85,000.50' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({ path: ['annualSalary'] });
  });

  it('does not ask for a salary when editing profile details', () => {
    expect(employeeFormSchema.safeParse(employeeToForm(employee)).success).toBe(true);
  });

  it('requires a reason when a relocation needs a new salary', () => {
    const result = employeeFormSchema.safeParse({
      ...employeeToForm(employee),
      countryCode: 'DE',
      annualSalary: '95000',
      requiresSalary: true,
      requiresReason: true,
    });

    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual(['salaryReason']);
  });
});

describe('toEmployeeInput', () => {
  it('converts form strings into the API payload', () => {
    expect(toEmployeeInput(validNewEmployee)).toMatchObject({
      firstName: 'Grace',
      annualSalary: 210_000,
      employmentType: 'full_time',
    });
  });
});

describe('toEmployeeUpdate', () => {
  it('sends only the fields that changed', () => {
    const values = { ...employeeToForm(employee), jobTitle: 'Senior Software Engineer' };
    expect(toEmployeeUpdate(values, employee)).toEqual({ jobTitle: 'Senior Software Engineer' });
  });

  it('includes the salary change when relocating to another currency', () => {
    const values = {
      ...employeeToForm(employee),
      countryCode: 'DE',
      annualSalary: '95000',
      salaryReason: 'Relocation to Berlin',
      requiresSalary: true,
      requiresReason: true,
    };

    expect(toEmployeeUpdate(values, employee)).toEqual({
      countryCode: 'DE',
      salaryChange: { annualSalary: 95_000, reason: 'Relocation to Berlin' },
    });
  });
});

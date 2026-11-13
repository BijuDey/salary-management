import { describe, expect, it } from 'vitest';
import { DEPARTMENTS, INITIAL_SALARY_REASON } from '../domain/employee.js';
import { generateEmployees } from './employee-generator.js';
import { COUNTRIES } from './reference-data.js';

describe('generateEmployees', () => {
  const generated = generateEmployees({ count: 1_000, seed: 7 });
  const employees = generated.map((item) => item.employee);

  it('generates the requested number of employees with sequential codes', () => {
    expect(employees).toHaveLength(1_000);
    expect(employees[0]?.employeeCode).toBe('EMP-00001');
    expect(employees[999]?.employeeCode).toBe('EMP-01000');
  });

  it('is deterministic for a given seed', () => {
    const again = generateEmployees({ count: 1_000, seed: 7 });
    expect(again).toEqual(generated);
  });

  it('produces different data for a different seed', () => {
    const other = generateEmployees({ count: 50, seed: 8 });
    expect(other.map((item) => item.employee.email)).not.toEqual(
      generated.slice(0, 50).map((item) => item.employee.email),
    );
  });

  it('generates unique, ASCII-only email addresses', () => {
    const emails = employees.map((employee) => employee.email);
    expect(new Set(emails).size).toBe(emails.length);
    emails.forEach((email) => expect(email).toMatch(/^[a-z]+\.[a-z]+\d*@acme\.com$/));
  });

  it('only uses known countries and departments', () => {
    const countryCodes = new Set(COUNTRIES.map((country) => country.code));
    employees.forEach((employee) => {
      expect(countryCodes.has(employee.countryCode)).toBe(true);
      expect(DEPARTMENTS).toContain(employee.department);
    });
  });

  it('produces positive, rounded salaries', () => {
    employees.forEach((employee) => {
      expect(employee.annualSalary).toBeGreaterThan(0);
      expect(employee.annualSalary % 500).toBe(0);
    });
  });

  it('pays the same role more in higher-paying markets', () => {
    const medianUsd = (countryCode: string) => {
      const rate = COUNTRIES.find((country) => country.code === countryCode)!.usdRate;
      const salaries = employees
        .filter((e) => e.countryCode === countryCode && e.employmentType === 'full_time')
        .map((e) => e.annualSalary * rate)
        .sort((a, b) => a - b);
      return salaries[Math.floor(salaries.length / 2)]!;
    };

    expect(medianUsd('US')).toBeGreaterThan(medianUsd('IN'));
  });

  it('builds a salary history that starts at hire and ends at the current salary', () => {
    generated.forEach(({ employee, salaryHistory }) => {
      const [first] = salaryHistory;
      const last = salaryHistory.at(-1);

      expect(first?.reason).toBe(INITIAL_SALARY_REASON);
      expect(first?.previousSalary).toBeNull();
      expect(first?.effectiveDate).toBe(employee.hireDate);
      expect(last?.newSalary).toBe(employee.annualSalary);
    });
  });
});

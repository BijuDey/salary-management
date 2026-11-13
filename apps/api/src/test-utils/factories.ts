import type { CreateEmployeeInput } from '../modules/employees/employee.schemas.js';

let sequence = 0;

/** A valid create-employee payload; override only what the test cares about. */
export function buildEmployeeInput(
  overrides: Partial<CreateEmployeeInput> = {},
): CreateEmployeeInput {
  sequence += 1;
  return {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: `ada.lovelace.${sequence}@acme.com`,
    jobTitle: 'Software Engineer',
    department: 'Engineering',
    countryCode: 'GB',
    annualSalary: 80_000,
    employmentType: 'full_time',
    hireDate: '2024-03-01',
    ...overrides,
  };
}

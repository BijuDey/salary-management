/**
 * Core vocabulary of the salary domain, shared by validation, persistence and seeding.
 */

export const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Sales',
  'Marketing',
  'Customer Success',
  'Operations',
  'Finance',
  'People',
  'Legal',
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract'] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

/** Reason recorded against the first salary history entry of every employee. */
export const INITIAL_SALARY_REASON = 'Initial salary';

import { z } from 'zod';
import { DEPARTMENTS, EMPLOYMENT_TYPES } from '../../domain/employee.js';

/** Query-string text filter: trimmed, and treated as absent when blank. */
const optionalText = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((value) => value || undefined);

const countryCode = z
  .string()
  .trim()
  .length(2, 'Country code must be a 2-letter ISO code')
  .transform((value) => value.toUpperCase());

const personName = z.string().trim().min(1, 'Required').max(80);

const annualSalary = z
  .number({ error: 'Salary must be a number' })
  .int('Salary must be a whole number')
  .positive('Salary must be greater than zero')
  .max(1_000_000_000, 'Salary is unrealistically high');

export const SORT_FIELDS = ['name', 'salary', 'hireDate'] as const;

export const employeeIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listEmployeesQuerySchema = z.object({
  search: optionalText,
  country: countryCode.optional(),
  department: z.enum(DEPARTMENTS).optional(),
  jobTitle: optionalText,
  sortBy: z.enum(SORT_FIELDS).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const createEmployeeSchema = z.object({
  firstName: personName,
  lastName: personName,
  email: z
    .email('Enter a valid email address')
    .max(254)
    .transform((value) => value.toLowerCase()),
  jobTitle: z.string().trim().min(2, 'Job title is too short').max(100),
  department: z.enum(DEPARTMENTS),
  countryCode,
  annualSalary,
  employmentType: z.enum(EMPLOYMENT_TYPES),
  hireDate: z.iso.date('Use the YYYY-MM-DD format'),
});

export const salaryChangeSchema = z.object({
  annualSalary,
  reason: z.string().trim().min(3, 'Give a short reason for the change').max(200),
  effectiveDate: z.iso.date('Use the YYYY-MM-DD format').optional(),
});

/**
 * Profile fields are optional on update. Salary is changed through `salaryChange` so that
 * every pay change carries a reason and lands in the salary history.
 */
export const updateEmployeeSchema = createEmployeeSchema
  .omit({ annualSalary: true })
  .partial()
  .extend({ salaryChange: salaryChangeSchema.optional() })
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update');

export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type SalaryChangeInput = z.infer<typeof salaryChangeSchema>;
export type SortField = (typeof SORT_FIELDS)[number];

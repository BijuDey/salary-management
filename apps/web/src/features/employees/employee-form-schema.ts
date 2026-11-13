import { z } from 'zod';
import type { Employee, EmployeeInput, EmployeeUpdate } from '@/lib/types';

/**
 * Form values are kept as strings (what inputs produce) and converted on submit. The rules
 * mirror the API's validation so most mistakes are caught before a round trip; the API remains
 * the source of truth and its field errors are mapped back onto these fields.
 */
const salaryText = z
  .string()
  .trim()
  .regex(/^\d+$/, 'Enter a whole number, without symbols or separators')
  .refine((value) => Number(value) > 0, 'Salary must be greater than zero');

export const employeeFormSchema = z
  .object({
    firstName: z.string().trim().min(1, 'Required').max(80),
    lastName: z.string().trim().min(1, 'Required').max(80),
    email: z.email('Enter a valid email address'),
    jobTitle: z.string().trim().min(2, 'Job title is too short').max(100),
    department: z.string().min(1, 'Choose a department'),
    countryCode: z.string().length(2, 'Choose a country'),
    employmentType: z.enum(['full_time', 'part_time', 'contract']),
    hireDate: z.iso.date('Choose a hire date'),
    /** Required when creating, or when an edit moves the employee to another currency. */
    annualSalary: z.string(),
    salaryReason: z.string(),
    requiresSalary: z.boolean(),
    requiresReason: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.requiresSalary) {
      const result = salaryText.safeParse(values.annualSalary);
      if (!result.success) {
        ctx.addIssue({
          code: 'custom',
          path: ['annualSalary'],
          message: result.error.issues[0]!.message,
        });
      }
    }
    if (values.requiresReason && values.salaryReason.trim().length < 3) {
      ctx.addIssue({
        code: 'custom',
        path: ['salaryReason'],
        message: 'Give a short reason for the change',
      });
    }
  });

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export function emptyEmployeeForm(): EmployeeFormValues {
  return {
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
    department: '',
    countryCode: '',
    employmentType: 'full_time',
    hireDate: new Date().toISOString().slice(0, 10),
    annualSalary: '',
    salaryReason: '',
    requiresSalary: true,
    requiresReason: false,
  };
}

export function employeeToForm(employee: Employee): EmployeeFormValues {
  return {
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    jobTitle: employee.jobTitle,
    department: employee.department,
    countryCode: employee.country.code,
    employmentType: employee.employmentType,
    hireDate: employee.hireDate,
    annualSalary: '',
    salaryReason: '',
    requiresSalary: false,
    requiresReason: false,
  };
}

export function toEmployeeInput(values: EmployeeFormValues): EmployeeInput {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim(),
    jobTitle: values.jobTitle.trim(),
    department: values.department,
    countryCode: values.countryCode,
    employmentType: values.employmentType,
    hireDate: values.hireDate,
    annualSalary: Number(values.annualSalary),
  };
}

/** Sends only what changed, plus a salary change when relocation requires one. */
export function toEmployeeUpdate(values: EmployeeFormValues, original: Employee): EmployeeUpdate {
  const { annualSalary, ...next } = toEmployeeInput(values);
  const before = toEmployeeInput(employeeToForm(original));

  const update: EmployeeUpdate = {};
  for (const key of Object.keys(next) as (keyof typeof next)[]) {
    if (next[key] !== before[key]) {
      Object.assign(update, { [key]: next[key] });
    }
  }

  if (values.requiresSalary) {
    update.salaryChange = { annualSalary, reason: values.salaryReason.trim() };
  }
  return update;
}

import { z } from 'zod';
import { DEPARTMENTS } from '../../domain/employee.js';

export const roleInsightsQuerySchema = z.object({
  country: z
    .string()
    .trim()
    .length(2)
    .transform((value) => value.toUpperCase())
    .optional(),
  department: z.enum(DEPARTMENTS).optional(),
});

export type RoleInsightsQuery = z.infer<typeof roleInsightsQuerySchema>;

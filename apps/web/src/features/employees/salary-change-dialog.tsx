'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { fieldAria, FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api-client';
import { formatChange, formatMoney, todayIsoDate } from '@/lib/format';
import { useUpdateEmployee } from '@/lib/queries';
import type { Employee } from '@/lib/types';
import { cn } from '@/lib/utils';

export const salaryChangeFormSchema = z.object({
  annualSalary: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Enter a whole number, without symbols or separators')
    .refine((value) => Number(value) > 0, 'Salary must be greater than zero'),
  reason: z.string().trim().min(3, 'Give a short reason for the change').max(200),
  effectiveDate: z.iso.date('Choose the date the change takes effect'),
});

type SalaryChangeFormValues = z.infer<typeof salaryChangeFormSchema>;

interface SalaryChangeDialogProps {
  employee: Employee;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SalaryChangeDialog({ employee, open, onOpenChange }: SalaryChangeDialogProps) {
  const updateEmployee = useUpdateEmployee(employee.id);
  const { register, control, handleSubmit, formState, reset, setError } =
    useForm<SalaryChangeFormValues>({
      resolver: zodResolver(salaryChangeFormSchema),
    });
  const { errors } = formState;

  useEffect(() => {
    if (open) {
      reset({ annualSalary: '', reason: '', effectiveDate: todayIsoDate() });
    }
  }, [open, reset]);

  const proposed = Number(useWatch({ control, name: 'annualSalary' }));
  const hasProposal = Number.isInteger(proposed) && proposed > 0;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateEmployee.mutateAsync({
        salaryChange: {
          annualSalary: Number(values.annualSalary),
          reason: values.reason.trim(),
          effectiveDate: values.effectiveDate,
        },
      });
      toast.success(
        `Salary updated to ${formatMoney(Number(values.annualSalary), employee.currency)}`,
      );
      onOpenChange(false);
    } catch (error) {
      // Business-rule rejections concern the amount; anything else is not the user's input.
      if (error instanceof ApiError && error.status === 422) {
        setError('annualSalary', { message: error.message });
      } else {
        toast.error(error instanceof ApiError ? error.message : 'Something went wrong. Try again.');
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Change salary</DialogTitle>
          <DialogDescription>
            {employee.fullName} currently earns{' '}
            <strong className="text-foreground tabular font-medium">
              {formatMoney(employee.annualSalary, employee.currency)}
            </strong>{' '}
            a year. The change is added to their salary history.
          </DialogDescription>
        </DialogHeader>

        <form id="salary-change-form" onSubmit={onSubmit} noValidate className="grid gap-4">
          <FormField
            id="newSalary"
            label={`New annual salary (${employee.currency})`}
            error={errors.annualSalary?.message}
            hint={
              hasProposal && (
                <span
                  className={cn(
                    'tabular font-medium',
                    proposed >= employee.annualSalary ? 'text-petrol' : 'text-destructive',
                  )}
                >
                  {formatChange(employee.annualSalary, proposed)} compared with today
                </span>
              )
            }
          >
            <Input
              inputMode="numeric"
              autoFocus
              {...register('annualSalary')}
              {...fieldAria('newSalary', errors.annualSalary?.message)}
              className="tabular"
            />
          </FormField>
          <FormField id="reason" label="Reason" error={errors.reason?.message}>
            <Input
              placeholder="e.g. Promotion to Senior Software Engineer"
              {...register('reason')}
              {...fieldAria('reason', errors.reason?.message)}
            />
          </FormField>
          <FormField
            id="effectiveDate"
            label="Effective from"
            error={errors.effectiveDate?.message}
          >
            <Input
              type="date"
              {...register('effectiveDate')}
              {...fieldAria('effectiveDate', errors.effectiveDate?.message)}
            />
          </FormField>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="salary-change-form" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? 'Saving…' : 'Save salary'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

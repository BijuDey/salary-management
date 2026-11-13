'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm, useWatch, type Path } from 'react-hook-form';
import { toast } from 'sonner';
import { fieldAria, FormField, useFieldIds } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ApiError } from '@/lib/api-client';
import { formatEmploymentType, formatMoney } from '@/lib/format';
import { useCreateEmployee, useReferenceData, useUpdateEmployee } from '@/lib/queries';
import type { Employee, EmployeeDetail } from '@/lib/types';
import {
  emptyEmployeeForm,
  employeeFormSchema,
  employeeToForm,
  toEmployeeInput,
  toEmployeeUpdate,
  type EmployeeFormValues,
} from './employee-form-schema';

interface EmployeeFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing; absent when adding a new employee. */
  employee?: Employee;
  onSaved?: (employee: EmployeeDetail) => void;
}

const FIELD_NAMES = new Set<string>(Object.keys(emptyEmployeeForm()));

export function EmployeeFormSheet({
  open,
  onOpenChange,
  employee,
  onSaved,
}: EmployeeFormSheetProps) {
  const isEditing = employee !== undefined;
  const { data: reference } = useReferenceData();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee(employee?.id ?? 0);
  const fieldId = useFieldIds();
  const formId = fieldId('form');

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: employee ? employeeToForm(employee) : emptyEmployeeForm(),
  });
  const { register, control, handleSubmit, formState, setValue, setError, reset } = form;
  const errors = formState.errors;

  useEffect(() => {
    if (open) {
      reset(employee ? employeeToForm(employee) : emptyEmployeeForm());
    }
  }, [open, employee, reset]);

  const selectedCountryCode = useWatch({ control, name: 'countryCode' });
  const countries = reference?.countries ?? [];
  const selectedCountry = countries.find((c) => c.code === selectedCountryCode);
  const currency = selectedCountry?.currency;

  // Moving someone to a country with a different currency needs a new salary (an API rule too).
  const currencyChanges = isEditing && currency !== undefined && currency !== employee.currency;
  useEffect(() => {
    if (!isEditing) return;
    setValue('requiresSalary', currencyChanges);
    setValue('requiresReason', currencyChanges);
  }, [isEditing, currencyChanges, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = isEditing
        ? await updateEmployee.mutateAsync(toEmployeeUpdate(values, employee))
        : await createEmployee.mutateAsync(toEmployeeInput(values));

      toast.success(isEditing ? 'Employee updated' : `${saved.fullName} added`);
      onOpenChange(false);
      onSaved?.(saved);
    } catch (error) {
      applyServerErrors(error, (field, message) => setError(field, { message }));
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-heading text-xl">
            {isEditing ? `Edit ${employee.fullName}` : 'Add employee'}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Update profile details. Use “Change salary” on the profile for pay changes.'
              : 'Their starting salary is recorded as the first entry in their salary history.'}
          </SheetDescription>
        </SheetHeader>

        <form id={formId} onSubmit={onSubmit} noValidate className="grid gap-4 px-4 pb-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id={fieldId('firstName')}
              label="First name"
              error={errors.firstName?.message}
            >
              <Input
                {...register('firstName')}
                {...fieldAria(fieldId('firstName'), errors.firstName?.message)}
                autoComplete="off"
              />
            </FormField>
            <FormField id={fieldId('lastName')} label="Last name" error={errors.lastName?.message}>
              <Input
                {...register('lastName')}
                {...fieldAria(fieldId('lastName'), errors.lastName?.message)}
                autoComplete="off"
              />
            </FormField>
          </div>

          <FormField id={fieldId('email')} label="Work email" error={errors.email?.message}>
            <Input
              type="email"
              {...register('email')}
              {...fieldAria(fieldId('email'), errors.email?.message)}
              autoComplete="off"
            />
          </FormField>

          <FormField id={fieldId('jobTitle')} label="Job title" error={errors.jobTitle?.message}>
            <Input
              list={fieldId('jobTitleSuggestions')}
              {...register('jobTitle')}
              {...fieldAria(fieldId('jobTitle'), errors.jobTitle?.message)}
              autoComplete="off"
            />
            <datalist id={fieldId('jobTitleSuggestions')}>
              {reference?.jobTitles.map((title) => (
                <option key={title} value={title} />
              ))}
            </datalist>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id={fieldId('department')}
              label="Department"
              error={errors.department?.message}
            >
              <Controller
                control={control}
                name="department"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger
                      className="w-full"
                      {...fieldAria(fieldId('department'), errors.department?.message)}
                    >
                      <SelectValue placeholder="Choose department" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {reference?.departments.map((department) => (
                        <SelectItem key={department} value={department}>
                          {department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField
              id={fieldId('employmentType')}
              label="Employment type"
              error={errors.employmentType?.message}
            >
              <Controller
                control={control}
                name="employmentType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full" {...fieldAria(fieldId('employmentType'))}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {(reference?.employmentTypes ?? ['full_time', 'part_time', 'contract']).map(
                        (type) => (
                          <SelectItem key={type} value={type}>
                            {formatEmploymentType(type)}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id={fieldId('countryCode')}
              label="Country"
              error={errors.countryCode?.message}
              hint={currency && `Paid in ${currency}`}
            >
              <Controller
                control={control}
                name="countryCode"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger
                      className="w-full"
                      {...fieldAria(fieldId('countryCode'), errors.countryCode?.message)}
                    >
                      <SelectValue placeholder="Choose country" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField id={fieldId('hireDate')} label="Hire date" error={errors.hireDate?.message}>
              <Input
                type="date"
                {...register('hireDate')}
                {...fieldAria(fieldId('hireDate'), errors.hireDate?.message)}
              />
            </FormField>
          </div>

          {(!isEditing || currencyChanges) && (
            <fieldset className="bg-petrol-soft/60 grid gap-4 rounded-lg p-4">
              {currencyChanges && <legend className="sr-only">New salary for relocation</legend>}
              {currencyChanges && (
                <p className="text-sm">
                  Moving to {selectedCountry?.name} changes pay from {employee.currency} to{' '}
                  {currency}. Their current salary is{' '}
                  {formatMoney(employee.annualSalary, employee.currency)}.
                </p>
              )}
              <FormField
                id={fieldId('annualSalary')}
                label={`Annual base salary${currency ? ` (${currency})` : ''}`}
                error={errors.annualSalary?.message}
              >
                <Input
                  inputMode="numeric"
                  placeholder="e.g. 85000"
                  {...register('annualSalary')}
                  {...fieldAria(fieldId('annualSalary'), errors.annualSalary?.message)}
                  className="bg-card tabular"
                />
              </FormField>
              {currencyChanges && (
                <FormField
                  id={fieldId('salaryReason')}
                  label="Reason for change"
                  error={errors.salaryReason?.message}
                >
                  <Input
                    placeholder="e.g. Relocation to Berlin office"
                    {...register('salaryReason')}
                    {...fieldAria(fieldId('salaryReason'), errors.salaryReason?.message)}
                    className="bg-card"
                  />
                </FormField>
              )}
            </fieldset>
          )}
        </form>

        <SheetFooter className="border-t sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={formState.isSubmitting}>
            {formState.isSubmitting ? 'Saving…' : isEditing ? 'Save changes' : 'Add employee'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Puts API validation errors on the matching fields; anything else (conflicts, business rules,
 * network failures) is shown as a toast with the server's explanation.
 */
function applyServerErrors(
  error: unknown,
  setFieldError: (field: Path<EmployeeFormValues>, message: string) => void,
) {
  if (!(error instanceof ApiError)) {
    toast.error('Something went wrong. Try again.');
    return;
  }

  if (error.code === 'CONFLICT') {
    setFieldError('email', error.message);
    return;
  }

  const fieldErrors = error.fieldErrors.filter((e) => FIELD_NAMES.has(e.path));
  fieldErrors.forEach((e) => setFieldError(e.path as Path<EmployeeFormValues>, e.message));
  if (fieldErrors.length === 0) {
    toast.error(error.message);
  }
}

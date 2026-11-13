import { useId, type ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Label, control, hint and error message, wired together for screen readers. */
export function FormField({ id, label, error, hint, className, children }: FormFieldProps) {
  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-destructive text-xs">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-muted-foreground text-xs">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

/** ARIA attributes for a control rendered inside `FormField`. */
export function fieldAria(id: string, error?: string) {
  return {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : `${id}-hint`,
  } as const;
}

/**
 * Returns an id factory unique to this form instance. Fixed ids break as soon as two copies of a
 * form are in the document (Next.js keeps the previous page mounted for instant back-navigation):
 * labels and `form=` attributes would then point at the hidden copy.
 */
export function useFieldIds(): (name: string) => string {
  const prefix = useId();
  return (name) => `${prefix}-${name}`;
}

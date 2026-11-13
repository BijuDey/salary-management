'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

/** Radix Select cannot represent an empty value, so "no filter" uses a sentinel. */
const ALL = '__all__';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  label: string;
  allLabel: string;
  value: string | undefined;
  options: FilterOption[];
  onChange: (value: string | undefined) => void;
  className?: string;
}

export function FilterSelect({
  label,
  allLabel,
  value,
  options,
  onChange,
  className,
}: FilterSelectProps) {
  return (
    <Select
      value={value ?? ALL}
      onValueChange={(next) => onChange(next === ALL ? undefined : next)}
    >
      <SelectTrigger aria-label={label} className={cn('w-full bg-card', className)}>
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent position="popper" className="max-h-80">
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

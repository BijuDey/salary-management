'use client';

import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface SearchableSelectProps {
  label: string;
  allLabel: string;
  value: string | undefined;
  options: string[];
  onChange: (value: string | undefined) => void;
  className?: string;
}

/** A select with type-to-filter, for long option lists such as job titles. */
export function SearchableSelect({
  label,
  allLabel,
  value,
  options,
  onChange,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);

  const choose = (next: string | undefined) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={label}
          className={cn('bg-card w-full justify-between font-normal', className)}
        >
          <span className={cn('truncate', !value && 'text-muted-foreground')}>
            {value ?? allLabel}
          </span>
          <ChevronsUpDown className="text-muted-foreground size-4" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${label.toLowerCase()}`} />
          <CommandList>
            <CommandEmpty>No match.</CommandEmpty>
            <CommandGroup>
              <CommandItem value={allLabel} onSelect={() => choose(undefined)}>
                <Check className={cn('size-4', value ? 'opacity-0' : 'opacity-100')} />
                {allLabel}
              </CommandItem>
              {options.map((option) => (
                <CommandItem key={option} value={option} onSelect={() => choose(option)}>
                  <Check className={cn('size-4', value === option ? 'opacity-100' : 'opacity-0')} />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

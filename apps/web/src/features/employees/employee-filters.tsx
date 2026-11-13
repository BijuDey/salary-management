'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FilterSelect } from '@/components/filter-select';
import { SearchableSelect } from '@/components/searchable-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useReferenceData } from '@/lib/queries';
import type { EmployeeListParams } from '@/lib/types';

interface EmployeeFiltersProps {
  params: EmployeeListParams;
  onChange: (changes: Partial<EmployeeListParams>) => void;
}

export function EmployeeFilters({ params, onChange }: EmployeeFiltersProps) {
  const { data: reference } = useReferenceData();
  const [searchText, setSearchText] = useState(params.search ?? '');
  const debouncedSearch = useDebouncedValue(searchText.trim());

  // Push the debounced search term to the URL; skip when it already matches.
  useEffect(() => {
    if (debouncedSearch !== (params.search ?? '')) {
      onChange({ search: debouncedSearch || undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the user typing
  }, [debouncedSearch]);

  const hasFilters = Boolean(
    params.search || params.country || params.department || params.jobTitle,
  );

  const clearAll = () => {
    setSearchText('');
    onChange({ search: undefined, country: undefined, department: undefined, jobTitle: undefined });
  };

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(16rem,2fr)_1fr_1fr_1fr_auto]">
      <div className="relative sm:col-span-2 lg:col-span-1">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          type="search"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search name, email or employee ID"
          aria-label="Search employees"
          className="bg-card pl-8"
        />
      </div>

      <FilterSelect
        label="Country"
        allLabel="All countries"
        value={params.country}
        options={(reference?.countries ?? []).map((c) => ({ value: c.code, label: c.name }))}
        onChange={(country) => onChange({ country })}
      />
      <FilterSelect
        label="Department"
        allLabel="All departments"
        value={params.department}
        options={(reference?.departments ?? []).map((d) => ({ value: d, label: d }))}
        onChange={(department) => onChange({ department })}
      />
      <SearchableSelect
        label="Job title"
        allLabel="All job titles"
        value={params.jobTitle}
        options={reference?.jobTitles ?? []}
        onChange={(jobTitle) => onChange({ jobTitle })}
      />

      <Button
        variant="ghost"
        onClick={clearAll}
        disabled={!hasFilters}
        className="text-muted-foreground justify-self-start"
      >
        <X aria-hidden />
        Clear
      </Button>
    </div>
  );
}

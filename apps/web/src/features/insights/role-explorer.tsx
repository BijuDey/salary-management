'use client';

import { useState } from 'react';
import { FilterSelect } from '@/components/filter-select';
import { PayBand } from '@/components/pay-band';
import { EmptyState, ErrorState } from '@/components/query-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatMoney, formatNumber } from '@/lib/format';
import { useReferenceData, useRoleInsights } from '@/lib/queries';
import { cn } from '@/lib/utils';

/**
 * Answers "what do we pay a <role> in <country>?". Scoped to a country, figures stay in local
 * currency; across all countries they are normalised to USD.
 */
export function RoleExplorer() {
  const { data: reference } = useReferenceData();
  const [country, setCountry] = useState<string>();
  const [department, setDepartment] = useState<string>();
  const { data, error, isFetching, refetch } = useRoleInsights(country, department);

  const roles = data?.roles ?? [];
  const domain = roles.length
    ? {
        min: Math.min(...roles.map((r) => r.salary.min)),
        max: Math.max(...roles.map((r) => r.salary.max)),
      }
    : undefined;

  return (
    <div>
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          {data?.country
            ? `Figures in ${data.currency}, the local currency in ${data.country.name}.`
            : 'Figures in USD across all countries. Pick a country to see local pay.'}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:w-[26rem]">
          <FilterSelect
            label="Country"
            allLabel="All countries"
            value={country}
            options={(reference?.countries ?? []).map((c) => ({ value: c.code, label: c.name }))}
            onChange={setCountry}
          />
          <FilterSelect
            label="Department"
            allLabel="All departments"
            value={department}
            options={(reference?.departments ?? []).map((d) => ({ value: d, label: d }))}
            onChange={setDepartment}
          />
        </div>
      </div>

      {error ? (
        <div className="p-4">
          <ErrorState error={error} onRetry={() => refetch()} />
        </div>
      ) : !data ? (
        <div className="grid gap-3 p-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
      ) : roles.length === 0 ? (
        <EmptyState
          title="Nobody in this combination"
          description="Try another country or department."
        />
      ) : (
        <Table className={cn('transition-opacity', isFetching && 'opacity-60')}>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Job title</TableHead>
              <TableHead className="text-right">Employees</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Middle 50%</TableHead>
              <TableHead className="text-right">Median</TableHead>
              <TableHead className="hidden w-[30%] lg:table-cell">Range</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.jobTitle}>
                <TableCell>
                  <div className="font-medium">{role.jobTitle}</div>
                  <div className="text-muted-foreground text-xs">{role.department}</div>
                </TableCell>
                <TableCell className="tabular text-right">{formatNumber(role.headcount)}</TableCell>
                <TableCell className="tabular text-muted-foreground hidden text-right sm:table-cell">
                  {formatMoney(role.salary.p25, data.currency)} –{' '}
                  {formatMoney(role.salary.p75, data.currency)}
                </TableCell>
                <TableCell className="tabular text-right font-medium">
                  {formatMoney(role.salary.median, data.currency)}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <PayBand stats={role.salary} currency={data.currency} domain={domain} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

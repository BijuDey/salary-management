'use client';

import type { ReactNode } from 'react';
import { PageHeader } from '@/components/page-header';
import { ErrorState } from '@/components/query-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatNumber } from '@/lib/format';
import { usePaySummary } from '@/lib/queries';
import { CountryPayTable } from './country-pay-table';
import { DepartmentChart } from './department-chart';
import { OverviewFigures } from './overview-figures';
import { RoleExplorer } from './role-explorer';
import { SalaryDistributionChart } from './salary-distribution-chart';

export function PayInsights() {
  const { data: summary, error, refetch } = usePaySummary();

  return (
    <>
      <PageHeader
        title="Pay insights"
        description={
          summary
            ? `How ACME pays its ${formatNumber(summary.overview.headcount)} people. Cross-country figures use reference exchange rates from ${formatDate(summary.exchangeRatesAsOf)}.`
            : 'How ACME pays its people, across countries, departments and roles.'
        }
      />

      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !summary ? (
        <InsightsSkeleton />
      ) : (
        <div className="grid gap-6">
          <OverviewFigures overview={summary.overview} />

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel
              title="Salary distribution"
              description="Employees per $20k salary range, in USD."
            >
              <SalaryDistributionChart buckets={summary.distribution} />
            </Panel>
            <Panel
              title="Median salary by department"
              description="In USD, highest first. Hover for ranges."
            >
              <DepartmentChart departments={summary.byDepartment} />
            </Panel>
          </div>

          <Panel
            title="Pay by country"
            description="Largest teams first. Select a country to see its people."
            flush
          >
            <CountryPayTable countries={summary.byCountry} />
          </Panel>

          <Panel
            title="Pay by role"
            description="Benchmark a job title within a country or across the organisation."
            flush
          >
            <RoleExplorer />
          </Panel>
        </div>
      )}
    </>
  );
}

interface PanelProps {
  title: string;
  description: string;
  /** Lets tables run edge to edge inside the panel. */
  flush?: boolean;
  children: ReactNode;
}

function Panel({ title, description, flush = false, children }: PanelProps) {
  return (
    <section className="bg-card overflow-hidden rounded-lg border">
      <header className={flush ? 'border-b px-4 py-4 sm:px-6' : 'px-6 pt-5'}>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </header>
      <div className={flush ? undefined : 'px-4 pt-4 pb-5 sm:px-6'}>{children}</div>
    </section>
  );
}

function InsightsSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Loading insights">
      <Skeleton className="h-28" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

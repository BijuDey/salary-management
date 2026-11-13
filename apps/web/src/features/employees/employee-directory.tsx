'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { EmptyState, ErrorState } from '@/components/query-state';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/format';
import { useEmployees } from '@/lib/queries';
import { nextSort } from './directory-params';
import { EmployeeFilters } from './employee-filters';
import { EmployeeFormSheet } from './employee-form-sheet';
import { EmployeeTable } from './employee-table';
import { PaginationBar } from './pagination-bar';
import { useDirectoryParams } from './use-directory-params';

export function EmployeeDirectory() {
  const router = useRouter();
  const { params, update } = useDirectoryParams();
  const { data, error, isFetching, refetch } = useEmployees(params);
  const [isAdding, setIsAdding] = useState(false);

  const isFiltered = Boolean(
    params.search || params.country || params.department || params.jobTitle,
  );
  const description = !data
    ? 'Find anyone in the organisation and manage their pay.'
    : isFiltered
      ? `${formatNumber(data.total)} of the organisation match your filters.`
      : `${formatNumber(data.total)} employees across the organisation.`;

  return (
    <>
      <PageHeader
        title="Employee directory"
        description={description}
        actions={
          <Button onClick={() => setIsAdding(true)}>
            <Plus aria-hidden />
            Add employee
          </Button>
        }
      />

      <EmployeeFilters params={params} onChange={update} />

      <section aria-label="Employees" className="bg-card mt-4 overflow-hidden rounded-lg border">
        {error ? (
          <div className="p-4">
            <ErrorState error={error} onRetry={() => refetch()} />
          </div>
        ) : data?.total === 0 ? (
          <EmptyState
            title="No employees match"
            description="Try a different search term or clear some filters."
          />
        ) : (
          <>
            <EmployeeTable
              employees={data?.data}
              params={params}
              isFetching={isFetching}
              onSort={(field) => update(nextSort(params, field))}
            />
            {data && (
              <PaginationBar
                page={data.page}
                pageSize={data.pageSize}
                total={data.total}
                totalPages={data.totalPages}
                onPageChange={(page) => update({ page })}
                onPageSizeChange={(pageSize) => update({ pageSize })}
              />
            )}
          </>
        )}
      </section>

      <EmployeeFormSheet
        open={isAdding}
        onOpenChange={setIsAdding}
        onSaved={(employee) => router.push(`/employees/${employee.id}`)}
      />
    </>
  );
}

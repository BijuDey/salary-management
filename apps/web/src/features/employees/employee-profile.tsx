'use client';

import { ArrowLeft, Pencil, Trash2, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { PayBand } from '@/components/pay-band';
import { EmptyState, ErrorState } from '@/components/query-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-client';
import { formatDate, formatEmploymentType, formatMoney } from '@/lib/format';
import { useEmployee, useRoleInsights } from '@/lib/queries';
import type { EmployeeDetail } from '@/lib/types';
import { DeleteEmployeeDialog } from './delete-employee-dialog';
import { EmployeeFormSheet } from './employee-form-sheet';
import { SalaryChangeDialog } from './salary-change-dialog';
import { SalaryHistory } from './salary-history';

type OpenDialog = 'edit' | 'salary' | 'delete' | null;

export function EmployeeProfile({ id }: { id: number }) {
  const router = useRouter();
  const { data: employee, error, refetch } = useEmployee(id);
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null);

  if (error instanceof ApiError && error.status === 404) {
    return (
      <EmptyState
        title="Employee not found"
        description="They may have been deleted, or the link is incorrect."
        action={
          <Button asChild variant="outline">
            <Link href="/employees">Back to directory</Link>
          </Button>
        }
      />
    );
  }
  if (error) {
    return <ErrorState error={error} onRetry={() => refetch()} />;
  }
  if (!employee) {
    return <ProfileSkeleton />;
  }

  const closeDialog = (open: boolean) => !open && setOpenDialog(null);

  return (
    <>
      <BackLink />

      <header className="mt-4 mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">{employee.fullName}</h1>
          <p className="text-muted-foreground mt-1">
            {employee.jobTitle} in {employee.department}, {employee.country.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setOpenDialog('salary')}>
            <TrendingUp aria-hidden />
            Change salary
          </Button>
          <Button variant="outline" onClick={() => setOpenDialog('edit')}>
            <Pencil aria-hidden />
            Edit details
          </Button>
          <Button variant="destructive" onClick={() => setOpenDialog('delete')}>
            <Trash2 aria-hidden />
            Delete
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="grid content-start gap-6">
          <CurrentPay employee={employee} />
          <section aria-labelledby="details-heading" className="bg-card rounded-lg border p-6">
            <h2 id="details-heading" className="text-lg font-semibold">
              Details
            </h2>
            <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <Detail label="Employee ID">{employee.employeeCode}</Detail>
              <Detail label="Work email">
                <a href={`mailto:${employee.email}`} className="hover:underline">
                  {employee.email}
                </a>
              </Detail>
              <Detail label="Employment type">
                {formatEmploymentType(employee.employmentType)}
              </Detail>
              <Detail label="Hire date">{formatDate(employee.hireDate)}</Detail>
              <Detail label="Country">{employee.country.name}</Detail>
              <Detail label="Pay currency">{employee.currency}</Detail>
            </dl>
          </section>
        </div>

        <section aria-labelledby="history-heading" className="bg-card rounded-lg border p-6">
          <h2 id="history-heading" className="mb-5 text-lg font-semibold">
            Salary history
          </h2>
          <SalaryHistory history={employee.salaryHistory} />
        </section>
      </div>

      <SalaryChangeDialog
        employee={employee}
        open={openDialog === 'salary'}
        onOpenChange={closeDialog}
      />
      <EmployeeFormSheet
        employee={employee}
        open={openDialog === 'edit'}
        onOpenChange={closeDialog}
      />
      <DeleteEmployeeDialog
        employee={employee}
        open={openDialog === 'delete'}
        onOpenChange={closeDialog}
        onDeleted={() => router.replace('/employees')}
      />
    </>
  );
}

/** Current pay, placed against everyone with the same title in the same country. */
function CurrentPay({ employee }: { employee: EmployeeDetail }) {
  const { data: roleInsights } = useRoleInsights(employee.country.code);
  const peers = roleInsights?.roles.find((role) => role.jobTitle === employee.jobTitle);

  return (
    <section
      aria-labelledby="pay-heading"
      className="bg-petrol text-primary-foreground rounded-lg p-6"
    >
      <h2 id="pay-heading" className="text-primary-foreground/75 text-sm font-normal">
        Annual base salary
      </h2>
      <p className="font-heading tabular mt-1 text-4xl font-semibold sm:text-5xl">
        {formatMoney(employee.annualSalary, employee.currency)}
      </p>
      {employee.currency !== 'USD' && (
        <p className="text-primary-foreground/75 tabular mt-1 text-sm">
          About {formatMoney(employee.annualSalaryUsd, 'USD')} at reference rates
        </p>
      )}

      {peers && peers.headcount > 1 && (
        <div className="bg-card text-card-foreground mt-6 rounded-md p-4">
          <p className="text-sm">
            Compared with {peers.headcount - 1} other {employee.jobTitle.toLowerCase()}
            {peers.headcount > 2 ? 's' : ''} in {employee.country.name}
          </p>
          <PayBand
            stats={peers.salary}
            currency={employee.currency}
            marker={employee.annualSalary}
            className="mt-3"
          />
          <div className="text-muted-foreground tabular mt-1 flex justify-between text-xs">
            <span>
              {formatMoney(Math.min(peers.salary.min, employee.annualSalary), employee.currency)}
            </span>
            <span>Median {formatMoney(peers.salary.median, employee.currency)}</span>
            <span>
              {formatMoney(Math.max(peers.salary.max, employee.annualSalary), employee.currency)}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="mt-0.5 truncate">{children}</dd>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/employees"
      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Directory
    </Link>
  );
}

function ProfileSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading employee">
      <BackLink />
      <Skeleton className="mt-4 h-10 w-72" />
      <Skeleton className="mt-2 h-5 w-96 max-w-full" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

'use client';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate, formatEmploymentType, formatMoney } from '@/lib/format';
import type { Employee, EmployeeListParams, SortField } from '@/lib/types';
import { cn } from '@/lib/utils';

interface EmployeeTableProps {
  employees: Employee[] | undefined;
  params: EmployeeListParams;
  onSort: (field: SortField) => void;
  isFetching: boolean;
}

export function EmployeeTable({ employees, params, onSort, isFetching }: EmployeeTableProps) {
  const router = useRouter();

  return (
    <Table className={cn('transition-opacity', isFetching && employees && 'opacity-60')}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <SortableHead field="name" params={params} onSort={onSort}>
            Employee
          </SortableHead>
          <TableHead>Role</TableHead>
          <TableHead className="hidden lg:table-cell">Country</TableHead>
          <SortableHead field="salary" params={params} onSort={onSort} align="right">
            Annual salary
          </SortableHead>
          <SortableHead
            field="hireDate"
            params={params}
            onSort={onSort}
            className="hidden md:table-cell"
          >
            Hired
          </SortableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees
          ? employees.map((employee) => (
              <TableRow
                key={employee.id}
                onClick={() => router.push(`/employees/${employee.id}`)}
                className="cursor-pointer"
              >
                <TableCell className="py-3">
                  <Link
                    href={`/employees/${employee.id}`}
                    className="font-medium hover:underline focus-visible:underline"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {employee.fullName}
                  </Link>
                  <div className="text-muted-foreground text-xs">
                    {employee.employeeCode}
                    <span className="hidden sm:inline">, {employee.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div>{employee.jobTitle}</div>
                  <div className="text-muted-foreground text-xs">
                    {employee.department}
                    {employee.employmentType !== 'full_time' &&
                      `, ${formatEmploymentType(employee.employmentType).toLowerCase()}`}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">{employee.country.name}</TableCell>
                <TableCell className="tabular text-right">
                  <div className="font-medium">
                    {formatMoney(employee.annualSalary, employee.currency)}
                  </div>
                  {employee.currency !== 'USD' && (
                    <div className="text-muted-foreground text-xs">
                      ≈ {formatMoney(employee.annualSalaryUsd, 'USD')}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground tabular hidden md:table-cell">
                  {formatDate(employee.hireDate)}
                </TableCell>
              </TableRow>
            ))
          : Array.from({ length: 8 }, (_, index) => <SkeletonRow key={index} />)}
      </TableBody>
    </Table>
  );
}

interface SortableHeadProps {
  field: SortField;
  params: EmployeeListParams;
  onSort: (field: SortField) => void;
  align?: 'left' | 'right';
  className?: string;
  children: React.ReactNode;
}

function SortableHead({
  field,
  params,
  onSort,
  align = 'left',
  className,
  children,
}: SortableHeadProps) {
  const active = params.sortBy === field;
  const Icon = !active ? ArrowUpDown : params.sortOrder === 'asc' ? ArrowUp : ArrowDown;

  return (
    <TableHead
      aria-sort={active ? (params.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn(align === 'right' && 'text-right', className)}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          'hover:text-foreground inline-flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
          active && 'text-foreground',
        )}
      >
        {children}
        <Icon className={cn('size-3.5', !active && 'opacity-40')} aria-hidden />
      </button>
    </TableHead>
  );
}

function SkeletonRow() {
  return (
    <TableRow>
      <TableCell className="py-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-1.5 h-3 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="ml-auto h-4 w-20" />
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Skeleton className="h-4 w-20" />
      </TableCell>
    </TableRow>
  );
}

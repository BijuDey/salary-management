import type { Metadata } from 'next';
import { Suspense } from 'react';
import { EmployeeDirectory } from '@/features/employees/employee-directory';

export const metadata: Metadata = { title: 'Employee directory' };

export default function EmployeesPage() {
  // The directory reads its state from the URL, which is only known in the browser.
  return (
    <Suspense>
      <EmployeeDirectory />
    </Suspense>
  );
}

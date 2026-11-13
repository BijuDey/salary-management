import { Suspense } from 'react';
import { EmployeeProfile } from '@/features/employees/employee-profile';

export default function EmployeePage({ params }: PageProps<'/employees/[id]'>) {
  return (
    <Suspense>
      <EmployeeProfileForRoute params={params} />
    </Suspense>
  );
}

async function EmployeeProfileForRoute({ params }: Pick<PageProps<'/employees/[id]'>, 'params'>) {
  const { id } = await params;
  return <EmployeeProfile id={Number(id)} />;
}

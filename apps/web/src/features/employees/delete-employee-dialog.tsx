'use client';

import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ApiError } from '@/lib/api-client';
import { useDeleteEmployee } from '@/lib/queries';
import type { Employee } from '@/lib/types';

interface DeleteEmployeeDialogProps {
  employee: Employee;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function DeleteEmployeeDialog({
  employee,
  open,
  onOpenChange,
  onDeleted,
}: DeleteEmployeeDialogProps) {
  const deleteEmployee = useDeleteEmployee();

  const confirm = async () => {
    try {
      await deleteEmployee.mutateAsync(employee.id);
      toast.success(`${employee.fullName} deleted`);
      onDeleted();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not delete the employee.');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {employee.fullName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes their record and salary history. Pay insights will no longer
            include them. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep employee</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(event) => {
              event.preventDefault();
              void confirm();
            }}
            disabled={deleteEmployee.isPending}
          >
            {deleteEmployee.isPending ? 'Deleting…' : 'Delete employee'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

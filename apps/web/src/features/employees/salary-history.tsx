import { formatChange, formatDate, formatMoney } from '@/lib/format';
import type { SalaryChange } from '@/lib/types';
import { cn } from '@/lib/utils';

/** Pay changes as a timeline, most recent first; every entry carries its reason. */
export function SalaryHistory({ history }: { history: SalaryChange[] }) {
  return (
    <ol className="relative grid gap-6 border-l pl-6">
      {history.map((change, index) => {
        const isCurrent = index === 0;
        const isIncrease =
          change.previousSalary !== null && change.newSalary >= change.previousSalary;

        return (
          <li key={change.id} className="relative">
            <span
              aria-hidden
              className={cn(
                'absolute top-1.5 -left-[1.95rem] size-3 rounded-full border-2',
                isCurrent ? 'border-petrol bg-brass' : 'bg-card border-muted-foreground/40',
              )}
            />
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <p className="tabular text-lg font-semibold">
                {formatMoney(change.newSalary, change.currency)}
              </p>
              <time
                className="text-muted-foreground tabular text-sm"
                dateTime={change.effectiveDate}
              >
                {formatDate(change.effectiveDate)}
              </time>
            </div>
            <p className="text-sm">
              {change.reason}
              {change.previousSalary !== null && (
                <span
                  className={cn(
                    'tabular ml-2 text-xs font-medium',
                    isIncrease ? 'text-petrol' : 'text-destructive',
                  )}
                >
                  {formatChange(change.previousSalary, change.newSalary)}
                </span>
              )}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

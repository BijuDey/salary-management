import type { ReactNode } from 'react';

/** Tooltip body shared by the insight charts: a title and label/value rows in text ink. */
export function ChartTooltip({ title, rows }: { title: ReactNode; rows: [string, ReactNode][] }) {
  return (
    <div className="bg-popover text-popover-foreground rounded-md border px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium">{title}</p>
      <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="tabular text-right">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

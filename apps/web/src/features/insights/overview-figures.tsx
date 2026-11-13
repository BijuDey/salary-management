import { formatCompactMoney, formatMoney, formatNumber } from '@/lib/format';
import type { PaySummary } from '@/lib/types';

/** The four numbers HR is asked for most, in one row. */
export function OverviewFigures({ overview }: { overview: PaySummary['overview'] }) {
  const stats = overview.salaryUsd;

  const figures = [
    {
      label: 'Employees',
      value: formatNumber(overview.headcount),
      note: `in ${overview.countryCount} countries`,
    },
    {
      label: 'Annual payroll',
      value: formatCompactMoney(overview.annualPayrollUsd, 'USD'),
      note: 'base salary, all countries',
    },
    {
      label: 'Median salary',
      value: stats ? formatMoney(stats.median, 'USD') : '–',
      note: 'half earn more, half less',
    },
    {
      label: 'Middle 50% earn',
      value: stats
        ? `${formatCompactMoney(stats.p25, 'USD')} – ${formatCompactMoney(stats.p75, 'USD')}`
        : '–',
      note: '25th to 75th percentile',
    },
  ];

  return (
    <dl className="bg-card grid divide-y rounded-lg border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
      {figures.map((figure) => (
        <div key={figure.label} className="px-6 py-5">
          <dt className="text-muted-foreground text-sm">{figure.label}</dt>
          <dd className="font-heading tabular mt-1 text-3xl font-semibold">{figure.value}</dd>
          <dd className="text-muted-foreground mt-0.5 text-xs">{figure.note}</dd>
        </div>
      ))}
    </dl>
  );
}

'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCompactMoney, formatMoney, formatNumber } from '@/lib/format';
import type { HistogramBucket } from '@/lib/types';
import { ChartTooltip } from './chart-tooltip';

const AXIS_TICK = { fill: 'var(--muted-foreground)', fontSize: 12 };

/** How many people earn within each USD salary range: shows banding, skew and outliers. */
export function SalaryDistributionChart({ buckets }: { buckets: HistogramBucket[] }) {
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const data = buckets.map((bucket) => ({
    ...bucket,
    label: formatCompactMoney(bucket.from, 'USD'),
  }));

  return (
    <div className="h-72" role="img" aria-label="Histogram of employee salaries in USD">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatNumber}
            width={48}
          />
          <Tooltip
            cursor={{ fill: 'var(--muted)' }}
            content={({ active, payload }) => {
              const bucket = active
                ? (payload?.[0]?.payload as HistogramBucket | undefined)
                : undefined;
              if (!bucket) return null;
              return (
                <ChartTooltip
                  title={`${formatMoney(bucket.from, 'USD')} – ${formatMoney(bucket.to, 'USD')}`}
                  rows={[
                    ['Employees', formatNumber(bucket.count)],
                    ['Share', `${((bucket.count / total) * 100).toFixed(1)}%`],
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="count" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

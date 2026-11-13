'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCompactMoney, formatMoney, formatNumber } from '@/lib/format';
import type { DepartmentPay } from '@/lib/types';
import { ChartTooltip } from './chart-tooltip';
import { axisTick, chartTheme } from './chart-theme';

/** Median USD salary per department, highest first, with the value at each bar tip. */
export function DepartmentChart({ departments }: { departments: DepartmentPay[] }) {
  const data = departments.map((d) => ({ ...d, median: d.salaryUsd.median }));

  return (
    <div className="h-80" role="img" aria-label="Median salary by department in USD">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 56, bottom: 0, left: 0 }}
          barCategoryGap={6}
        >
          <CartesianGrid horizontal={false} stroke={chartTheme.grid} />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="department"
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={124}
          />
          <Tooltip
            cursor={{ fill: chartTheme.hover }}
            content={({ active, payload }) => {
              const department = active
                ? (payload?.[0]?.payload as DepartmentPay | undefined)
                : undefined;
              if (!department) return null;
              return (
                <ChartTooltip
                  title={department.department}
                  rows={[
                    ['Median', formatMoney(department.salaryUsd.median, 'USD')],
                    [
                      'Middle 50%',
                      `${formatCompactMoney(department.salaryUsd.p25, 'USD')} – ${formatCompactMoney(department.salaryUsd.p75, 'USD')}`,
                    ],
                    ['Employees', formatNumber(department.headcount)],
                    ['Annual payroll', formatCompactMoney(department.annualPayrollUsd, 'USD')],
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="median" fill={chartTheme.mark} radius={[0, 4, 4, 0]} maxBarSize={20}>
            <LabelList
              dataKey="median"
              position="right"
              formatter={(value) => formatCompactMoney(Number(value), 'USD')}
              style={{ fill: chartTheme.labelText, fontSize: 12 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

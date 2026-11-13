import Link from 'next/link';
import { PayBand } from '@/components/pay-band';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCompactMoney, formatMoney, formatNumber } from '@/lib/format';
import type { CountryPay } from '@/lib/types';

/**
 * Pay per country. Local medians are what the HR team negotiates in; the bands share one USD
 * axis so markets can be compared by eye.
 */
export function CountryPayTable({ countries }: { countries: CountryPay[] }) {
  const domain = {
    min: Math.min(...countries.map((c) => c.salaryUsd.min)),
    max: Math.max(...countries.map((c) => c.salaryUsd.max)),
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Country</TableHead>
          <TableHead className="text-right">Employees</TableHead>
          <TableHead className="hidden text-right md:table-cell">Payroll (USD)</TableHead>
          <TableHead className="text-right">Median (local)</TableHead>
          <TableHead className="text-right">Median (USD)</TableHead>
          <TableHead className="hidden w-[28%] lg:table-cell">
            Salary range in USD, on a shared scale
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {countries.map((country) => (
          <TableRow key={country.countryCode}>
            <TableCell>
              <Link
                href={`/employees?country=${country.countryCode}`}
                className="font-medium hover:underline"
              >
                {country.countryName}
              </Link>
              <span className="text-muted-foreground ml-1.5 text-xs">{country.currency}</span>
            </TableCell>
            <TableCell className="tabular text-right">{formatNumber(country.headcount)}</TableCell>
            <TableCell className="tabular hidden text-right md:table-cell">
              {formatCompactMoney(country.annualPayrollUsd, 'USD')}
            </TableCell>
            <TableCell className="tabular text-right">
              {formatMoney(country.salaryLocal.median, country.currency)}
            </TableCell>
            <TableCell className="tabular text-right font-medium">
              {formatMoney(country.salaryUsd.median, 'USD')}
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <PayBand stats={country.salaryUsd} currency="USD" domain={domain} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

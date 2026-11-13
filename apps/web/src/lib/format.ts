const moneyFormatters = new Map<string, Intl.NumberFormat>();

/** "€85,000", "₹2,500,000". Formatters are cached; Intl construction is comparatively slow. */
export function formatMoney(amount: number, currency: string): string {
  let formatter = moneyFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });
    moneyFormatters.set(currency, formatter);
  }
  return formatter.format(amount);
}

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** "$1.2M", "₹25L" style short figures for charts and dense tables. */
export function formatCompactMoney(amount: number, currency: string): string {
  const symbol = formatMoney(0, currency).replace(/[\d.,\s]/g, '');
  return `${symbol}${compactFormatter.format(amount)}`;
}

const integerFormatter = new Intl.NumberFormat('en-US');

export function formatNumber(value: number): string {
  return integerFormatter.format(value);
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "2024-03-01" → "1 Mar 2024" (unambiguous for an international HR team). */
export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}

/** Percentage change between two amounts, e.g. +8.5%. */
export function formatChange(previous: number, next: number): string {
  const change = ((next - previous) / previous) * 100;
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
};

export function formatEmploymentType(type: string): string {
  return EMPLOYMENT_TYPE_LABELS[type] ?? type;
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

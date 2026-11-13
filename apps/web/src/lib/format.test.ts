import { describe, expect, it } from 'vitest';
import {
  formatChange,
  formatCompactMoney,
  formatDate,
  formatEmploymentType,
  formatMoney,
} from './format';

describe('formatMoney', () => {
  it('formats whole amounts with the currency symbol', () => {
    expect(formatMoney(85_000, 'EUR')).toBe('€85,000');
    expect(formatMoney(2_500_000, 'INR')).toBe('₹2,500,000');
  });

  it('drops fractions, since salaries are stored in whole units', () => {
    expect(formatMoney(1_234.6, 'USD')).toBe('$1,235');
  });
});

describe('formatCompactMoney', () => {
  it('abbreviates large figures for charts', () => {
    expect(formatCompactMoney(772_700_000, 'USD')).toBe('$772.7M');
    expect(formatCompactMoney(43_600, 'USD')).toBe('$43.6K');
  });
});

describe('formatDate', () => {
  it('renders an unambiguous day-month-year date regardless of timezone', () => {
    expect(formatDate('2024-03-01')).toBe('1 Mar 2024');
  });
});

describe('formatChange', () => {
  it('signs increases and decreases', () => {
    expect(formatChange(80_000, 88_000)).toBe('+10.0%');
    expect(formatChange(80_000, 72_000)).toBe('-10.0%');
  });
});

describe('formatEmploymentType', () => {
  it('maps API values to readable labels', () => {
    expect(formatEmploymentType('part_time')).toBe('Part-time');
  });
});

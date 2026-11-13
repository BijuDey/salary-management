import { describe, expect, it } from 'vitest';
import { toUsd } from './currency.js';

describe('toUsd', () => {
  it('converts using the rate of one local unit in USD', () => {
    expect(toUsd(100_000, 1.08)).toBe(108_000);
  });

  it('rounds to whole dollars', () => {
    expect(toUsd(2_500_000, 0.012)).toBe(30_000);
    expect(toUsd(1_001, 0.5)).toBe(501);
  });

  it('rejects non-positive rates', () => {
    expect(() => toUsd(1_000, 0)).toThrow(RangeError);
  });
});

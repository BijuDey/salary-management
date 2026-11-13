import { describe, expect, it } from 'vitest';
import { histogram, percentile, summarize } from './statistics.js';

describe('percentile', () => {
  it('returns the middle value of an odd-length list as the median', () => {
    expect(percentile([10, 20, 30], 0.5)).toBe(20);
  });

  it('interpolates between the two middle values of an even-length list', () => {
    expect(percentile([10, 20, 30, 40], 0.5)).toBe(25);
  });

  it('matches spreadsheet PERCENTILE.INC for quartiles', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(percentile(values, 0.25)).toBe(2.75);
    expect(percentile(values, 0.75)).toBe(6.25);
  });

  it('returns the extremes at 0 and 1', () => {
    expect(percentile([5, 9, 12], 0)).toBe(5);
    expect(percentile([5, 9, 12], 1)).toBe(12);
  });

  it('rejects empty input and out-of-range percentiles', () => {
    expect(() => percentile([], 0.5)).toThrow(RangeError);
    expect(() => percentile([1], 1.5)).toThrow(RangeError);
  });
});

describe('summarize', () => {
  it('returns null when there are no values', () => {
    expect(summarize([])).toBeNull();
  });

  it('computes summary statistics regardless of input order', () => {
    expect(summarize([50_000, 30_000, 100_000, 40_000])).toEqual({
      count: 4,
      min: 30_000,
      max: 100_000,
      mean: 55_000,
      median: 45_000,
      p25: 37_500,
      p75: 62_500,
      total: 220_000,
    });
  });

  it('does not mutate the input', () => {
    const values = [3, 1, 2];
    summarize(values);
    expect(values).toEqual([3, 1, 2]);
  });
});

describe('histogram', () => {
  it('groups values into buckets aligned to the bucket size', () => {
    expect(histogram([12_000, 18_000, 25_000, 29_999, 31_000], 10_000)).toEqual([
      { from: 10_000, to: 20_000, count: 2 },
      { from: 20_000, to: 30_000, count: 2 },
      { from: 30_000, to: 40_000, count: 1 },
    ]);
  });

  it('places a value equal to the upper boundary in the last bucket', () => {
    expect(histogram([0, 10], 10)).toEqual([{ from: 0, to: 10, count: 2 }]);
  });

  it('returns a single bucket when all values are equal', () => {
    expect(histogram([500, 500], 100)).toEqual([{ from: 500, to: 600, count: 2 }]);
  });

  it('returns no buckets for empty input', () => {
    expect(histogram([], 1_000)).toEqual([]);
  });
});

export interface SalaryStats {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  p25: number;
  p75: number;
  total: number;
}

/**
 * Percentile using linear interpolation between closest ranks (the same method as
 * Excel's PERCENTILE.INC), so figures match what HR is used to seeing in spreadsheets.
 *
 * @param sorted values in ascending order (not validated, for performance)
 * @param percentile between 0 and 1
 */
export function percentile(sorted: readonly number[], percentile: number): number {
  if (sorted.length === 0) {
    throw new RangeError('Cannot compute a percentile of an empty list');
  }
  if (percentile < 0 || percentile > 1) {
    throw new RangeError(`Percentile must be between 0 and 1, received ${percentile}`);
  }

  const rank = (sorted.length - 1) * percentile;
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  const lowerValue = sorted[lower]!;
  const upperValue = sorted[upper]!;

  return lowerValue + (upperValue - lowerValue) * (rank - lower);
}

/** Summary statistics for a set of salaries, or `null` when there is nothing to summarise. */
export function summarize(values: readonly number[]): SalaryStats | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const total = sorted.reduce((sum, value) => sum + value, 0);

  return {
    count: sorted.length,
    min: sorted[0]!,
    max: sorted[sorted.length - 1]!,
    mean: total / sorted.length,
    median: percentile(sorted, 0.5),
    p25: percentile(sorted, 0.25),
    p75: percentile(sorted, 0.75),
    total,
  };
}

export interface HistogramBucket {
  /** Inclusive lower bound. */
  from: number;
  /** Exclusive upper bound (the last bucket also includes values equal to it). */
  to: number;
  count: number;
}

/**
 * Groups values into equal-width buckets with "nice" boundaries (multiples of `bucketSize`).
 */
export function histogram(values: readonly number[], bucketSize: number): HistogramBucket[] {
  if (bucketSize <= 0) {
    throw new RangeError('Bucket size must be positive');
  }
  if (values.length === 0) {
    return [];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const start = Math.floor(min / bucketSize) * bucketSize;
  const bucketCount = Math.max(1, Math.ceil((max - start) / bucketSize));
  const buckets: HistogramBucket[] = Array.from({ length: bucketCount }, (_, i) => ({
    from: start + i * bucketSize,
    to: start + (i + 1) * bucketSize,
    count: 0,
  }));

  for (const value of values) {
    const index = Math.min(Math.floor((value - start) / bucketSize), bucketCount - 1);
    buckets[index]!.count += 1;
  }

  return buckets;
}

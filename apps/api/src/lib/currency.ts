/**
 * Converts a local-currency amount to USD, rounded to whole dollars.
 * Used only for cross-country comparison, never for storing pay.
 *
 * @param usdRate value of one unit of the local currency in USD
 */
export function toUsd(amount: number, usdRate: number): number {
  if (usdRate <= 0) {
    throw new RangeError(`Exchange rate must be positive, received ${usdRate}`);
  }
  return Math.round(amount * usdRate);
}

import type { CountryRow } from '../db/schema.js';

/**
 * Fixed reference exchange rates (value of one local unit in USD). Pinning rates keeps
 * analytics reproducible; refreshing them is an explicit, auditable data change.
 */
export const EXCHANGE_RATES_AS_OF = '2026-01-01';

export const COUNTRIES: readonly CountryRow[] = [
  { code: 'US', name: 'United States', currency: 'USD', usdRate: 1 },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', usdRate: 1.27 },
  { code: 'DE', name: 'Germany', currency: 'EUR', usdRate: 1.09 },
  { code: 'FR', name: 'France', currency: 'EUR', usdRate: 1.09 },
  { code: 'NL', name: 'Netherlands', currency: 'EUR', usdRate: 1.09 },
  { code: 'ES', name: 'Spain', currency: 'EUR', usdRate: 1.09 },
  { code: 'IN', name: 'India', currency: 'INR', usdRate: 0.012 },
  { code: 'BR', name: 'Brazil', currency: 'BRL', usdRate: 0.18 },
  { code: 'CA', name: 'Canada', currency: 'CAD', usdRate: 0.73 },
  { code: 'AU', name: 'Australia', currency: 'AUD', usdRate: 0.66 },
];

import { EXCHANGE_RATES_AS_OF } from '../../domain/countries.js';
import { BusinessRuleError } from '../../lib/errors.js';
import type { ReferenceRepository } from '../reference/reference.repository.js';
import {
  buildPaySummary,
  buildRoleBreakdown,
  type PaySummary,
  type RolePay,
} from './insights.calculations.js';
import type { InsightsRepository } from './insights.repository.js';
import type { RoleInsightsQuery } from './insights.schemas.js';

export interface PaySummaryResponse extends PaySummary {
  currency: 'USD';
  exchangeRatesAsOf: string;
}

export interface RoleInsightsResponse {
  /** Currency the role figures are expressed in. */
  currency: string;
  country: { code: string; name: string } | null;
  roles: RolePay[];
}

export class InsightsService {
  constructor(
    private readonly insights: InsightsRepository,
    private readonly reference: ReferenceRepository,
  ) {}

  summary(): PaySummaryResponse {
    return {
      currency: 'USD',
      exchangeRatesAsOf: EXCHANGE_RATES_AS_OF,
      ...buildPaySummary(this.insights.payRecords()),
    };
  }

  roles({ country: countryCode, department }: RoleInsightsQuery): RoleInsightsResponse {
    const country = countryCode ? this.reference.findCountry(countryCode) : undefined;
    if (countryCode && !country) {
      throw new BusinessRuleError(`Unknown country code ${countryCode}`);
    }

    const records = this.insights.payRecords({ countryCode, department });

    return {
      currency: country?.currency ?? 'USD',
      country: country ? { code: country.code, name: country.name } : null,
      roles: buildRoleBreakdown(records, { inLocalCurrency: country !== undefined }),
    };
  }
}

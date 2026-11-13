import type { FastifyPluginAsync } from 'fastify';
import { EXCHANGE_RATES_AS_OF } from '../../domain/countries.js';
import { DEPARTMENTS, EMPLOYMENT_TYPES } from '../../domain/employee.js';
import type { ReferenceRepository } from './reference.repository.js';

/** Lookup data the UI needs for filters and forms, fetched once per session. */
export const referenceRoutes: FastifyPluginAsync<{ repository: ReferenceRepository }> = async (
  app,
  { repository },
) => {
  app.get('/', async () => ({
    countries: repository.countries(),
    departments: DEPARTMENTS,
    employmentTypes: EMPLOYMENT_TYPES,
    jobTitles: repository.jobTitles(),
    exchangeRatesAsOf: EXCHANGE_RATES_AS_OF,
  }));
};

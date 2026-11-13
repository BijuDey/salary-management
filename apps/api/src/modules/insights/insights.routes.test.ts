import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDatabase } from '../../seed/seed-database.js';
import { authenticatedInject, buildTestApp, signIn } from '../../test-utils/app.js';
import { createTestDatabase } from '../../test-utils/database.js';

describe('Insights and reference routes', () => {
  let app: FastifyInstance;
  let inject: ReturnType<typeof authenticatedInject>;

  beforeAll(async () => {
    const db = createTestDatabase();
    seedDatabase(db, { count: 500 });
    app = await buildTestApp(db);
    inject = authenticatedInject(app, await signIn(app));
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/insights/summary returns org-wide pay analytics', async () => {
    const response = await inject({ url: '/api/insights/summary' });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.currency).toBe('USD');
    expect(body.overview.headcount).toBe(500);
    expect(
      body.byCountry.reduce((sum: number, c: { headcount: number }) => sum + c.headcount, 0),
    ).toBe(500);
    expect(body.distribution.length).toBeGreaterThan(0);
  });

  it('GET /api/insights/roles?country=DE reports in the local currency', async () => {
    const response = await inject({ url: '/api/insights/roles?country=de' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      currency: 'EUR',
      country: { code: 'DE', name: 'Germany' },
    });
  });

  it('GET /api/insights/roles without a country reports in USD', async () => {
    const response = await inject({ url: '/api/insights/roles?department=Engineering' });
    const body = response.json();

    expect(body.currency).toBe('USD');
    expect(body.country).toBeNull();
    body.roles.forEach((role: { department: string }) =>
      expect(role.department).toBe('Engineering'),
    );
  });

  it('GET /api/insights/roles rejects an unknown country', async () => {
    const response = await inject({ url: '/api/insights/roles?country=ZZ' });
    expect(response.statusCode).toBe(422);
  });

  it('GET /api/reference returns lookup data for filters and forms', async () => {
    const body = (await inject({ url: '/api/reference' })).json();

    expect(body.countries).toHaveLength(10);
    expect(body.departments).toContain('Engineering');
    expect(body.jobTitles).toContain('Software Engineer');
    expect(body.exchangeRatesAsOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

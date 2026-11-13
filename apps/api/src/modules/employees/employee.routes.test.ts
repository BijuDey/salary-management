import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.js';
import { createTestDatabase } from '../../test-utils/database.js';
import { buildEmployeeInput } from '../../test-utils/factories.js';

describe('Employee routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp({ db: createTestDatabase() });
  });

  afterEach(async () => {
    await app.close();
  });

  const createEmployee = (body: object = buildEmployeeInput()) =>
    app.inject({ method: 'POST', url: '/api/employees', payload: body });

  it('POST /api/employees creates an employee and returns 201 with a location header', async () => {
    const response = await createEmployee();

    expect(response.statusCode).toBe(201);
    expect(response.headers.location).toBe(`/api/employees/${response.json().id}`);
    expect(response.json()).toMatchObject({ employeeCode: 'EMP-00001', currency: 'GBP' });
  });

  it('POST /api/employees returns 400 with field-level details for invalid input', async () => {
    const response = await createEmployee({
      ...buildEmployeeInput(),
      email: 'not-an-email',
      annualSalary: -5,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('VALIDATION_ERROR');
    expect(response.json().error.details.map((d: { path: string }) => d.path)).toEqual(
      expect.arrayContaining(['email', 'annualSalary']),
    );
  });

  it('POST /api/employees returns 409 for a duplicate email', async () => {
    await createEmployee(buildEmployeeInput({ email: 'same@acme.com' }));
    const response = await createEmployee(buildEmployeeInput({ email: 'same@acme.com' }));

    expect(response.statusCode).toBe(409);
  });

  it('GET /api/employees returns a paginated list', async () => {
    await createEmployee();
    await createEmployee();

    const response = await app.inject({ url: '/api/employees?pageSize=1' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ total: 2, totalPages: 2, page: 1 });
  });

  it('GET /api/employees rejects an invalid page size', async () => {
    const response = await app.inject({ url: '/api/employees?pageSize=1000' });
    expect(response.statusCode).toBe(400);
  });

  it('GET /api/employees/:id returns the employee with salary history', async () => {
    const { id } = (await createEmployee()).json();

    const response = await app.inject({ url: `/api/employees/${id}` });

    expect(response.statusCode).toBe(200);
    expect(response.json().salaryHistory).toHaveLength(1);
  });

  it('GET /api/employees/:id returns 404 for an unknown employee', async () => {
    const response = await app.inject({ url: '/api/employees/999' });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('NOT_FOUND');
  });

  it('PATCH /api/employees/:id returns 422 when a business rule is broken', async () => {
    const { id } = (await createEmployee(buildEmployeeInput({ countryCode: 'GB' }))).json();

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/employees/${id}`,
      payload: { countryCode: 'IN' },
    });

    expect(response.statusCode).toBe(422);
  });

  it('PATCH /api/employees/:id rejects an empty update', async () => {
    const { id } = (await createEmployee()).json();

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/employees/${id}`,
      payload: {},
    });

    expect(response.statusCode).toBe(400);
  });

  it('DELETE /api/employees/:id returns 204 and the employee is gone', async () => {
    const { id } = (await createEmployee()).json();

    const response = await app.inject({ method: 'DELETE', url: `/api/employees/${id}` });

    expect(response.statusCode).toBe(204);
    expect((await app.inject({ url: `/api/employees/${id}` })).statusCode).toBe(404);
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const response = await app.inject({ url: '/api/nope' });
    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('NOT_FOUND');
  });
});

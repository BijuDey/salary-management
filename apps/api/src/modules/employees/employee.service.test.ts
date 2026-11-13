import { beforeEach, describe, expect, it } from 'vitest';
import { BusinessRuleError, ConflictError, NotFoundError } from '../../lib/errors.js';
import { createTestDatabase } from '../../test-utils/database.js';
import { buildEmployeeInput } from '../../test-utils/factories.js';
import { EmployeeRepository } from './employee.repository.js';
import { listEmployeesQuerySchema } from './employee.schemas.js';
import { EmployeeService } from './employee.service.js';

const TODAY = '2026-11-13';
const query = (params: Record<string, unknown> = {}) => listEmployeesQuerySchema.parse(params);

describe('EmployeeService', () => {
  let service: EmployeeService;

  beforeEach(() => {
    service = new EmployeeService(new EmployeeRepository(createTestDatabase()), () => TODAY);
  });

  describe('create', () => {
    it('creates an employee with a generated code and an initial salary history entry', () => {
      const employee = service.create(buildEmployeeInput({ annualSalary: 90_000 }));

      expect(employee).toMatchObject({
        employeeCode: 'EMP-00001',
        fullName: 'Ada Lovelace',
        country: { code: 'GB', name: 'United Kingdom' },
        currency: 'GBP',
        annualSalary: 90_000,
        annualSalaryUsd: 114_300,
      });
      expect(employee.salaryHistory).toEqual([
        expect.objectContaining({
          previousSalary: null,
          newSalary: 90_000,
          currency: 'GBP',
          reason: 'Initial salary',
          effectiveDate: '2024-03-01',
        }),
      ]);
    });

    it('rejects an unknown country', () => {
      expect(() => service.create(buildEmployeeInput({ countryCode: 'ZZ' }))).toThrow(
        BusinessRuleError,
      );
    });

    it('rejects a duplicate email address', () => {
      service.create(buildEmployeeInput({ email: 'dup@acme.com' }));
      expect(() => service.create(buildEmployeeInput({ email: 'dup@acme.com' }))).toThrow(
        ConflictError,
      );
    });
  });

  describe('update', () => {
    it('updates profile fields without touching salary history', () => {
      const { id } = service.create(buildEmployeeInput());

      const updated = service.update(id, { jobTitle: 'Senior Software Engineer' });

      expect(updated.jobTitle).toBe('Senior Software Engineer');
      expect(updated.salaryHistory).toHaveLength(1);
    });

    it('records a salary change with its reason and effective date', () => {
      const { id } = service.create(buildEmployeeInput({ annualSalary: 80_000 }));

      const updated = service.update(id, {
        salaryChange: { annualSalary: 88_000, reason: 'Promotion' },
      });

      expect(updated.annualSalary).toBe(88_000);
      expect(updated.salaryHistory[0]).toMatchObject({
        previousSalary: 80_000,
        newSalary: 88_000,
        currency: 'GBP',
        reason: 'Promotion',
        effectiveDate: TODAY,
      });
    });

    it('rejects a salary change to the same amount', () => {
      const { id } = service.create(buildEmployeeInput({ annualSalary: 80_000 }));

      expect(() =>
        service.update(id, { salaryChange: { annualSalary: 80_000, reason: 'No-op' } }),
      ).toThrow('same as the current salary');
    });

    it('requires a new salary when relocating to a country with a different currency', () => {
      const { id } = service.create(buildEmployeeInput({ countryCode: 'GB' }));

      expect(() => service.update(id, { countryCode: 'DE' })).toThrow(
        /changes the pay currency to EUR/,
      );
    });

    it('relocates with a new salary recorded in the new currency', () => {
      const { id } = service.create(
        buildEmployeeInput({ countryCode: 'GB', annualSalary: 80_000 }),
      );

      const updated = service.update(id, {
        countryCode: 'DE',
        salaryChange: { annualSalary: 95_000, reason: 'Relocation to Berlin' },
      });

      expect(updated.currency).toBe('EUR');
      expect(updated.salaryHistory[0]).toMatchObject({ newSalary: 95_000, currency: 'EUR' });
    });

    it('allows relocating within the same currency without a salary change', () => {
      const { id } = service.create(buildEmployeeInput({ countryCode: 'DE' }));

      expect(service.update(id, { countryCode: 'FR' }).country.code).toBe('FR');
    });

    it('throws NotFoundError for a missing employee', () => {
      expect(() => service.update(999, { jobTitle: 'Anything' })).toThrow(NotFoundError);
    });
  });

  describe('list', () => {
    beforeEach(() => {
      service.create(
        buildEmployeeInput({
          firstName: 'Ada',
          lastName: 'Lovelace',
          countryCode: 'GB',
          annualSalary: 80_000,
        }),
      );
      service.create(
        buildEmployeeInput({
          firstName: 'Alan',
          lastName: 'Turing',
          countryCode: 'US',
          annualSalary: 150_000,
        }),
      );
      service.create(
        buildEmployeeInput({
          firstName: 'Grace',
          lastName: 'Hopper',
          countryCode: 'IN',
          annualSalary: 3_000_000,
          department: 'Product',
          jobTitle: 'Product Manager',
        }),
      );
    });

    it('paginates results and reports totals', () => {
      const page = service.list(query({ pageSize: 2 }));

      expect(page).toMatchObject({ page: 1, pageSize: 2, total: 3, totalPages: 2 });
      expect(page.data).toHaveLength(2);
    });

    it('sorts by last name by default', () => {
      const names = service.list(query()).data.map((e) => e.lastName);
      expect(names).toEqual(['Hopper', 'Lovelace', 'Turing']);
    });

    it('sorts salaries on a USD basis across currencies', () => {
      const names = service
        .list(query({ sortBy: 'salary', sortOrder: 'desc' }))
        .data.map((e) => e.lastName);
      // 150k USD > 80k GBP (~101.6k USD) > 3M INR (~36k USD)
      expect(names).toEqual(['Turing', 'Lovelace', 'Hopper']);
    });

    it('searches case-insensitively across full name and email', () => {
      expect(service.list(query({ search: 'ada love' })).data.map((e) => e.lastName)).toEqual([
        'Lovelace',
      ]);
      expect(service.list(query({ search: 'TURING' })).total).toBe(1);
    });

    it('treats LIKE wildcards in the search term literally', () => {
      expect(service.list(query({ search: '%' })).total).toBe(0);
    });

    it('combines filters', () => {
      expect(service.list(query({ department: 'Engineering', country: 'us' })).total).toBe(1);
      expect(service.list(query({ jobTitle: 'Product Manager' })).data[0]?.lastName).toBe('Hopper');
    });
  });

  describe('delete', () => {
    it('removes the employee', () => {
      const { id } = service.create(buildEmployeeInput());

      service.delete(id);

      expect(() => service.get(id)).toThrow(NotFoundError);
    });

    it('throws NotFoundError when the employee does not exist', () => {
      expect(() => service.delete(42)).toThrow(NotFoundError);
    });
  });
});

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DIRECTORY_PARAMS,
  nextSort,
  parseDirectoryParams,
  serializeDirectoryParams,
} from './directory-params';

const parse = (query: string) => parseDirectoryParams(new URLSearchParams(query));

describe('parseDirectoryParams', () => {
  it('uses defaults for an empty URL', () => {
    expect(parse('')).toEqual(DEFAULT_DIRECTORY_PARAMS);
  });

  it('reads filters, sort and paging', () => {
    expect(parse('search=ada&country=GB&sortBy=salary&sortOrder=desc&page=3&pageSize=50')).toEqual({
      search: 'ada',
      country: 'GB',
      department: undefined,
      jobTitle: undefined,
      sortBy: 'salary',
      sortOrder: 'desc',
      page: 3,
      pageSize: 50,
    });
  });

  it('falls back to defaults for tampered values', () => {
    expect(parse('sortBy=password&page=-4&pageSize=5000')).toMatchObject({
      sortBy: 'name',
      page: 1,
      pageSize: 25,
    });
  });
});

describe('serializeDirectoryParams', () => {
  it('omits defaults so shared links stay short', () => {
    expect(serializeDirectoryParams(DEFAULT_DIRECTORY_PARAMS)).toBe('');
  });

  it('round-trips through parse', () => {
    const params = { ...DEFAULT_DIRECTORY_PARAMS, department: 'Customer Success', page: 2 };
    expect(parse(serializeDirectoryParams(params))).toEqual(params);
  });
});

describe('nextSort', () => {
  it('flips direction when the active column is clicked again', () => {
    expect(nextSort(DEFAULT_DIRECTORY_PARAMS, 'name')).toEqual({
      sortBy: 'name',
      sortOrder: 'desc',
    });
  });

  it('starts salary and hire date with the highest or newest first', () => {
    expect(nextSort(DEFAULT_DIRECTORY_PARAMS, 'salary')).toEqual({
      sortBy: 'salary',
      sortOrder: 'desc',
    });
    expect(nextSort(DEFAULT_DIRECTORY_PARAMS, 'hireDate').sortOrder).toBe('desc');
  });
});

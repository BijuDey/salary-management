import type { EmployeeListParams, SortField, SortOrder } from '@/lib/types';

export const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

const SORT_FIELDS: readonly SortField[] = ['name', 'salary', 'hireDate'];
const DEFAULT_PAGE_SIZE = 25;

export const DEFAULT_DIRECTORY_PARAMS: EmployeeListParams = {
  sortBy: 'name',
  sortOrder: 'asc',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

/**
 * Reads directory state from the URL, falling back to safe defaults for anything missing or
 * tampered with, so a shared or bookmarked link always renders.
 */
export function parseDirectoryParams(search: URLSearchParams): EmployeeListParams {
  const sortBy = search.get('sortBy') as SortField | null;
  const sortOrder = search.get('sortOrder') as SortOrder | null;
  const page = Number(search.get('page'));
  const pageSize = Number(search.get('pageSize'));

  return {
    search: search.get('search') || undefined,
    country: search.get('country') || undefined,
    department: search.get('department') || undefined,
    jobTitle: search.get('jobTitle') || undefined,
    sortBy: sortBy && SORT_FIELDS.includes(sortBy) ? sortBy : DEFAULT_DIRECTORY_PARAMS.sortBy,
    sortOrder: sortOrder === 'desc' ? 'desc' : 'asc',
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: (PAGE_SIZE_OPTIONS as readonly number[]).includes(pageSize)
      ? pageSize
      : DEFAULT_PAGE_SIZE,
  };
}

/** Writes state back to the URL, omitting defaults to keep links short. */
export function serializeDirectoryParams(params: EmployeeListParams): string {
  const search = new URLSearchParams();
  const entries: [string, string | number | undefined][] = [
    ['search', params.search],
    ['country', params.country],
    ['department', params.department],
    ['jobTitle', params.jobTitle],
    ['sortBy', params.sortBy === DEFAULT_DIRECTORY_PARAMS.sortBy ? undefined : params.sortBy],
    [
      'sortOrder',
      params.sortOrder === DEFAULT_DIRECTORY_PARAMS.sortOrder ? undefined : params.sortOrder,
    ],
    ['page', params.page === 1 ? undefined : params.page],
    ['pageSize', params.pageSize === DEFAULT_PAGE_SIZE ? undefined : params.pageSize],
  ];

  for (const [key, value] of entries) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  return search.toString();
}

/** Toggling the active column flips direction; a new column starts at its natural order. */
export function nextSort(
  current: EmployeeListParams,
  field: SortField,
): Pick<EmployeeListParams, 'sortBy' | 'sortOrder'> {
  if (current.sortBy === field) {
    return { sortBy: field, sortOrder: current.sortOrder === 'asc' ? 'desc' : 'asc' };
  }
  // People usually want the highest salaries and the most recent hires first.
  return { sortBy: field, sortOrder: field === 'name' ? 'asc' : 'desc' };
}

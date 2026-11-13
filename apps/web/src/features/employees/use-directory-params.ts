'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import type { EmployeeListParams } from '@/lib/types';
import { parseDirectoryParams, serializeDirectoryParams } from './directory-params';

/** Directory filters, sort and page, stored in the URL so views are shareable and survive reloads. */
export function useDirectoryParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo(
    () => parseDirectoryParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const update = useCallback(
    (changes: Partial<EmployeeListParams>) => {
      // Any change other than paging sends the user back to the first page of results.
      const resetPage = !('page' in changes);
      const next = { ...params, ...changes, ...(resetPage ? { page: 1 } : {}) };
      const query = serializeDirectoryParams(next);
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  return { params, update };
}

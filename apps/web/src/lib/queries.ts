'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest, buildQueryString } from './api-client';
import type {
  EmployeeDetail,
  EmployeeInput,
  EmployeeListParams,
  EmployeeUpdate,
  Employee,
  Paginated,
  PaySummary,
  ReferenceData,
  RoleInsights,
  Session,
} from './types';

/** One place for cache keys, so invalidation after a mutation is never guesswork. */
export const queryKeys = {
  session: ['session'] as const,
  reference: ['reference'] as const,
  employees: ['employees'] as const,
  employeeList: (params: EmployeeListParams) => ['employees', 'list', params] as const,
  employee: (id: number) => ['employees', 'detail', id] as const,
  insights: ['insights'] as const,
  paySummary: ['insights', 'summary'] as const,
  roleInsights: (country?: string, department?: string) =>
    ['insights', 'roles', { country, department }] as const,
};

export function useSession() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: () => apiRequest<Session>('/api/auth/session'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSignIn() {
  return useMutation({
    mutationFn: (credentials: { username: string; password: string }) =>
      apiRequest<Pick<Session, 'username'>>('/api/auth/login', {
        method: 'POST',
        body: credentials,
      }),
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest<void>('/api/auth/logout', { method: 'POST' }),
    // Drop every cached salary figure so nothing lingers in memory after signing out.
    onSuccess: () => queryClient.clear(),
  });
}

export function useReferenceData() {
  return useQuery({
    queryKey: queryKeys.reference,
    queryFn: () => apiRequest<ReferenceData>('/api/reference'),
    staleTime: 10 * 60 * 1000,
  });
}

export function useEmployees(params: EmployeeListParams) {
  return useQuery({
    queryKey: queryKeys.employeeList(params),
    queryFn: () =>
      apiRequest<Paginated<Employee>>(`/api/employees${buildQueryString({ ...params })}`),
    // Keep the current page on screen while the next one loads: no flashing table.
    placeholderData: keepPreviousData,
  });
}

export function useEmployee(id: number) {
  return useQuery({
    queryKey: queryKeys.employee(id),
    queryFn: () => apiRequest<EmployeeDetail>(`/api/employees/${id}`),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function usePaySummary() {
  return useQuery({
    queryKey: queryKeys.paySummary,
    queryFn: () => apiRequest<PaySummary>('/api/insights/summary'),
  });
}

export function useRoleInsights(country?: string, department?: string) {
  return useQuery({
    queryKey: queryKeys.roleInsights(country, department),
    queryFn: () =>
      apiRequest<RoleInsights>(`/api/insights/roles${buildQueryString({ country, department })}`),
    placeholderData: keepPreviousData,
  });
}

/** Any change to employees can move list results, pay analytics and job-title options. */
function useInvalidateEmployeeData() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.employees }),
      queryClient.invalidateQueries({ queryKey: queryKeys.insights }),
      queryClient.invalidateQueries({ queryKey: queryKeys.reference }),
    ]);
}

export function useCreateEmployee() {
  const invalidate = useInvalidateEmployeeData();
  return useMutation({
    mutationFn: (input: EmployeeInput) =>
      apiRequest<EmployeeDetail>('/api/employees', { method: 'POST', body: input }),
    onSuccess: invalidate,
  });
}

export function useUpdateEmployee(id: number) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateEmployeeData();
  return useMutation({
    mutationFn: (update: EmployeeUpdate) =>
      apiRequest<EmployeeDetail>(`/api/employees/${id}`, { method: 'PATCH', body: update }),
    onSuccess: (employee) => {
      queryClient.setQueryData(queryKeys.employee(id), employee);
      return invalidate();
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateEmployeeData();
  return useMutation({
    mutationFn: (id: number) => apiRequest<void>(`/api/employees/${id}`, { method: 'DELETE' }),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.employee(id) });
      return invalidate();
    },
  });
}

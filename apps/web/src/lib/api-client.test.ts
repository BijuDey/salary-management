import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest, buildQueryString } from './api-client';

describe('buildQueryString', () => {
  it('skips empty values so URLs stay clean', () => {
    expect(buildQueryString({ search: 'ada', country: undefined, page: 2, jobTitle: '' })).toBe(
      '?search=ada&page=2',
    );
    expect(buildQueryString({})).toBe('');
  });
});

describe('apiRequest', () => {
  afterEach(() => vi.unstubAllGlobals());

  const respondWith = (status: number, body: unknown) =>
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })),
    );

  it('returns the parsed body on success', async () => {
    respondWith(200, { status: 'ok' });
    await expect(apiRequest('/health')).resolves.toEqual({ status: 'ok' });
  });

  it('sends JSON bodies with the right content type', async () => {
    respondWith(201, {});
    await apiRequest('/api/employees', { method: 'POST', body: { firstName: 'Ada' } });

    const [, init] = vi.mocked(fetch).mock.calls[0]!;
    expect(init?.body).toBe('{"firstName":"Ada"}');
    expect(init?.headers).toMatchObject({ 'content-type': 'application/json' });
  });

  it('turns the API error envelope into an ApiError with field details', async () => {
    respondWith(400, {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The request contains invalid data',
        details: [{ path: 'email', message: 'Enter a valid email address' }],
      },
    });

    const error = await apiRequest('/api/employees').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      fieldErrors: [{ path: 'email', message: 'Enter a valid email address' }],
    });
  });

  it('reports network failures in plain language', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(apiRequest('/api/employees')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      message: expect.stringContaining('Cannot reach the server'),
    });
  });
});

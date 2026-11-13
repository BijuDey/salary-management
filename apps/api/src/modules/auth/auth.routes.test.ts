import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildTestApp, signIn, TEST_CREDENTIALS } from '../../test-utils/app.js';
import { encodeSession } from './session.js';

describe('Authentication', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  const login = (payload: object) =>
    app.inject({ method: 'POST', url: '/api/auth/login', payload });

  describe('POST /api/auth/login', () => {
    it('sets a signed, httpOnly, SameSite=Lax session cookie for valid credentials', async () => {
      const response = await login(TEST_CREDENTIALS);

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ username: 'hr.manager' });
      expect(response.cookies).toEqual([
        expect.objectContaining({
          name: 'acme_session',
          httpOnly: true,
          sameSite: 'Lax',
          path: '/',
          maxAge: 3600,
        }),
      ]);
    });

    it('rejects a wrong password with a message that does not reveal which field was wrong', async () => {
      const response = await login({ ...TEST_CREDENTIALS, password: 'wrong password' });

      expect(response.statusCode).toBe(401);
      expect(response.json().error.message).toBe('Incorrect username or password');
      expect(response.cookies).toHaveLength(0);
    });

    it('rejects an unknown username with the same message', async () => {
      const response = await login({ ...TEST_CREDENTIALS, username: 'someone.else' });

      expect(response.statusCode).toBe(401);
      expect(response.json().error.message).toBe('Incorrect username or password');
    });

    it('validates the request body', async () => {
      const response = await login({ username: '' });
      expect(response.statusCode).toBe(400);
    });

    it('rate-limits repeated attempts', async () => {
      const limited = await buildTestApp(undefined, {
        loginRateLimit: { max: 2, timeWindowMs: 60_000 },
      });
      const attempt = () =>
        limited.inject({
          method: 'POST',
          url: '/api/auth/login',
          payload: { ...TEST_CREDENTIALS, password: 'guess' },
        });

      await attempt();
      await attempt();
      const third = await attempt();

      expect(third.statusCode).toBe(429);
      expect(third.json().error.code).toBe('TOO_MANY_REQUESTS');
      await limited.close();
    });
  });

  describe('session lifecycle', () => {
    it('GET /api/auth/session returns the signed-in user', async () => {
      const cookie = await signIn(app);

      const response = await app.inject({ url: '/api/auth/session', headers: { cookie } });

      expect(response.statusCode).toBe(200);
      expect(response.json().username).toBe('hr.manager');
    });

    it('POST /api/auth/logout clears the cookie', async () => {
      const response = await app.inject({ method: 'POST', url: '/api/auth/logout' });

      expect(response.statusCode).toBe(204);
      expect(response.cookies[0]).toMatchObject({ name: 'acme_session', value: '' });
    });

    it('rejects a cookie whose payload was tampered with', async () => {
      const cookie = await signIn(app);
      const [, signed] = cookie.split('=');
      const signature = signed!.slice(signed!.lastIndexOf('.'));
      const forged = encodeSession({ username: 'attacker', expiresAt: Date.now() + 60_000 });

      const response = await app.inject({
        url: '/api/employees',
        headers: { cookie: `acme_session=${forged}${signature}` },
      });

      expect(response.statusCode).toBe(401);
    });

    it('rejects an expired session', async () => {
      const shortLived = await buildTestApp(undefined, { sessionTtlMs: 1 });
      const cookie = await signIn(shortLived);
      await new Promise((resolve) => setTimeout(resolve, 5));

      const response = await shortLived.inject({ url: '/api/employees', headers: { cookie } });

      expect(response.statusCode).toBe(401);
      await shortLived.close();
    });

    it('rejects a session signed with a different secret (e.g. after rotation)', async () => {
      const other = await buildTestApp(undefined, {
        sessionSecret: 'a-completely-different-secret-of-32-chars',
      });
      const cookieFromOtherServer = await signIn(other);

      const response = await app.inject({
        url: '/api/employees',
        headers: { cookie: cookieFromOtherServer },
      });

      expect(response.statusCode).toBe(401);
      await other.close();
    });
  });

  describe('route protection', () => {
    const protectedEndpoints = [
      ['GET', '/api/reference'],
      ['GET', '/api/employees'],
      ['GET', '/api/employees/1'],
      ['POST', '/api/employees'],
      ['PATCH', '/api/employees/1'],
      ['DELETE', '/api/employees/1'],
      ['GET', '/api/insights/summary'],
      ['GET', '/api/insights/roles'],
      ['GET', '/api/auth/session'],
    ] as const;

    it.each(protectedEndpoints)('%s %s returns 401 without a session', async (method, url) => {
      const response = await app.inject({ method, url });

      expect(response.statusCode).toBe(401);
      expect(response.json().error.code).toBe('UNAUTHORIZED');
    });

    it('keeps the health check public for the hosting platform', async () => {
      expect((await app.inject({ url: '/health' })).statusCode).toBe(200);
    });

    it('allows access with a valid session', async () => {
      const cookie = await signIn(app);
      const response = await app.inject({ url: '/api/insights/summary', headers: { cookie } });

      expect(response.statusCode).toBe(200);
    });
  });
});

import type { FastifyInstance, InjectOptions } from 'fastify';
import { buildApp } from '../app.js';
import type { Database } from '../db/client.js';
import type { AuthOptions } from '../modules/auth/auth.routes.js';
import { hashPassword } from '../modules/auth/password.js';
import { createTestDatabase } from './database.js';

export const TEST_CREDENTIALS = {
  username: 'hr.manager',
  password: 'correct horse battery staple',
};

// Hashed once per test file: scrypt is deliberately slow.
const passwordHash = await hashPassword(TEST_CREDENTIALS.password);

export function testAuthOptions(overrides: Partial<AuthOptions> = {}): AuthOptions {
  return {
    username: TEST_CREDENTIALS.username,
    passwordHash,
    sessionSecret: 'test-session-secret-that-is-at-least-32-chars',
    sessionTtlMs: 60 * 60 * 1000,
    secureCookies: false,
    ...overrides,
  };
}

export function buildTestApp(
  db: Database = createTestDatabase(),
  auth: Partial<AuthOptions> = {},
): Promise<FastifyInstance> {
  return buildApp({ db, auth: testAuthOptions(auth) });
}

/** Signs in and returns the `cookie` header value to send with later requests. */
export async function signIn(app: FastifyInstance): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: TEST_CREDENTIALS,
  });
  const cookie = response.cookies.find((c) => c.name === 'acme_session');
  if (!cookie) {
    throw new Error(`Sign-in failed in test setup: ${response.statusCode} ${response.body}`);
  }
  return `${cookie.name}=${cookie.value}`;
}

/** `app.inject` that always sends the signed-in session cookie. */
export function authenticatedInject(app: FastifyInstance, cookie: string) {
  return (options: InjectOptions | string) => {
    const opts = typeof options === 'string' ? { url: options } : options;
    return app.inject({ ...opts, headers: { ...opts.headers, cookie } });
  };
}

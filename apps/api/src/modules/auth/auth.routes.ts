import { createHash, timingSafeEqual } from 'node:crypto';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { z } from 'zod';
import { AppError } from '../../lib/errors.js';
import { verifyPassword } from './password.js';
import {
  createSession,
  decodeSession,
  encodeSession,
  SESSION_COOKIE,
  type Session,
} from './session.js';

export interface AuthOptions {
  username: string;
  passwordHash: string;
  /** Signs session cookies; rotating it signs everyone out. */
  sessionSecret: string;
  sessionTtlMs: number;
  /** Send cookies over HTTPS only (true in production). */
  secureCookies: boolean;
  /** Login attempts allowed per client per window (brute-force protection). */
  loginRateLimit?: { max: number; timeWindowMs: number };
}

declare module 'fastify' {
  interface FastifyRequest {
    session: Session | null;
  }
  interface FastifyInstance {
    /** onRequest hook that rejects requests without a valid session. */
    requireSession: (request: FastifyRequest) => Promise<void>;
  }
}

const loginSchema = z.object({
  username: z.string().trim().min(1, 'Enter your username').max(100),
  password: z.string().min(1, 'Enter your password').max(200),
});

export class UnauthorizedError extends AppError {
  constructor(message = 'Sign in to continue') {
    super(401, 'UNAUTHORIZED', message);
  }
}

/**
 * Cookie-based authentication for the single HR Manager account.
 *
 * - POST /api/auth/login   verifies credentials and sets the session cookie
 * - POST /api/auth/logout  clears it
 * - GET  /api/auth/session returns who is signed in (401 if nobody)
 *
 * Also exposes `app.requireSession`, which app.ts applies to every other /api route.
 * Wrapped with fastify-plugin so the decorators are visible to sibling plugins.
 */
export const authPlugin = fp<AuthOptions>(async (app: FastifyInstance, options) => {
  const { loginRateLimit = { max: 10, timeWindowMs: 15 * 60 * 1000 } } = options;

  await app.register(cookie, { secret: options.sessionSecret });
  await app.register(rateLimit, {
    global: false,
    errorResponseBuilder: () =>
      new AppError(
        429,
        'TOO_MANY_REQUESTS',
        'Too many sign-in attempts. Try again in a few minutes.',
      ),
  });

  app.decorateRequest('session', null);

  app.decorate('requireSession', async (request: FastifyRequest) => {
    request.session = readSession(request);
    if (!request.session) {
      throw new UnauthorizedError();
    }
  });

  function readSession(request: FastifyRequest): Session | null {
    const raw = request.cookies[SESSION_COOKIE];
    if (!raw) return null;
    const { valid, value } = request.unsignCookie(raw);
    return valid && value ? decodeSession(value) : null;
  }

  function setSessionCookie(reply: FastifyReply, session: Session) {
    reply.setCookie(SESSION_COOKIE, encodeSession(session), {
      signed: true,
      httpOnly: true, // not readable by page scripts, so XSS cannot steal the session
      sameSite: 'lax', // not sent on cross-site POST/PATCH/DELETE, which blocks CSRF
      secure: options.secureCookies,
      path: '/',
      maxAge: Math.floor(options.sessionTtlMs / 1000),
    });
  }

  app.post(
    '/api/auth/login',
    { config: { rateLimit: { max: loginRateLimit.max, timeWindow: loginRateLimit.timeWindowMs } } },
    async (request, reply) => {
      const { username, password } = loginSchema.parse(request.body);

      // Always run the (slow) password check so response time does not reveal valid usernames.
      const passwordMatches = await verifyPassword(password, options.passwordHash);
      if (!passwordMatches || !sameText(username, options.username)) {
        throw new UnauthorizedError('Incorrect username or password');
      }

      setSessionCookie(reply, createSession(options.username, options.sessionTtlMs));
      return reply.code(200).send({ username: options.username });
    },
  );

  app.post('/api/auth/logout', async (_request, reply) => {
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return reply.code(204).send();
  });

  app.get('/api/auth/session', { onRequest: app.requireSession }, async (request) => ({
    username: request.session!.username,
    expiresAt: new Date(request.session!.expiresAt).toISOString(),
  }));
});

/** Constant-time string comparison (hashing first equalises lengths). */
function sameText(a: string, b: string): boolean {
  const digest = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(a), digest(b));
}

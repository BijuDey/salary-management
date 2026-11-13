import { z } from 'zod';

/**
 * The session is a small payload stored in a signed, httpOnly cookie: the server stays
 * stateless, and the signature (HMAC, applied by @fastify/cookie) makes tampering detectable.
 */
export interface Session {
  username: string;
  /** Epoch milliseconds after which the session is no longer accepted. */
  expiresAt: number;
}

export const SESSION_COOKIE = 'acme_session';

const sessionPayloadSchema = z.object({
  sub: z.string().min(1),
  exp: z.number().int().positive(),
});

export function createSession(username: string, ttlMs: number, now = Date.now()): Session {
  return { username, expiresAt: now + ttlMs };
}

export function encodeSession(session: Session): string {
  const payload = { sub: session.username, exp: session.expiresAt };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

/** Returns the session, or `null` if the value is malformed or expired. */
export function decodeSession(value: string, now = Date.now()): Session | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  const result = sessionPayloadSchema.safeParse(parsed);
  if (!result.success || result.data.exp <= now) {
    return null;
  }
  return { username: result.data.sub, expiresAt: result.data.exp };
}

import { describe, expect, it } from 'vitest';
import { createSession, decodeSession, encodeSession } from './session.js';

const NOW = Date.parse('2026-11-13T09:00:00Z');
const HOUR = 60 * 60 * 1000;

describe('session encoding', () => {
  it('round-trips a session', () => {
    const session = createSession('hr.manager', 8 * HOUR, NOW);

    expect(decodeSession(encodeSession(session), NOW)).toEqual({
      username: 'hr.manager',
      expiresAt: NOW + 8 * HOUR,
    });
  });

  it('rejects an expired session', () => {
    const encoded = encodeSession(createSession('hr.manager', HOUR, NOW));
    expect(decodeSession(encoded, NOW + HOUR)).toBeNull();
  });

  it('rejects malformed values', () => {
    expect(decodeSession('not base64 json', NOW)).toBeNull();
    expect(decodeSession(Buffer.from('{"sub":""}').toString('base64url'), NOW)).toBeNull();
  });
});

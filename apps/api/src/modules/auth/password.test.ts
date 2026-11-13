import { describe, expect, it } from 'vitest';
import { hashPassword, isPasswordHash, verifyPassword } from './password.js';

describe('password hashing', () => {
  it('verifies the original password against its hash', async () => {
    const hash = await hashPassword('long enough secret');

    expect(isPasswordHash(hash)).toBe(true);
    await expect(verifyPassword('long enough secret', hash)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('long enough secret');
    await expect(verifyPassword('long enough secreT', hash)).resolves.toBe(false);
  });

  it('salts every hash, so equal passwords produce different hashes', async () => {
    expect(await hashPassword('same password')).not.toBe(await hashPassword('same password'));
  });

  it('returns false instead of throwing for a malformed stored hash', async () => {
    await expect(verifyPassword('anything', 'not-a-hash')).resolves.toBe(false);
    await expect(verifyPassword('anything', 'scrypt:abcd:1234')).resolves.toBe(false);
  });
});

import { randomBytes, scrypt, timingSafeEqual, type BinaryLike } from 'node:crypto';

/**
 * Password hashing with scrypt (memory-hard, built into Node; no native dependency).
 * Stored format: `scrypt:<salt hex>:<hash hex>`, safe to paste into an environment variable.
 */
const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const PREFIX = 'scrypt';

function deriveKey(password: BinaryLike, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await deriveKey(password, salt);
  return `${PREFIX}:${salt.toString('hex')}:${key.toString('hex')}`;
}

/** Constant-time comparison; returns false (never throws) for a malformed stored hash. */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [prefix, saltHex, keyHex] = storedHash.split(':');
  if (prefix !== PREFIX || !saltHex || !keyHex) {
    return false;
  }

  const expected = Buffer.from(keyHex, 'hex');
  if (expected.length !== KEY_LENGTH) {
    return false;
  }

  const actual = await deriveKey(password, Buffer.from(saltHex, 'hex'));
  return timingSafeEqual(actual, expected);
}

export function isPasswordHash(value: string): boolean {
  return /^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$/.test(value);
}

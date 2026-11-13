import { describe, expect, it } from 'vitest';
import { loginUrl, safeNextPath } from './redirects';

describe('safeNextPath', () => {
  it('keeps same-site paths, including their query string', () => {
    expect(safeNextPath('/insights')).toBe('/insights');
    expect(safeNextPath('/employees?country=DE&page=2')).toBe('/employees?country=DE&page=2');
  });

  it.each([
    ['missing', null],
    ['empty', ''],
    ['absolute URL', 'https://evil.example/phish'],
    ['protocol-relative URL', '//evil.example'],
    ['backslash trick', '/\\evil.example'],
    ['relative path', 'employees'],
    ['the login page itself', '/login?next=/insights'],
  ])('falls back to the directory for %s', (_case, next) => {
    expect(safeNextPath(next)).toBe('/employees');
  });
});

describe('loginUrl', () => {
  it('encodes the return path', () => {
    expect(loginUrl('/employees?country=DE')).toBe('/login?next=%2Femployees%3Fcountry%3DDE');
  });
});

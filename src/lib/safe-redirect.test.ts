import { describe, expect, it } from 'vitest';
import { safeRedirectPath } from './safe-redirect';

describe('safeRedirectPath', () => {
  it.each(['/filme/438631', '/?p=8&g=27', '/minha-lista#topo'])(
    'aceita o caminho interno %j',
    (path) => {
      expect(safeRedirectPath(path)).toBe(path);
    },
  );

  it.each([
    '//evil.com',
    '/\\evil.com',
    '/\t/evil.com',
    'https://evil.com',
    'https:evil.com',
    'javascript:alert(1)',
    'filme/1',
    '/.//evil.com',
    '/%2e//evil.com',
    '/a/..//evil.com',
    '/./\\evil.com',
    '',
  ])('troca %j por "/"', (raw) => {
    expect(safeRedirectPath(raw)).toBe('/');
  });

  it.each([undefined, null, 42, ['/filme/1']])('valor não-string %j vira "/"', (raw) => {
    expect(safeRedirectPath(raw)).toBe('/');
  });
});

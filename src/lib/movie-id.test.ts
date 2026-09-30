import { describe, expect, it } from 'vitest';
import { parseMovieId } from './movie-id';

describe('parseMovieId', () => {
  it('aceita inteiros positivos', () => {
    expect(parseMovieId('438631')).toBe(438631);
  });

  it.each(['abc', '-1', '0', '1.5', '1e3', ' 12', '', '12abc', '99999999999999999999'])(
    'rejeita %j',
    (raw) => {
      expect(parseMovieId(raw)).toBeNull();
    },
  );
});

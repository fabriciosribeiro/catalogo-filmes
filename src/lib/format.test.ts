import { describe, expect, it } from 'vitest';
import { formatRating, formatRuntime, initials } from './format';

describe('formatRating', () => {
  it('usa uma casa decimal com vírgula', () => {
    expect(formatRating(7.8)).toBe('7,8');
    expect(formatRating(8)).toBe('8,0');
    expect(formatRating(7.25)).toBe('7,3');
  });
});

describe('formatRuntime', () => {
  it('formata horas e minutos', () => {
    expect(formatRuntime(155)).toBe('2h 35min');
    expect(formatRuntime(120)).toBe('2h');
    expect(formatRuntime(45)).toBe('45min');
  });
});

describe('initials', () => {
  it('pega a primeira e a última inicial', () => {
    expect(initials('Timothée Chalamet')).toBe('TC');
    expect(initials('Zendaya')).toBe('Z');
    expect(initials('Rebecca de Souza Ferguson')).toBe('RF');
  });
});

import { describe, expect, it } from 'vitest';
import { releaseYearOf, toMovie, toProvider } from './mappers';

describe('releaseYearOf', () => {
  it('extrai o ano', () => expect(releaseYearOf('2021-09-15')).toBe(2021));
  it('retorna null para data vazia ou inválida', () => {
    expect(releaseYearOf('')).toBeNull();
    expect(releaseYearOf('xx')).toBeNull();
  });
});

describe('toMovie', () => {
  it('mapeia o resultado cru para o domínio', () => {
    expect(
      toMovie({
        id: 1,
        title: 'A',
        poster_path: '/a.jpg',
        release_date: '2020-01-02',
        vote_average: 7.25,
        genre_ids: [18],
      }),
    ).toEqual({
      id: 1,
      title: 'A',
      posterPath: '/a.jpg',
      releaseYear: 2020,
      voteAverage: 7.25,
      genreIds: [18],
    });
  });
});

describe('toProvider', () => {
  it('mapeia o provedor cru', () => {
    expect(
      toProvider({
        provider_id: 8,
        provider_name: 'Netflix',
        logo_path: '/n.jpg',
        display_priority: 1,
      }),
    ).toEqual({
      id: 8,
      name: 'Netflix',
      logoPath: '/n.jpg',
    });
  });
});

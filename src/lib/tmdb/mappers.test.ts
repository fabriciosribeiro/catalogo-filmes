import { describe, expect, it } from 'vitest';
import { makeMovieDetails } from '../../../tests/fixtures/domain';
import { duneDetails } from '../../../tests/fixtures/tmdb';
import {
  detailsToMovie,
  pickTrailerKey,
  toMovieDetails,
  releaseYearOf,
  toMovie,
  toProvider,
} from './mappers';

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

describe('pickTrailerKey', () => {
  it('prefere trailer do YouTube em português', () => {
    expect(pickTrailerKey(duneDetails.videos!.results)).toBe('trailer-pt');
  });

  it('cai para inglês quando não há em português', () => {
    expect(
      pickTrailerKey([
        { key: 'teaser-pt', site: 'YouTube', type: 'Teaser', iso_639_1: 'pt' },
        { key: 'trailer-en', site: 'YouTube', type: 'Trailer', iso_639_1: 'en' },
      ]),
    ).toBe('trailer-en');
  });

  it('retorna null sem trailer do YouTube', () => {
    expect(
      pickTrailerKey([{ key: 'v', site: 'Vimeo', type: 'Trailer', iso_639_1: 'pt' }]),
    ).toBeNull();
    expect(pickTrailerKey([])).toBeNull();
  });
});

describe('toMovieDetails', () => {
  it('mapeia os detalhes completos', () => {
    const details = toMovieDetails(duneDetails);
    expect(details).toMatchObject({
      id: 438631,
      title: 'Duna',
      releaseYear: 2021,
      runtime: 155,
      voteAverage: 7.8,
      posterPath: '/duna-poster.jpg',
      backdropPath: '/duna-backdrop.jpg',
      genres: [
        { id: 878, name: 'Ficção científica' },
        { id: 12, name: 'Aventura' },
      ],
      trailerKey: 'trailer-pt',
      streamingProviders: [{ id: 1899, name: 'Max', logoPath: '/max.jpg' }],
      watchLink: 'https://www.themoviedb.org/movie/438631-dune/watch?locale=BR',
    });
  });

  it('ordena o elenco por `order` e limita a 10', () => {
    const { cast } = toMovieDetails(duneDetails);
    expect(cast).toHaveLength(10);
    expect(cast[0]).toEqual({
      id: 100,
      name: 'Ator 1',
      character: 'Personagem 1',
      profilePath: null,
    });
    expect(cast[9].name).toBe('Ator 10');
  });

  it('tolera campos anexos ausentes e filme sem streaming no BR', () => {
    const details = toMovieDetails({
      ...duneDetails,
      credits: undefined,
      videos: undefined,
      'watch/providers': { results: { US: { flatrate: [] } } },
    });
    expect(details).toMatchObject({
      cast: [],
      trailerKey: null,
      streamingProviders: [],
      watchLink: null,
    });
  });
});

describe('detailsToMovie', () => {
  it('reduz os detalhes ao formato de card', () => {
    expect(detailsToMovie(makeMovieDetails())).toEqual({
      id: 438631,
      title: 'Duna',
      posterPath: '/duna-poster.jpg',
      releaseYear: 2021,
      voteAverage: 7.8,
      genreIds: [878, 12],
    });
  });
});

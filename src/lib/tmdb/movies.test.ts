import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { discoverPage } from '../../../tests/fixtures/tmdb';
import { server } from '../../../tests/msw/server';
import { DEFAULT_FILTERS, type Filters } from '../filters';
import { discoverStreaming, getGenres, getProviders } from './movies';

function captureDiscover(response = discoverPage(1)) {
  const calls: URLSearchParams[] = [];
  server.use(
    http.get('*/3/discover/movie', ({ request }) => {
      calls.push(new URL(request.url).searchParams);
      return HttpResponse.json(response);
    }),
  );
  return calls;
}

describe('getProviders', () => {
  it('mantém só a allowlist, na ordem da allowlist, e descarta lojas', async () => {
    const providers = await getProviders();
    expect(providers.map((p) => p.name)).toEqual([
      'Netflix',
      'Amazon Prime Video',
      'Max',
      'Disney Plus',
      'Globoplay',
    ]);
    expect(providers[0]).toEqual({ id: 8, name: 'Netflix', logoPath: '/netflix.jpg' });
  });

  it('pede a lista do Brasil em pt-BR', async () => {
    let params: URLSearchParams | undefined;
    server.use(
      http.get('*/3/watch/providers/movie', ({ request }) => {
        params = new URL(request.url).searchParams;
        return HttpResponse.json({ results: [] });
      }),
    );
    await getProviders();
    expect(params!.get('watch_region')).toBe('BR');
    expect(params!.get('language')).toBe('pt-BR');
  });
});

describe('getGenres', () => {
  it('retorna os gêneros ordenados por nome', async () => {
    const genres = await getGenres();
    expect(genres.map((g) => g.name)).toEqual([
      'Ação',
      'Aventura',
      'Comédia',
      'Drama',
      'Ficção científica',
      'Terror',
    ]);
  });
});

describe('discoverStreaming', () => {
  it('sem plataforma selecionada usa todas as plataformas principais', async () => {
    const calls = captureDiscover();
    await discoverStreaming(DEFAULT_FILTERS, 1);

    const params = calls[0];
    expect(params.get('with_watch_providers')).toBe('8|119|1899|337|307');
    expect(params.get('with_watch_monetization_types')).toBe('flatrate');
    expect(params.get('watch_region')).toBe('BR');
    expect(params.get('language')).toBe('pt-BR');
    expect(params.get('sort_by')).toBe('popularity.desc');
    expect(params.get('page')).toBe('1');
    expect(params.has('with_genres')).toBe(false);
    expect(params.has('vote_count.gte')).toBe(false);
  });

  it('traduz todos os filtros para a query do TMDB', async () => {
    const calls = captureDiscover();
    const filters: Filters = {
      providers: [8, 119],
      genres: [27, 35],
      yearFrom: 2020,
      yearTo: 2025,
      sort: 'lancamento',
    };
    await discoverStreaming(filters, 3);

    const params = calls[0];
    expect(params.get('with_watch_providers')).toBe('8|119');
    expect(params.get('with_genres')).toBe('27,35');
    expect(params.get('primary_release_date.gte')).toBe('2020-01-01');
    expect(params.get('primary_release_date.lte')).toBe('2025-12-31');
    expect(params.get('sort_by')).toBe('primary_release_date.desc');
    expect(params.get('page')).toBe('3');
  });

  it('ordenação por nota exige um mínimo de votos', async () => {
    const calls = captureDiscover();
    await discoverStreaming({ ...DEFAULT_FILTERS, sort: 'nota' }, 1);
    expect(calls[0].get('sort_by')).toBe('vote_average.desc');
    expect(calls[0].get('vote_count.gte')).toBe('200');
  });

  it('mapeia os filmes e informa se há mais páginas', async () => {
    const first = await discoverStreaming(DEFAULT_FILTERS, 1);
    expect(first.movies).toHaveLength(20);
    expect(first.movies[0]).toEqual({
      id: 1001,
      title: 'Filme 1001',
      posterPath: '/poster-1001.jpg',
      releaseYear: 2023,
      voteAverage: 7.1,
      genreIds: [18],
    });
    expect(first).toMatchObject({ page: 1, hasMore: true });

    const last = await discoverStreaming(DEFAULT_FILTERS, 2);
    expect(last).toMatchObject({ page: 2, hasMore: false });
  });

  it('para na página 500 mesmo que o TMDB diga que há mais', async () => {
    captureDiscover({ ...discoverPage(500, 900) });
    const page = await discoverStreaming(DEFAULT_FILTERS, 500);
    expect(page.hasMore).toBe(false);
  });

  it('página fora de 1..500 devolve vazio sem chamar a API', async () => {
    const calls = captureDiscover();
    for (const page of [0, -1, 501, 1.5, Number.NaN]) {
      expect(await discoverStreaming(DEFAULT_FILTERS, page)).toEqual({
        movies: [],
        page,
        hasMore: false,
      });
    }
    expect(calls).toHaveLength(0);
  });
});

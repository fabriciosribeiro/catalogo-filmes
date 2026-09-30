import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { makeMovieResult } from '../../../tests/fixtures/tmdb';
import { server } from '../../../tests/msw/server';
import { searchStreaming } from './movies';

describe('searchStreaming', () => {
  it('mantém só os resultados em flatrate no Brasil', async () => {
    const movies = await searchStreaming('duna');
    expect(movies.map((m) => [m.id, m.title, m.releaseYear])).toEqual([[438631, 'Duna', 2021]]);
  });

  it('envia o termo aparado, em pt-BR, região BR, só a primeira página', async () => {
    let params: URLSearchParams | undefined;
    server.use(
      http.get('*/3/search/movie', ({ request }) => {
        params = new URL(request.url).searchParams;
        return HttpResponse.json({ page: 1, results: [], total_pages: 0, total_results: 0 });
      }),
    );
    await searchStreaming('  duna  ');
    expect(params!.get('query')).toBe('duna');
    expect(params!.get('language')).toBe('pt-BR');
    expect(params!.get('region')).toBe('BR');
    expect(params!.get('page')).toBe('1');
  });

  it('termo vazio não chama a API', async () => {
    const spy = vi.fn();
    server.use(http.get('*/3/search/movie', spy));
    expect(await searchStreaming('   ')).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it('preserva a ordem de relevância', async () => {
    server.use(
      http.get('*/3/search/movie', () =>
        HttpResponse.json({
          page: 1,
          results: [makeMovieResult(2), makeMovieResult(1)],
          total_pages: 1,
          total_results: 2,
        }),
      ),
      http.get('*/3/movie/:id/watch/providers', ({ params }) =>
        HttpResponse.json({
          id: Number(params.id),
          results: {
            BR: {
              flatrate: [
                { provider_id: 8, provider_name: 'Netflix', logo_path: null, display_priority: 1 },
              ],
            },
          },
        }),
      ),
    );
    expect((await searchStreaming('x')).map((m) => m.id)).toEqual([2, 1]);
  });

  it('trata 404 nos provedores de um filme como indisponível', async () => {
    server.use(
      http.get('*/3/movie/:id/watch/providers', () => HttpResponse.json({}, { status: 404 })),
    );
    expect(await searchStreaming('duna')).toEqual([]);
  });

  it('propaga outros erros', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    server.use(
      http.get('*/3/movie/:id/watch/providers', () => HttpResponse.json({}, { status: 500 })),
    );
    await expect(searchStreaming('duna')).rejects.toMatchObject({ status: 500 });
  });
});

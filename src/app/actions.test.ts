import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server } from '../../tests/msw/server';
import { loadMore } from './actions';

describe('loadMore', () => {
  it('carrega a página pedida com os filtros da query string', async () => {
    let params: URLSearchParams | undefined;
    server.use(
      http.get('*/3/discover/movie', ({ request }) => {
        params = new URL(request.url).searchParams;
        return HttpResponse.json({ page: 2, results: [], total_pages: 2, total_results: 40 });
      }),
    );

    const result = await loadMore('p=8&g=27', 2);

    expect(result).toEqual({ movies: [], page: 2, hasMore: false });
    expect(params!.get('with_watch_providers')).toBe('8');
    expect(params!.get('with_genres')).toBe('27');
    expect(params!.get('page')).toBe('2');
  });

  it.each([
    ['lixo', 0],
    ['', 9999],
    ['', -5],
    ['q=duna', 2],
  ])('entrada arbitrária (%j, %j) devolve página vazia sem chamar o TMDB', async (qs, page) => {
    const spy = vi.fn();
    server.use(http.get('*/3/discover/movie', spy));
    const result = await loadMore(qs, page);
    expect(result.movies).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });
});

import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server } from '../../../tests/msw/server';
import { getMovieDetails } from './movies';

describe('getMovieDetails', () => {
  it('busca detalhes com créditos, vídeos e provedores numa só chamada', async () => {
    let params: URLSearchParams | undefined;
    server.use(
      http.get('*/3/movie/:id', ({ request }) => {
        params = new URL(request.url).searchParams;
        return HttpResponse.json({
          id: 1,
          title: 'X',
          overview: '',
          poster_path: null,
          backdrop_path: null,
          release_date: '',
          runtime: null,
          vote_average: 0,
          genres: [],
        });
      }),
    );
    await getMovieDetails(1);
    expect(params!.get('append_to_response')).toBe('credits,videos,watch/providers');
    expect(params!.get('language')).toBe('pt-BR');
    expect(params!.get('include_video_language')).toBe('pt,en');
  });

  it('retorna os detalhes de domínio', async () => {
    const details = await getMovieDetails(438631);
    expect(details).toMatchObject({ id: 438631, title: 'Duna', trailerKey: 'trailer-pt' });
  });

  it('retorna null para filme inexistente', async () => {
    expect(await getMovieDetails(999999)).toBeNull();
  });

  it('propaga outros erros', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    server.use(http.get('*/3/movie/:id', () => HttpResponse.json({}, { status: 500 })));
    await expect(getMovieDetails(1)).rejects.toMatchObject({ status: 500 });
  });
});

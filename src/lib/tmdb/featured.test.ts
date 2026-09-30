import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { duneDetails } from '../../../tests/fixtures/tmdb';
import { server } from '../../../tests/msw/server';
import { pickTitleLogo, toFeaturedMovie } from './mappers';
import { getFeaturedMovies } from './movies';

describe('pickTitleLogo', () => {
  const logo = (iso: string | null) => ({
    file_path: `/${iso}.png`,
    iso_639_1: iso,
    aspect_ratio: 3,
  });

  it('prefere o logo em português', () => {
    expect(pickTitleLogo([logo('en'), logo('pt')])).toEqual({ path: '/pt.png', aspectRatio: 3 });
  });

  it('cai para o inglês e ignora outros idiomas', () => {
    expect(pickTitleLogo([logo('ja'), logo('en')])?.path).toBe('/en.png');
    expect(pickTitleLogo([logo('ja'), logo(null)])).toBeNull();
  });
});

describe('toFeaturedMovie', () => {
  it('mapeia os detalhes para o destaque', () => {
    expect(toFeaturedMovie(duneDetails)).toMatchObject({
      id: 438631,
      backdropPath: '/duna-backdrop.jpg',
      logo: { path: '/duna-logo-pt.png' },
      trailerKey: 'trailer-pt',
      streamingProviders: [{ id: 1899, name: 'Max' }],
    });
  });

  it('descarta filme sem imagem de fundo ou fora da assinatura no BR', () => {
    expect(toFeaturedMovie({ ...duneDetails, backdrop_path: null })).toBeNull();
    expect(toFeaturedMovie({ ...duneDetails, 'watch/providers': { results: {} } })).toBeNull();
  });

  it('mostra só os serviços da faixa quando o filme está em algum deles', () => {
    const withAds = {
      provider_id: 1796,
      provider_name: 'Netflix com anúncios',
      logo_path: null,
      display_priority: 9,
    };
    const netflix = {
      provider_id: 8,
      provider_name: 'Netflix',
      logo_path: null,
      display_priority: 1,
    };
    const featured = toFeaturedMovie({
      ...duneDetails,
      'watch/providers': { results: { BR: { flatrate: [withAds, netflix] } } },
    });
    expect(featured?.streamingProviders.map((provider) => provider.id)).toEqual([8]);

    const onlyOther = toFeaturedMovie({
      ...duneDetails,
      'watch/providers': { results: { BR: { flatrate: [withAds] } } },
    });
    expect(onlyOther?.streamingProviders.map((provider) => provider.id)).toEqual([1796]);
  });
});

describe('getFeaturedMovies', () => {
  it('pede logos e provedores e mantém só os filmes em assinatura', async () => {
    const requested: URLSearchParams[] = [];
    server.events.on('request:start', ({ request }) => {
      if (request.url.includes('/movie/438631')) requested.push(new URL(request.url).searchParams);
    });
    const movies = await getFeaturedMovies();
    server.events.removeAllListeners();

    expect(movies.map((movie) => movie.title)).toEqual(['Duna']);
    expect(requested[0].get('append_to_response')).toBe('videos,watch/providers,images');
    expect(requested[0].get('include_image_language')).toBe('pt,en');
  });

  it('devolve lista vazia quando o TMDB falha, sem derrubar o catálogo', async () => {
    server.use(http.get('*/3/trending/movie/week', () => HttpResponse.json({}, { status: 500 })));
    const error = console.error;
    console.error = () => {};
    await expect(getFeaturedMovies()).resolves.toEqual([]);
    console.error = error;
  });
});

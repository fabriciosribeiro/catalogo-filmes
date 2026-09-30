import type {
  TmdbCastMember,
  TmdbGenreListResponse,
  TmdbMovieDetailsResponse,
  TmdbMovieResult,
  TmdbPagedResponse,
  TmdbProvider,
  TmdbProviderListResponse,
  TmdbWatchProvidersResponse,
} from '@/lib/tmdb/types';

// Respostas no formato real do TMDB, reduzidas aos campos usados.

export const netflix: TmdbProvider = {
  provider_id: 8,
  provider_name: 'Netflix',
  logo_path: '/netflix.jpg',
  display_priority: 2,
};
export const prime: TmdbProvider = {
  provider_id: 119,
  provider_name: 'Amazon Prime Video',
  logo_path: '/prime.jpg',
  display_priority: 3,
};
export const disney: TmdbProvider = {
  provider_id: 337,
  provider_name: 'Disney Plus',
  logo_path: '/disney.jpg',
  display_priority: 4,
};
export const max: TmdbProvider = {
  provider_id: 1899,
  provider_name: 'Max',
  logo_path: '/max.jpg',
  display_priority: 5,
};
export const globoplay: TmdbProvider = {
  provider_id: 307,
  provider_name: 'Globoplay',
  logo_path: '/globoplay.jpg',
  display_priority: 6,
};
export const googlePlay: TmdbProvider = {
  provider_id: 3,
  provider_name: 'Google Play Movies',
  logo_path: '/gplay.jpg',
  display_priority: 1,
};

// Inclui uma loja (Google Play) que NÃO deve aparecer na faixa.
export const providersResponse: TmdbProviderListResponse = {
  results: [googlePlay, netflix, prime, disney, max, globoplay],
};

// Ordem embaralhada de propósito: getGenres deve ordenar por nome.
export const genresResponse: TmdbGenreListResponse = {
  genres: [
    { id: 27, name: 'Terror' },
    { id: 28, name: 'Ação' },
    { id: 18, name: 'Drama' },
    { id: 878, name: 'Ficção científica' },
    { id: 35, name: 'Comédia' },
    { id: 12, name: 'Aventura' },
  ],
};

export function makeMovieResult(
  id: number,
  overrides: Partial<TmdbMovieResult> = {},
): TmdbMovieResult {
  return {
    id,
    title: `Filme ${id}`,
    poster_path: `/poster-${id}.jpg`,
    release_date: '2023-05-10',
    vote_average: 7.1,
    genre_ids: [18],
    ...overrides,
  };
}

/** Página do discover padrão: 20 filmes por página, IDs 1001… */
export function discoverPage(page: number, totalPages = 2): TmdbPagedResponse<TmdbMovieResult> {
  const start = 1000 + (page - 1) * 20;
  return {
    page,
    results: Array.from({ length: 20 }, (_, i) => makeMovieResult(start + i + 1)),
    total_pages: totalPages,
    total_results: totalPages * 20,
  };
}

/** Resposta do discover quando o filtro inclui Terror (27). */
export const horrorDiscoverResponse: TmdbPagedResponse<TmdbMovieResult> = {
  page: 1,
  results: [1, 2, 3].map((n) =>
    makeMovieResult(2700 + n, { title: `Terror ${n}`, genre_ids: [27] }),
  ),
  total_pages: 1,
  total_results: 3,
};

export const emptyPage: TmdbPagedResponse<TmdbMovieResult> = {
  page: 1,
  results: [],
  total_pages: 0,
  total_results: 0,
};

// Busca "duna": só 438631 está em flatrate no BR.
export const dunaSearchResponse: TmdbPagedResponse<TmdbMovieResult> = {
  page: 1,
  results: [
    makeMovieResult(438631, {
      title: 'Duna',
      release_date: '2021-09-15',
      genre_ids: [878, 12],
      vote_average: 7.8,
    }),
    makeMovieResult(693134, {
      title: 'Duna: Parte Dois',
      release_date: '2024-02-27',
      genre_ids: [878, 12],
    }),
    makeMovieResult(841, { title: 'Duna', release_date: '1984-12-14', genre_ids: [878] }),
  ],
  total_pages: 1,
  total_results: 3,
};

export const watchProvidersById: Record<string, TmdbWatchProvidersResponse> = {
  '438631': {
    id: 438631,
    results: {
      BR: { link: 'https://www.themoviedb.org/movie/438631-dune/watch?locale=BR', flatrate: [max] },
    },
  },
  '693134': {
    id: 693134,
    results: {
      BR: { link: 'https://www.themoviedb.org/movie/693134/watch?locale=BR', rent: [googlePlay] },
    },
  },
  '841': {
    id: 841,
    results: {
      US: { link: 'https://www.themoviedb.org/movie/841/watch?locale=US', flatrate: [max] },
    },
  },
};

const duneCast: TmdbCastMember[] = Array.from({ length: 12 }, (_, i) => ({
  id: 100 + i,
  name: `Ator ${i + 1}`,
  character: `Personagem ${i + 1}`,
  profile_path: i === 0 ? null : `/ator-${i + 1}.jpg`,
  order: i,
}));

export const duneDetails: TmdbMovieDetailsResponse = {
  id: 438631,
  title: 'Duna',
  overview:
    'Paul Atreides, um jovem brilhante, precisa viajar para o planeta mais perigoso do universo.',
  poster_path: '/duna-poster.jpg',
  backdrop_path: '/duna-backdrop.jpg',
  release_date: '2021-09-15',
  runtime: 155,
  vote_average: 7.8,
  genres: [
    { id: 878, name: 'Ficção científica' },
    { id: 12, name: 'Aventura' },
  ],
  credits: { cast: [...duneCast].reverse() }, // fora de ordem de propósito
  videos: {
    results: [
      { key: 'teaser-pt', site: 'YouTube', type: 'Teaser', iso_639_1: 'pt' },
      { key: 'trailer-en', site: 'YouTube', type: 'Trailer', iso_639_1: 'en' },
      { key: 'vimeo-pt', site: 'Vimeo', type: 'Trailer', iso_639_1: 'pt' },
      { key: 'trailer-pt', site: 'YouTube', type: 'Trailer', iso_639_1: 'pt' },
    ],
  },
  'watch/providers': watchProvidersById['438631'],
  images: {
    logos: [
      { file_path: '/duna-logo-en.png', iso_639_1: 'en', aspect_ratio: 4 },
      { file_path: '/duna-logo-pt.png', iso_639_1: 'pt', aspect_ratio: 3.5 },
    ],
  },
};

export const detailsById: Record<string, TmdbMovieDetailsResponse> = { '438631': duneDetails };

// Trending: só Duna vira destaque (693134 não tem detalhes; 5001 não tem imagem de fundo).
export const trendingResponse: TmdbPagedResponse<TmdbMovieResult> = {
  page: 1,
  results: [
    makeMovieResult(5001, { backdrop_path: null }),
    makeMovieResult(693134, { title: 'Duna: Parte Dois', backdrop_path: '/duna2-backdrop.jpg' }),
    makeMovieResult(438631, { title: 'Duna', backdrop_path: '/duna-backdrop.jpg' }),
  ],
  total_pages: 1,
  total_results: 3,
};

export const notFoundBody = {
  success: false,
  status_code: 34,
  status_message: 'The resource you requested could not be found.',
};

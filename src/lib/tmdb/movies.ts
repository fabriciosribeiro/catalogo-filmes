import 'server-only';
import type { Filters, SortOption } from '../filters';
import { tmdbFetch } from './client';
import {
  FEATURED_PROVIDER_IDS,
  LANGUAGE,
  MAX_PAGE,
  MIN_VOTES_FOR_RATING_SORT,
  REVALIDATE,
  WATCH_REGION,
} from './config';
import { toGenre, toMovie, toProvider } from './mappers';
import type {
  Genre,
  MoviePage,
  Provider,
  TmdbGenreListResponse,
  TmdbMovieResult,
  TmdbPagedResponse,
  TmdbProviderListResponse,
} from './types';

const SORT_BY: Record<SortOption, string> = {
  popularidade: 'popularity.desc',
  nota: 'vote_average.desc',
  lancamento: 'primary_release_date.desc',
};

export async function getProviders(): Promise<Provider[]> {
  const data = await tmdbFetch<TmdbProviderListResponse>(
    '/watch/providers/movie',
    { watch_region: WATCH_REGION, language: LANGUAGE },
    { revalidate: REVALIDATE.catalogMetadata },
  );
  const byId = new Map(data.results.map((provider) => [provider.provider_id, provider]));
  return FEATURED_PROVIDER_IDS.flatMap((id) => {
    const provider = byId.get(id);
    return provider ? [toProvider(provider)] : [];
  });
}

export async function getGenres(): Promise<Genre[]> {
  const data = await tmdbFetch<TmdbGenreListResponse>(
    '/genre/movie/list',
    { language: LANGUAGE },
    { revalidate: REVALIDATE.catalogMetadata },
  );
  return data.genres.map(toGenre).sort((a, b) => a.name.localeCompare(b.name, LANGUAGE));
}

export async function discoverStreaming(filters: Filters, page: number): Promise<MoviePage> {
  if (!Number.isInteger(page) || page < 1 || page > MAX_PAGE) {
    return { movies: [], page, hasMore: false };
  }

  const providerIds = filters.providers.length
    ? filters.providers
    : (await getProviders()).map((provider) => provider.id);

  const data = await tmdbFetch<TmdbPagedResponse<TmdbMovieResult>>(
    '/discover/movie',
    {
      language: LANGUAGE,
      watch_region: WATCH_REGION,
      with_watch_monetization_types: 'flatrate',
      with_watch_providers: providerIds.length ? providerIds.join('|') : undefined,
      with_genres: filters.genres.length ? filters.genres.join(',') : undefined,
      'primary_release_date.gte': filters.yearFrom ? `${filters.yearFrom}-01-01` : undefined,
      'primary_release_date.lte': filters.yearTo ? `${filters.yearTo}-12-31` : undefined,
      sort_by: SORT_BY[filters.sort],
      'vote_count.gte': filters.sort === 'nota' ? MIN_VOTES_FOR_RATING_SORT : undefined,
      include_adult: 'false',
      page,
    },
    { revalidate: REVALIDATE.listings },
  );

  return {
    movies: data.results.map(toMovie),
    page: data.page,
    hasMore: data.page < Math.min(data.total_pages, MAX_PAGE),
  };
}

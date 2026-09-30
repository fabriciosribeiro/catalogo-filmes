import 'server-only';
import type { Filters, SortOption } from '../filters';
import { TmdbError, tmdbFetch } from './client';
import {
  FEATURED_PROVIDER_IDS,
  LANGUAGE,
  MAX_PAGE,
  MIN_VOTES_FOR_RATING_SORT,
  REVALIDATE,
  WATCH_REGION,
} from './config';
import { toGenre, toMovie, toProvider, toMovieDetails } from './mappers';
import type {
  Genre,
  Movie,
  MovieDetails,
  MoviePage,
  Provider,
  TmdbGenreListResponse,
  TmdbMovieDetailsResponse,
  TmdbMovieResult,
  TmdbPagedResponse,
  TmdbProviderListResponse,
  TmdbWatchProvidersResponse,
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

async function isStreamingInRegion(movieId: number): Promise<boolean> {
  try {
    const data = await tmdbFetch<TmdbWatchProvidersResponse>(
      `/movie/${movieId}/watch/providers`,
      {},
      { revalidate: REVALIDATE.movie },
    );
    return (data.results[WATCH_REGION]?.flatrate?.length ?? 0) > 0;
  } catch (error) {
    if (error instanceof TmdbError && error.status === 404) return false;
    throw error;
  }
}

export async function searchStreaming(query: string): Promise<Movie[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const data = await tmdbFetch<TmdbPagedResponse<TmdbMovieResult>>(
    '/search/movie',
    { query: trimmed, language: LANGUAGE, region: WATCH_REGION, include_adult: 'false', page: 1 },
    { revalidate: REVALIDATE.listings },
  );

  const available = await Promise.all(data.results.map((movie) => isStreamingInRegion(movie.id)));
  return data.results.filter((_, index) => available[index]).map(toMovie);
}

export async function getMovieDetails(id: number): Promise<MovieDetails | null> {
  try {
    const data = await tmdbFetch<TmdbMovieDetailsResponse>(
      `/movie/${id}`,
      {
        language: LANGUAGE,
        append_to_response: 'credits,videos,watch/providers',
        include_video_language: 'pt,en',
      },
      { revalidate: REVALIDATE.movie },
    );
    return toMovieDetails(data);
  } catch (error) {
    if (error instanceof TmdbError && error.status === 404) return null;
    throw error;
  }
}

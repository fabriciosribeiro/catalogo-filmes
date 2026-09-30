'use server';

import { parseFilters, searchParamsFromQueryString } from '@/lib/filters';
import { discoverStreaming } from '@/lib/tmdb/movies';
import type { MoviePage } from '@/lib/tmdb/types';

export async function loadMore(queryString: string, page: number): Promise<MoviePage> {
  const filters = parseFilters(searchParamsFromQueryString(String(queryString)));
  if (filters.query) return { movies: [], page, hasMore: false }; // busca não pagina
  return discoverStreaming(filters, page);
}

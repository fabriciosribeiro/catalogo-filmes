import { z } from 'zod';

export const SORT_OPTIONS = ['popularidade', 'nota', 'lancamento'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export type Filters = {
  providers: number[];
  genres: number[];
  yearFrom?: number;
  yearTo?: number;
  sort: SortOption;
  query?: string;
};

export type SearchParamsInput = Record<string, string | string[] | undefined>;

export const DEFAULT_FILTERS: Filters = { providers: [], genres: [], sort: 'popularidade' };

export const MIN_YEAR = 1900;
export const MAX_YEAR = 2100;
const MAX_QUERY_LENGTH = 100;
export const MAX_IDS_PER_FILTER = 20;

/** Valor de `p` que significa "todas as plataformas": impede que as plataformas salvas sejam aplicadas. */
export const ALL_PROVIDERS = 'todas';

export type SerializeOptions = { explicitAllProviders?: boolean };

const idSchema = z.coerce.number().int().positive();
const yearSchema = z.coerce.number().int().min(MIN_YEAR).max(MAX_YEAR);
const sortSchema = z.enum(SORT_OPTIONS);

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseIdList(raw: string | undefined): number[] {
  if (!raw) return [];
  const ids = raw.split(',').flatMap((part) => {
    const trimmed = part.trim();
    if (!trimmed) return [];
    const result = idSchema.safeParse(trimmed);
    return result.success ? [result.data] : [];
  });
  return [...new Set(ids)].slice(0, MAX_IDS_PER_FILTER);
}

function parseYear(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const result = yearSchema.safeParse(raw);
  return result.success ? result.data : undefined;
}

function parseYearRange(raw: string | undefined): Pick<Filters, 'yearFrom' | 'yearTo'> {
  const match = raw?.match(/^(\d{4})?-(\d{4})?$/);
  if (!match) return { yearFrom: undefined, yearTo: undefined };
  let yearFrom = parseYear(match[1]);
  let yearTo = parseYear(match[2]);
  if (yearFrom !== undefined && yearTo !== undefined && yearFrom > yearTo) {
    [yearFrom, yearTo] = [yearTo, yearFrom];
  }
  return { yearFrom, yearTo };
}

export function parseFilters(searchParams: SearchParamsInput): Filters {
  const query = first(searchParams.q)?.trim().slice(0, MAX_QUERY_LENGTH);
  if (query) return { providers: [], genres: [], sort: DEFAULT_FILTERS.sort, query };

  const sort = sortSchema.safeParse(first(searchParams.ordem));
  return {
    providers: parseIdList(first(searchParams.p)),
    genres: parseIdList(first(searchParams.g)),
    ...parseYearRange(first(searchParams.ano)),
    sort: sort.success ? sort.data : DEFAULT_FILTERS.sort,
  };
}

export function serializeFilters(filters: Filters, options: SerializeOptions = {}): string {
  const query = filters.query?.trim();
  if (query) return `q=${encodeURIComponent(query)}`;

  const parts: string[] = [];
  if (filters.providers.length) parts.push(`p=${filters.providers.join(',')}`);
  else if (options.explicitAllProviders) parts.push(`p=${ALL_PROVIDERS}`);
  if (filters.genres.length) parts.push(`g=${filters.genres.join(',')}`);
  if (filters.yearFrom !== undefined || filters.yearTo !== undefined) {
    parts.push(`ano=${filters.yearFrom ?? ''}-${filters.yearTo ?? ''}`);
  }
  if (filters.sort !== DEFAULT_FILTERS.sort) parts.push(`ordem=${filters.sort}`);
  return parts.join('&');
}

export function hasActiveFilters(filters: Filters): boolean {
  return serializeFilters(filters) !== '';
}

export function searchParamsFromQueryString(queryString: string): SearchParamsInput {
  return Object.fromEntries(new URLSearchParams(queryString));
}

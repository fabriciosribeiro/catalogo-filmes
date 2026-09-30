import type { Genre, Movie, Provider, TmdbGenre, TmdbMovieResult, TmdbProvider } from './types';

export function releaseYearOf(date: string | undefined): number | null {
  const year = Number(date?.slice(0, 4));
  return Number.isInteger(year) && year > 0 ? year : null;
}

export function toMovie(raw: TmdbMovieResult): Movie {
  return {
    id: raw.id,
    title: raw.title,
    posterPath: raw.poster_path,
    releaseYear: releaseYearOf(raw.release_date),
    voteAverage: raw.vote_average,
    genreIds: raw.genre_ids,
  };
}

export function toProvider(raw: TmdbProvider): Provider {
  return { id: raw.provider_id, name: raw.provider_name, logoPath: raw.logo_path };
}

export function toGenre(raw: TmdbGenre): Genre {
  return { id: raw.id, name: raw.name };
}

import type {
  CastMember,
  Genre,
  Movie,
  MovieDetails,
  Provider,
  TmdbCastMember,
  TmdbGenre,
  TmdbMovieDetailsResponse,
  TmdbMovieResult,
  TmdbProvider,
  TmdbVideo,
} from './types';
import { WATCH_REGION } from './config';

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

const MAX_CAST = 10;

export function pickTrailerKey(videos: TmdbVideo[]): string | null {
  const trailers = videos.filter((video) => video.site === 'YouTube' && video.type === 'Trailer');
  const trailer =
    trailers.find((video) => video.iso_639_1 === 'pt') ??
    trailers.find((video) => video.iso_639_1 === 'en');
  return trailer?.key ?? null;
}

function toCastMember(raw: TmdbCastMember): CastMember {
  return { id: raw.id, name: raw.name, character: raw.character, profilePath: raw.profile_path };
}

export function toMovieDetails(raw: TmdbMovieDetailsResponse): MovieDetails {
  const region = raw['watch/providers']?.results[WATCH_REGION];
  const cast = [...(raw.credits?.cast ?? [])].sort((a, b) => a.order - b.order).slice(0, MAX_CAST);
  return {
    id: raw.id,
    title: raw.title,
    overview: raw.overview,
    posterPath: raw.poster_path,
    backdropPath: raw.backdrop_path,
    releaseYear: releaseYearOf(raw.release_date),
    runtime: raw.runtime || null,
    voteAverage: raw.vote_average,
    genres: raw.genres.map(toGenre),
    cast: cast.map(toCastMember),
    trailerKey: pickTrailerKey(raw.videos?.results ?? []),
    streamingProviders: (region?.flatrate ?? []).map(toProvider),
    watchLink: region?.link ?? null,
  };
}

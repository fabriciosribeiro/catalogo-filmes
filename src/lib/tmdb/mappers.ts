import type {
  CastMember,
  FeaturedMovie,
  Genre,
  Movie,
  MovieDetails,
  Provider,
  TmdbCastMember,
  TmdbGenre,
  TmdbImage,
  TmdbMovieDetailsResponse,
  TmdbMovieResult,
  TmdbProvider,
  TmdbVideo,
  TitleLogo,
} from './types';
import { FEATURED_PROVIDER_IDS, WATCH_REGION } from './config';

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

/** Prefere o logo em português; cai para o inglês. A ordem do TMDB já vem por relevância. */
export function pickTitleLogo(logos: TmdbImage[]): TitleLogo | null {
  const logo =
    logos.find((image) => image.iso_639_1 === 'pt') ??
    logos.find((image) => image.iso_639_1 === 'en');
  return logo ? { path: logo.file_path, aspectRatio: logo.aspect_ratio } : null;
}

/**
 * No destaque, mostra só os serviços da faixa do catálogo (evita "Netflix" + "Netflix com anúncios").
 * Se nenhum deles tiver o filme, mantém a lista original.
 */
function preferFeaturedProviders(providers: Provider[]): Provider[] {
  const featured = providers.filter((provider) =>
    (FEATURED_PROVIDER_IDS as readonly number[]).includes(provider.id),
  );
  return featured.length ? featured : providers;
}

/** Só vira destaque o filme com imagem de fundo e disponível em assinatura no BR. */
export function toFeaturedMovie(raw: TmdbMovieDetailsResponse): FeaturedMovie | null {
  const details = toMovieDetails(raw);
  if (!details.backdropPath || !details.streamingProviders.length) return null;
  return {
    id: details.id,
    title: details.title,
    overview: details.overview,
    backdropPath: details.backdropPath,
    logo: pickTitleLogo(raw.images?.logos ?? []),
    releaseYear: details.releaseYear,
    runtime: details.runtime,
    voteAverage: details.voteAverage,
    genres: details.genres,
    trailerKey: details.trailerKey,
    streamingProviders: preferFeaturedProviders(details.streamingProviders),
  };
}

/** Card do catálogo a partir dos detalhes (usado pela Minha lista, que só guarda IDs). */
export function detailsToMovie(details: MovieDetails): Movie {
  return {
    id: details.id,
    title: details.title,
    posterPath: details.posterPath,
    releaseYear: details.releaseYear,
    voteAverage: details.voteAverage,
    genreIds: details.genres.map((genre) => genre.id),
  };
}

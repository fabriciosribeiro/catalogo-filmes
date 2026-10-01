// ---------- Formato cru do TMDB (somente os campos usados) ----------

export type TmdbPagedResponse<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

export type TmdbMovieResult = {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
};

export type TmdbProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority: number;
};

export type TmdbProviderListResponse = { results: TmdbProvider[] };

export type TmdbGenre = { id: number; name: string };
export type TmdbGenreListResponse = { genres: TmdbGenre[] };

export type TmdbWatchProviderRegion = {
  link?: string;
  flatrate?: TmdbProvider[];
  rent?: TmdbProvider[];
  buy?: TmdbProvider[];
};

export type TmdbWatchProvidersResponse = {
  id?: number;
  results: Partial<Record<string, TmdbWatchProviderRegion>>;
};

export type TmdbVideo = { key: string; site: string; type: string; iso_639_1: string };

export type TmdbImage = { file_path: string; iso_639_1: string | null; aspect_ratio: number };

export type TmdbCastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
};

export type TmdbMovieDetailsResponse = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number | null;
  vote_average: number;
  genres: TmdbGenre[];
  credits?: { cast: TmdbCastMember[] };
  videos?: { results: TmdbVideo[] };
  'watch/providers'?: TmdbWatchProvidersResponse;
  images?: { logos: TmdbImage[] };
};

// ---------- Tipos de domínio (o que a UI consome) ----------

export type Movie = {
  id: number;
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
  voteAverage: number;
  genreIds: number[];
};

export type MoviePage = { movies: Movie[]; page: number; hasMore: boolean };

export type Provider = { id: number; name: string; logoPath: string | null };

export type Genre = { id: number; name: string };

export type CastMember = {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
};

export type MovieDetails = {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseYear: number | null;
  runtime: number | null;
  voteAverage: number;
  genres: Genre[];
  cast: CastMember[];
  trailerKey: string | null;
  streamingProviders: Provider[];
  watchLink: string | null;
};

/** Logo oficial do título (PNG/SVG com fundo transparente). */
export type TitleLogo = { path: string; aspectRatio: number };

export type FeaturedMovie = Pick<
  MovieDetails,
  | 'id'
  | 'title'
  | 'overview'
  | 'releaseYear'
  | 'runtime'
  | 'voteAverage'
  | 'genres'
  | 'trailerKey'
  | 'streamingProviders'
> & { backdropPath: string; logo: TitleLogo | null };

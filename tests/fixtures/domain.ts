import type { FeaturedMovie, Genre, Movie, MovieDetails, Provider } from '@/lib/tmdb/types';

export const providers: Provider[] = [
  { id: 8, name: 'Netflix', logoPath: '/netflix.jpg' },
  { id: 119, name: 'Amazon Prime Video', logoPath: '/prime.jpg' },
  { id: 1899, name: 'Max', logoPath: null },
];

export const genres: Genre[] = [
  { id: 28, name: 'Ação' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Terror' },
];

export function makeMovie(overrides: Partial<Movie> = {}): Movie {
  return {
    id: 1,
    title: 'Filme Teste',
    posterPath: '/poster.jpg',
    releaseYear: 2023,
    voteAverage: 7.1,
    genreIds: [18],
    ...overrides,
  };
}

export function makeMovieDetails(overrides: Partial<MovieDetails> = {}): MovieDetails {
  return {
    id: 438631,
    title: 'Duna',
    overview: 'Paul Atreides precisa viajar para o planeta mais perigoso do universo.',
    posterPath: '/duna-poster.jpg',
    backdropPath: '/duna-backdrop.jpg',
    releaseYear: 2021,
    runtime: 155,
    voteAverage: 7.8,
    genres: [
      { id: 878, name: 'Ficção científica' },
      { id: 12, name: 'Aventura' },
    ],
    cast: [
      { id: 1, name: 'Timothée Chalamet', character: 'Paul Atreides', profilePath: '/tc.jpg' },
      { id: 2, name: 'Zendaya', character: 'Chani', profilePath: null },
    ],
    trailerKey: 'trailer-pt',
    streamingProviders: [{ id: 1899, name: 'Max', logoPath: '/max.jpg' }],
    watchLink: 'https://www.themoviedb.org/movie/438631-dune/watch?locale=BR',
    ...overrides,
  };
}

export function makeFeaturedMovie(overrides: Partial<FeaturedMovie> = {}): FeaturedMovie {
  return {
    id: 438631,
    title: 'Duna',
    overview: 'Paul Atreides precisa viajar para o planeta mais perigoso do universo.',
    backdropPath: '/duna-backdrop.jpg',
    logo: { path: '/duna-logo-pt.png', aspectRatio: 3.5 },
    releaseYear: 2021,
    runtime: 155,
    voteAverage: 7.8,
    genres: [
      { id: 878, name: 'Ficção científica' },
      { id: 12, name: 'Aventura' },
    ],
    trailerKey: 'trailer-pt',
    streamingProviders: [{ id: 1899, name: 'Max', logoPath: '/max.jpg' }],
    ...overrides,
  };
}

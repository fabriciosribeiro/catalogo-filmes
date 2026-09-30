import type { Genre, Movie } from '@/lib/tmdb/types';
import { MovieCard } from './movie-card';

export const GRID_CLASSES =
  'grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';

type Props = { movies: Movie[]; genres: Genre[] };

export function MovieGrid({ movies, genres }: Props) {
  const genreNames = new Map(genres.map((genre) => [genre.id, genre.name]));
  return (
    <ul className={GRID_CLASSES}>
      {movies.map((movie) => (
        <li key={movie.id}>
          <MovieCard
            movie={movie}
            genreLabel={movie.genreIds.map((id) => genreNames.get(id)).find(Boolean)}
          />
        </li>
      ))}
    </ul>
  );
}

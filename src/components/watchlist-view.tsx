import Link from 'next/link';
import { detailsToMovie } from '@/lib/tmdb/mappers';
import type { Genre, MovieDetails } from '@/lib/tmdb/types';
import { EmptyState, primaryActionClasses } from './empty-state';
import { MovieGrid } from './movie-grid';

export const OFF_STREAMING_BADGE = 'Fora do streaming';

export function WatchlistView({ movies }: { movies: MovieDetails[] }) {
  if (!movies.length) {
    return (
      <EmptyState
        title="Sua lista está vazia"
        description="Abra um filme e toque em “Salvar na lista” para guardá-lo aqui."
        action={
          <Link href="/" className={primaryActionClasses}>
            Explorar o catálogo
          </Link>
        }
      />
    );
  }

  const genres = [
    ...new Map(movies.flatMap((m) => m.genres).map((g): [number, Genre] => [g.id, g])).values(),
  ];
  const badges = Object.fromEntries(
    movies.filter((m) => !m.streamingProviders.length).map((m) => [m.id, OFF_STREAMING_BADGE]),
  );

  return (
    <>
      <h1 className="pt-6 pb-4 text-xl font-semibold">
        Minha lista <span className="text-muted">({movies.length})</span>
      </h1>
      <MovieGrid movies={movies.map(detailsToMovie)} genres={genres} badges={badges} />
    </>
  );
}

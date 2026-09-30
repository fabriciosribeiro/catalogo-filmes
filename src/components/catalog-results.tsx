import Link from 'next/link';
import { serializeFilters, type Filters } from '@/lib/filters';
import { discoverStreaming, searchStreaming } from '@/lib/tmdb/movies';
import type { Genre } from '@/lib/tmdb/types';
import { EmptyState, primaryActionClasses } from './empty-state';
import { InfiniteMovieList } from './infinite-movie-list';
import { MovieGrid } from './movie-grid';

export const FEW_RESULTS = 5;

type Props = { filters: Filters; genres: Genre[] };

export async function CatalogResults({ filters, genres }: Props) {
  if (filters.query) {
    const movies = await searchStreaming(filters.query);
    if (!movies.length) {
      return (
        <EmptyState
          title={`Nenhum resultado disponível em streaming para “${filters.query}”`}
          description="A busca mostra só filmes disponíveis agora em serviços de assinatura no Brasil."
          action={
            <Link href="/" className={primaryActionClasses}>
              Ver catálogo
            </Link>
          }
        />
      );
    }
    return (
      <>
        <MovieGrid movies={movies} genres={genres} />
        {movies.length < FEW_RESULTS && (
          <p className="mt-8 text-center text-sm text-muted">
            A busca considera os 20 resultados mais relevantes. Não achou? Tente um termo mais
            específico.
          </p>
        )}
      </>
    );
  }

  const firstPage = await discoverStreaming(filters, 1);
  if (!firstPage.movies.length) {
    return (
      <EmptyState
        title="Nenhum filme encontrado com esses filtros"
        action={
          <Link href="/" className={primaryActionClasses}>
            Limpar filtros
          </Link>
        }
      />
    );
  }
  return (
    <InfiniteMovieList
      initialPage={firstPage}
      queryString={serializeFilters(filters)}
      genres={genres}
    />
  );
}

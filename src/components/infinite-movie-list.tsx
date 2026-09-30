'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { loadMore } from '@/app/actions';
import type { Genre, Movie, MoviePage } from '@/lib/tmdb/types';
import { MovieGrid } from './movie-grid';
import { MovieGridSkeleton } from './movie-grid-skeleton';

type Status = 'idle' | 'loading' | 'error' | 'done';
type Props = { initialPage: MoviePage; queryString: string; genres: Genre[] };

function appendUnique(current: Movie[], incoming: Movie[]): Movie[] {
  const seen = new Set(current.map((movie) => movie.id));
  return [...current, ...incoming.filter((movie) => !seen.has(movie.id))];
}

export function InfiniteMovieList({ initialPage, queryString, genres }: Props) {
  const [movies, setMovies] = useState(initialPage.movies);
  const [page, setPage] = useState(initialPage.page);
  const [status, setStatus] = useState<Status>(initialPage.hasMore ? 'idle' : 'done');
  const inFlight = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadNext = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus('loading');
    try {
      const next = await loadMore(queryString, page + 1);
      setMovies((current) => appendUnique(current, next.movies));
      setPage(next.page);
      setStatus(next.hasMore ? 'idle' : 'done');
    } catch {
      setStatus('error');
    } finally {
      inFlight.current = false;
    }
  }, [page, queryString]);

  useEffect(() => {
    if (status !== 'idle' || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadNext();
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [status, loadNext]);

  return (
    <>
      <MovieGrid movies={movies} genres={genres} />
      {status === 'loading' && (
        <div className="mt-6">
          <MovieGridSkeleton count={6} />
        </div>
      )}
      {status === 'error' && (
        <p role="alert" className="mt-8 text-center text-sm text-muted">
          Não foi possível carregar mais —{' '}
          <button type="button" onClick={() => void loadNext()} className="text-accent underline">
            tentar de novo
          </button>
        </p>
      )}
      {status === 'idle' && <div ref={sentinelRef} aria-hidden className="h-px" />}
    </>
  );
}

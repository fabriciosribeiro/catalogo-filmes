import { getFeaturedMovies } from '@/lib/tmdb/movies';
import { FeaturedCarousel } from './featured-carousel';

export async function FeaturedSection() {
  const movies = await getFeaturedMovies();
  if (!movies.length) return null;
  return <FeaturedCarousel movies={movies} />;
}

export function FeaturedSkeleton() {
  return (
    <div
      aria-hidden
      className="-mx-4 flex min-h-[34rem] animate-pulse flex-col justify-end gap-4 bg-linear-to-t from-bg to-surface/60 px-4 pb-8 sm:min-h-[36rem] lg:h-[min(76svh,42rem)] lg:pb-12"
    >
      <div className="h-20 w-72 rounded-md bg-surface-2" />
      <div className="h-4 w-56 rounded bg-surface-2" />
      <div className="h-14 w-full max-w-xl rounded bg-surface-2" />
    </div>
  );
}

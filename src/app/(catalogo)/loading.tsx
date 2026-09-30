import { MovieGridSkeleton } from '@/components/movie-grid-skeleton';

export default function Loading() {
  return (
    <div className="pt-6">
      <MovieGridSkeleton />
    </div>
  );
}

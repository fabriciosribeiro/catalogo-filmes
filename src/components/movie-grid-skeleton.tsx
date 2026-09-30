import { GRID_CLASSES } from './movie-grid';

export function MovieGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div role="status">
      <span className="sr-only">Carregando filmes…</span>
      <ul className={GRID_CLASSES} aria-hidden>
        {Array.from({ length: count }, (_, i) => (
          <li key={i} className="animate-pulse">
            <div className="aspect-[2/3] rounded-md bg-surface" />
            <div className="mt-2 h-4 w-3/4 rounded bg-surface" />
            <div className="mt-1 h-3 w-1/2 rounded bg-surface" />
          </li>
        ))}
      </ul>
    </div>
  );
}

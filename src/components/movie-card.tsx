import Image from 'next/image';
import Link from 'next/link';
import { formatRating } from '@/lib/format';
import { tmdbImageUrl } from '@/lib/tmdb/images';
import type { Movie } from '@/lib/tmdb/types';

type Props = { movie: Movie; genreLabel?: string; badge?: string };

export function MovieCard({ movie, genreLabel, badge }: Props) {
  const poster = tmdbImageUrl(movie.posterPath, 'w342');
  const meta = [movie.releaseYear, genreLabel].filter(Boolean).join(' · ');

  return (
    <Link
      href={`/filme/${movie.id}`}
      className="group block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-surface">
        {poster ? (
          <Image
            src={poster}
            alt={`Pôster de ${movie.title}`}
            fill
            sizes="(min-width: 1280px) 16vw, (min-width: 1024px) 20vw, (min-width: 768px) 25vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            role="img"
            aria-label={`Sem pôster: ${movie.title}`}
            className="flex h-full items-center justify-center p-3 text-center text-sm text-muted"
          >
            <span aria-hidden>{movie.title}</span>
          </div>
        )}
        {movie.voteAverage > 0 && (
          <span className="absolute top-1.5 right-1.5 rounded bg-accent px-1.5 py-0.5 text-xs font-bold text-accent-fg">
            ★ {formatRating(movie.voteAverage)}
          </span>
        )}
        {badge && (
          <span className="absolute bottom-1.5 left-1.5 rounded bg-bg/85 px-1.5 py-0.5 text-[11px] font-semibold text-muted">
            {badge}
          </span>
        )}
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm font-semibold">{movie.title}</h3>
      {meta && <p className="text-xs text-muted">{meta}</p>}
    </Link>
  );
}

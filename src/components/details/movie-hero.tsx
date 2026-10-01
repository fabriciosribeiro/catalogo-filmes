import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { formatRating, formatRuntime } from '@/lib/format';
import { tmdbImageUrl } from '@/lib/tmdb/images';
import type { MovieDetails } from '@/lib/tmdb/types';
import { TrailerModal } from './trailer-modal';
import { WatchProviders } from './watch-providers';

export function MovieHero({ movie, children }: { movie: MovieDetails; children?: ReactNode }) {
  const backdrop = tmdbImageUrl(movie.backdropPath, 'w1280');
  const poster = tmdbImageUrl(movie.posterPath, 'w342');
  const meta = [
    movie.releaseYear,
    movie.runtime ? formatRuntime(movie.runtime) : null,
    movie.genres.map((genre) => genre.name).join(', ') || null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <section className="relative -mx-4">
      <div className="relative h-56 sm:h-80 lg:h-[26rem]">
        {backdrop && (
          <Image src={backdrop} alt="" fill priority sizes="100vw" className="object-cover" />
        )}
        <div className="absolute inset-0 bg-linear-to-b from-bg/10 via-bg/60 to-bg" />
        <Link
          href="/"
          className="absolute top-4 left-4 rounded bg-bg/60 px-2 py-1 text-sm text-muted hover:text-fg"
        >
          ← Voltar ao catálogo
        </Link>
      </div>
      <div className="relative -mt-24 flex flex-col gap-6 px-4 sm:-mt-40 sm:flex-row">
        <div className="relative aspect-[2/3] w-32 shrink-0 overflow-hidden rounded-lg bg-surface shadow-2xl shadow-black/60 sm:w-52">
          {poster && (
            <Image
              src={poster}
              alt={`Pôster de ${movie.title}`}
              fill
              priority
              sizes="208px"
              className="object-cover"
            />
          )}
        </div>
        <div className="flex flex-col gap-4 sm:pt-36">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{movie.title}</h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
            {movie.voteAverage > 0 && (
              <span className="rounded bg-accent px-1.5 py-0.5 text-xs font-bold text-accent-fg">
                ★ {formatRating(movie.voteAverage)}
              </span>
            )}
            {meta && <span>{meta}</span>}
          </p>
          <WatchProviders providers={movie.streamingProviders} link={movie.watchLink} />
          {(movie.trailerKey || children) && (
            <div className="flex flex-wrap items-start gap-3">
              {movie.trailerKey && (
                <TrailerModal trailerKey={movie.trailerKey} title={movie.title} />
              )}
              {children}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

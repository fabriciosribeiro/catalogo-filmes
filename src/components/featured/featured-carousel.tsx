'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { formatRating, formatRuntime } from '@/lib/format';
import { tmdbImageUrl } from '@/lib/tmdb/images';
import type { FeaturedMovie } from '@/lib/tmdb/types';
import { TrailerModal } from '../details/trailer-modal';

/** Tempo de cada destaque na tela. A barra de progresso da aba ativa é o próprio cronômetro. */
export const SLIDE_DURATION_MS = 8000;
const SWIPE_THRESHOLD_PX = 50;

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

function usePageHidden(): boolean {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const update = () => setHidden(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return hidden;
}

type Props = { movies: FeaturedMovie[] };

export function FeaturedCarousel({ movies }: Props) {
  const baseId = useId();
  const count = movies.length;
  const [active, setActive] = useState(0);
  const [visited, setVisited] = useState(() => new Set([0]));
  const [pausedByUser, setPausedByUser] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [keyboardInside, setKeyboardInside] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const pageHidden = usePageHidden();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const touchStartX = useRef<number | null>(null);

  const autoplay = count > 1 && !reducedMotion;
  const running =
    autoplay && !pausedByUser && !hovering && !keyboardInside && !trailerOpen && !pageHidden;
  const next = (active + 1) % count;
  const movie = movies[active];

  const goTo = (index: number) => {
    const target = (index + count) % count;
    setActive(target);
    setVisited((current) => (current.has(target) ? current : new Set(current).add(target)));
  };

  const onTabKeyDown = (event: React.KeyboardEvent) => {
    const moves: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: count - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const target = (moves[event.key] + count) % count;
    goTo(target);
    tabRefs.current[target]?.focus();
  };

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Em alta nesta semana"
      className="relative -mx-4 overflow-hidden"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      // Só o foco de teclado pausa: um clique numa aba não deve congelar o carrossel.
      onFocus={(event) => setKeyboardInside(event.target.matches(':focus-visible'))}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setKeyboardInside(false);
      }}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0].clientX;
      }}
      onTouchEnd={(event) => {
        if (touchStartX.current === null || count < 2) return;
        const delta = event.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(delta) >= SWIPE_THRESHOLD_PX) goTo(active + (delta < 0 ? 1 : -1));
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 xl:mask-x-from-92% xl:mask-x-to-100%"
        data-testid="featured-backdrops"
      >
        {movies.map((item, index) =>
          index === active || index === next || visited.has(index) ? (
            <Image
              key={item.id}
              src={tmdbImageUrl(item.backdropPath, 'w1280')!}
              alt=""
              fill
              priority={index === 0}
              sizes="(min-width: 1280px) 1280px, 100vw"
              className={`object-cover object-[70%_20%] transition-opacity duration-1000 ease-out motion-reduce:transition-none ${
                index === active ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : null,
        )}
        <div className="absolute inset-0 bg-linear-to-t from-bg via-bg/50 via-45% to-bg/10" />
        <div className="absolute inset-0 hidden bg-linear-to-r from-bg/85 via-bg/30 via-50% to-transparent sm:block" />
      </div>

      <div className="relative flex min-h-[34rem] flex-col justify-end gap-8 px-4 pt-40 pb-8 sm:min-h-[36rem] lg:h-[min(76svh,42rem)] lg:flex-row lg:items-end lg:justify-between lg:pb-12">
        <div
          id={`${baseId}-panel`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${active}`}
          aria-live={running ? 'off' : 'polite'}
          className="max-w-xl"
        >
          <div
            key={movie.id}
            className="flex flex-col items-start gap-4 motion-safe:animate-featured-in"
          >
            <h2>
              {movie.logo ? (
                <Image
                  src={tmdbImageUrl(movie.logo.path, 'w500')!}
                  alt={movie.title}
                  width={500}
                  height={Math.round(500 / movie.logo.aspectRatio)}
                  priority={active === 0}
                  className="h-auto max-h-24 w-auto max-w-[min(100%,24rem)] object-contain object-left drop-shadow-[0_2px_12px_rgb(0_0_0/0.6)] sm:max-h-32 lg:max-h-40 lg:max-w-[28rem]"
                />
              ) : (
                <span className="block text-4xl leading-none font-extrabold tracking-tight text-balance text-white drop-shadow-[0_2px_12px_rgb(0_0_0/0.6)] sm:text-6xl">
                  {movie.title}
                </span>
              )}
            </h2>

            <FeaturedMeta movie={movie} />

            {movie.overview && (
              <p className="line-clamp-3 max-w-[55ch] text-sm leading-relaxed text-fg/85 sm:text-base">
                {movie.overview}
              </p>
            )}

            <div className="flex items-center gap-3">
              <span className="text-sm text-fg/75">Disponível em</span>
              <ul className="flex items-center gap-2">
                {movie.streamingProviders.map((provider) => {
                  const logo = tmdbImageUrl(provider.logoPath, 'w92');
                  return (
                    <li
                      key={provider.id}
                      title={provider.name}
                      className="relative flex size-9 items-center justify-center overflow-hidden rounded-lg bg-surface-2 text-[9px] ring-1 ring-white/15"
                    >
                      {logo ? (
                        <Image
                          src={logo}
                          alt={provider.name}
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      ) : (
                        provider.name
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {movie.trailerKey && (
                <TrailerModal
                  trailerKey={movie.trailerKey}
                  title={movie.title}
                  onOpenChange={setTrailerOpen}
                />
              )}
              <Link
                href={`/filme/${movie.id}`}
                className={
                  movie.trailerKey
                    ? 'rounded-md bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
                    : 'rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
                }
              >
                Mais informações
              </Link>
            </div>
          </div>
        </div>

        {count > 1 && (
          <div className="flex items-end gap-3 lg:shrink-0">
            <div className="flex-1 lg:flex-none">
              <p id={`${baseId}-label`} className="mb-2 hidden text-sm text-fg/75 lg:block">
                Em alta nesta semana
              </p>
              <div
                role="tablist"
                aria-labelledby={`${baseId}-label`}
                className="flex gap-1.5 lg:gap-2"
                onKeyDown={onTabKeyDown}
              >
                {movies.map((item, index) => (
                  <FeaturedTab
                    key={item.id}
                    ref={(node) => {
                      tabRefs.current[index] = node;
                    }}
                    id={`${baseId}-tab-${index}`}
                    panelId={`${baseId}-panel`}
                    movie={item}
                    selected={index === active}
                    animate={autoplay}
                    running={running}
                    onSelect={() => goTo(index)}
                    onComplete={() => goTo(index + 1)}
                  />
                ))}
              </div>
            </div>
            {!reducedMotion && (
              <button
                type="button"
                onClick={() => setPausedByUser((paused) => !paused)}
                aria-label={pausedByUser ? 'Retomar destaques' : 'Pausar destaques'}
                className="mb-[-0.3rem] flex size-9 shrink-0 items-center justify-center rounded-full text-fg/80 ring-1 ring-white/30 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:mb-0"
              >
                {pausedByUser ? <PlayIcon /> : <PauseIcon />}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function FeaturedMeta({ movie }: { movie: FeaturedMovie }) {
  const genres = movie.genres
    .slice(0, 2)
    .map((genre) => genre.name)
    .join(', ');
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-fg/90">
      {movie.voteAverage > 0 && (
        <span className="rounded bg-accent px-1.5 py-0.5 text-xs font-bold text-accent-fg">
          ★ {formatRating(movie.voteAverage)}
        </span>
      )}
      {movie.releaseYear && <span>{movie.releaseYear}</span>}
      {movie.runtime && <span>{formatRuntime(movie.runtime)}</span>}
      {genres && <span className="text-fg/70">{genres}</span>}
    </p>
  );
}

type TabProps = {
  ref: React.Ref<HTMLButtonElement>;
  id: string;
  panelId: string;
  movie: FeaturedMovie;
  selected: boolean;
  animate: boolean;
  running: boolean;
  onSelect: () => void;
  onComplete: () => void;
};

function FeaturedTab({
  ref,
  id,
  panelId,
  movie,
  selected,
  animate,
  running,
  onSelect,
  onComplete,
}: TabProps) {
  return (
    <button
      ref={ref}
      id={id}
      type="button"
      role="tab"
      aria-selected={selected}
      aria-controls={panelId}
      aria-label={movie.title}
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      className="group flex-1 rounded-md py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:w-28 lg:flex-none lg:py-0"
    >
      <span
        className={`relative mb-2 hidden aspect-video overflow-hidden rounded-md bg-surface ring-1 transition lg:block ${
          selected
            ? 'ring-white/70'
            : 'opacity-60 ring-white/10 group-hover:opacity-100 group-hover:ring-white/40'
        }`}
      >
        <Image
          src={tmdbImageUrl(movie.backdropPath, 'w300')!}
          alt=""
          fill
          sizes="112px"
          className="object-cover"
        />
      </span>
      <span className="block h-1 overflow-hidden rounded-full bg-white/25">
        {selected && (
          <span
            data-testid="featured-progress"
            onAnimationEnd={onComplete}
            className="block h-full origin-left rounded-full bg-accent"
            style={
              animate
                ? {
                    animation: `featured-progress ${SLIDE_DURATION_MS}ms linear forwards`,
                    animationPlayState: running ? 'running' : 'paused',
                  }
                : undefined
            }
          />
        )}
      </span>
    </button>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="size-3.5 fill-current">
      <rect x="3" y="2" width="3.5" height="12" rx="1" />
      <rect x="9.5" y="2" width="3.5" height="12" rx="1" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="size-3.5 fill-current">
      <path d="M4 2.5v11a1 1 0 0 0 1.5.86l9-5.5a1 1 0 0 0 0-1.72l-9-5.5A1 1 0 0 0 4 2.5Z" />
    </svg>
  );
}

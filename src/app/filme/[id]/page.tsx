import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CastList } from '@/components/details/cast-list';
import { MovieHero } from '@/components/details/movie-hero';
import { WatchlistButton } from '@/components/details/watchlist-button';
import { parseMovieId } from '@/lib/movie-id';
import { getCurrentUser } from '@/lib/supabase/auth';
import { isInWatchlist } from '@/lib/supabase/watchlist';
import { getMovieDetails } from '@/lib/tmdb/movies';

type Props = { params: Promise<{ id: string }> };

async function loadMovie(rawId: string) {
  const id = parseMovieId(rawId);
  if (id === null) notFound();
  const movie = await getMovieDetails(id);
  if (!movie) notFound();
  return movie;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const movie = await loadMovie((await params).id);
  return { title: movie.title, description: movie.overview.slice(0, 160) || undefined };
}

export default async function MovieDetailsPage({ params }: Props) {
  const movie = await loadMovie((await params).id);
  const user = await getCurrentUser();
  // Se o Supabase falhar, o botão começa como "não salvo" em vez de derrubar a página
  const saved = user ? await isInWatchlist(user.id, movie.id).catch(() => false) : false;
  return (
    <>
      <MovieHero movie={movie}>
        <WatchlistButton tmdbId={movie.id} initialSaved={saved} signedIn={user !== null} />
      </MovieHero>
      <section className="mt-10 max-w-3xl">
        <h2 className="text-lg font-semibold">Sinopse</h2>
        <p className="mt-2 leading-relaxed text-muted">
          {movie.overview || 'Sinopse não disponível.'}
        </p>
      </section>
      {movie.cast.length > 0 && <CastList cast={movie.cast} />}
    </>
  );
}

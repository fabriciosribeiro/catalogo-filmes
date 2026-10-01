import type { Metadata } from 'next';
import { WatchlistView } from '@/components/watchlist-view';
import { requireUser } from '@/lib/supabase/auth';
import { getWatchlistIds } from '@/lib/supabase/watchlist';
import { getMovieDetails } from '@/lib/tmdb/movies';
import type { MovieDetails } from '@/lib/tmdb/types';

export const metadata: Metadata = { title: 'Minha lista' };

export default async function MyListPage() {
  const user = await requireUser('/minha-lista');
  const ids = await getWatchlistIds(user.id);
  // Detalhes com cache de 24h; filmes que sumiram do TMDB (404) são omitidos
  const movies = (await Promise.all(ids.map((id) => getMovieDetails(id)))).filter(
    (movie): movie is MovieDetails => movie !== null,
  );
  return <WatchlistView movies={movies} />;
}

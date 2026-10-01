import 'server-only';
import { createSupabaseServerClient } from './server';

/** Mesmo valor do trigger `enforce_watchlist_limit` no banco. */
export const WATCHLIST_LIMIT = 100;
const LIMIT_ERROR_CODE = 'EC001';

export async function getWatchlistIds(userId: string): Promise<number[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('watchlist')
    .select('tmdb_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Falha ao ler a lista: ${error.message}`);
  return data.map((row) => row.tmdb_id);
}

export async function isInWatchlist(userId: string, tmdbId: number): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('watchlist')
    .select('tmdb_id')
    .eq('user_id', userId)
    .eq('tmdb_id', tmdbId)
    .maybeSingle();
  if (error) throw new Error(`Falha ao ler a lista: ${error.message}`);
  return data !== null;
}

/** Salvar um filme que já está na lista é um no-op. */
export async function addToWatchlist(userId: string, tmdbId: number): Promise<'added' | 'full'> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('watchlist')
    .upsert(
      { user_id: userId, tmdb_id: tmdbId },
      { onConflict: 'user_id,tmdb_id', ignoreDuplicates: true },
    );
  if (error?.code === LIMIT_ERROR_CODE) return 'full';
  if (error) throw new Error(`Falha ao salvar na lista: ${error.message}`);
  return 'added';
}

export async function removeFromWatchlist(userId: string, tmdbId: number): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', userId)
    .eq('tmdb_id', tmdbId);
  if (error) throw new Error(`Falha ao remover da lista: ${error.message}`);
}

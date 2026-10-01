'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/supabase/auth';
import { addToWatchlist, removeFromWatchlist, WATCHLIST_LIMIT } from '@/lib/supabase/watchlist';

export type ToggleResult = { ok: true; saved: boolean } | { ok: false; message: string };

const inputSchema = z.object({ tmdbId: z.number().int().positive(), save: z.boolean() });

export async function toggleWatchlist(tmdbId: number, save: boolean): Promise<ToggleResult> {
  const parsed = inputSchema.safeParse({ tmdbId, save });
  if (!parsed.success) return { ok: false, message: 'Filme inválido.' };

  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Entre na sua conta para salvar filmes.' };

  try {
    if (parsed.data.save) {
      const result = await addToWatchlist(user.id, parsed.data.tmdbId);
      if (result === 'full') {
        return { ok: false, message: `Sua lista chegou ao limite de ${WATCHLIST_LIMIT} filmes.` };
      }
    } else {
      await removeFromWatchlist(user.id, parsed.data.tmdbId);
    }
  } catch {
    return { ok: false, message: 'Não foi possível atualizar sua lista. Tente de novo.' };
  }

  revalidatePath('/minha-lista');
  return { ok: true, saved: parsed.data.save };
}

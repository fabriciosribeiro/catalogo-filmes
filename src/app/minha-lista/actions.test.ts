import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toggleWatchlist } from './actions';

const auth = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));
vi.mock('@/lib/supabase/auth', () => auth);

const watchlist = vi.hoisted(() => ({ addToWatchlist: vi.fn(), removeFromWatchlist: vi.fn() }));
vi.mock('@/lib/supabase/watchlist', () => ({ ...watchlist, WATCHLIST_LIMIT: 100 }));

const cache = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
vi.mock('next/cache', () => cache);

beforeEach(() => {
  auth.getCurrentUser.mockResolvedValue({ id: 'u1', email: 'ana@exemplo.com' });
  watchlist.addToWatchlist.mockResolvedValue('added');
  watchlist.removeFromWatchlist.mockResolvedValue(undefined);
});

describe('toggleWatchlist', () => {
  it('salva com o usuário da sessão', async () => {
    expect(await toggleWatchlist(438631, true)).toEqual({ ok: true, saved: true });
    expect(watchlist.addToWatchlist).toHaveBeenCalledWith('u1', 438631);
    expect(cache.revalidatePath).toHaveBeenCalledWith('/minha-lista');
  });

  it('remove', async () => {
    expect(await toggleWatchlist(438631, false)).toEqual({ ok: true, saved: false });
    expect(watchlist.removeFromWatchlist).toHaveBeenCalledWith('u1', 438631);
  });

  it('lista cheia', async () => {
    watchlist.addToWatchlist.mockResolvedValue('full');
    expect(await toggleWatchlist(438631, true)).toEqual({
      ok: false,
      message: 'Sua lista chegou ao limite de 100 filmes.',
    });
  });

  it('sem sessão', async () => {
    auth.getCurrentUser.mockResolvedValue(null);
    expect(await toggleWatchlist(438631, true)).toEqual({
      ok: false,
      message: 'Entre na sua conta para salvar filmes.',
    });
    expect(watchlist.addToWatchlist).not.toHaveBeenCalled();
  });

  it.each([
    [0, true],
    [-1, true],
    [1.5, true],
    ['438631', true],
    [438631, 'sim'],
  ])('entrada inválida (%j, %j) não toca o banco', async (id, save) => {
    expect(await toggleWatchlist(id as never, save as never)).toEqual({
      ok: false,
      message: 'Filme inválido.',
    });
    expect(watchlist.addToWatchlist).not.toHaveBeenCalled();
    expect(watchlist.removeFromWatchlist).not.toHaveBeenCalled();
  });

  it('falha no banco vira mensagem amigável', async () => {
    watchlist.addToWatchlist.mockRejectedValue(new Error('timeout'));
    expect(await toggleWatchlist(438631, true)).toEqual({
      ok: false,
      message: 'Não foi possível atualizar sua lista. Tente de novo.',
    });
  });
});

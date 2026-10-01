import { describe, expect, it, vi } from 'vitest';
import { savedProvidersForCatalog } from './catalog-providers';

const auth = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));
vi.mock('@/lib/supabase/auth', () => auth);

const store = vi.hoisted(() => ({ getSavedProviders: vi.fn() }));
vi.mock('@/lib/supabase/user-providers', () => store);

describe('savedProvidersForCatalog', () => {
  it('devolve as plataformas do usuário logado', async () => {
    auth.getCurrentUser.mockResolvedValue({ id: 'u1', email: 'ana@exemplo.com' });
    store.getSavedProviders.mockResolvedValue([8, 119]);
    expect(await savedProvidersForCatalog()).toEqual([8, 119]);
    expect(store.getSavedProviders).toHaveBeenCalledWith('u1');
  });

  it('deslogado: nenhuma, sem consultar o banco', async () => {
    auth.getCurrentUser.mockResolvedValue(null);
    expect(await savedProvidersForCatalog()).toEqual([]);
    expect(store.getSavedProviders).not.toHaveBeenCalled();
  });

  it('Supabase fora do ar: segue como deslogado em vez de derrubar o catálogo', async () => {
    auth.getCurrentUser.mockRejectedValue(new Error('fetch failed'));
    expect(await savedProvidersForCatalog()).toEqual([]);
  });

  it('falha ao ler as plataformas: segue sem elas', async () => {
    auth.getCurrentUser.mockResolvedValue({ id: 'u1', email: 'ana@exemplo.com' });
    store.getSavedProviders.mockRejectedValue(new Error('timeout'));
    expect(await savedProvidersForCatalog()).toEqual([]);
  });
});

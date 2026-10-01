import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveMyProvidersAction } from './actions';

const auth = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));
vi.mock('@/lib/supabase/auth', () => auth);

const store = vi.hoisted(() => ({ saveProviders: vi.fn() }));
vi.mock('@/lib/supabase/user-providers', () => store);

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

function form(ids: string[]) {
  const data = new FormData();
  for (const id of ids) data.append('p', id);
  return data;
}

beforeEach(() => {
  auth.getCurrentUser.mockResolvedValue({ id: 'u1', email: 'ana@exemplo.com' });
  store.saveProviders.mockResolvedValue(undefined);
});

describe('saveMyProvidersAction', () => {
  it('salva as plataformas e abre o catálogo', async () => {
    await expect(saveMyProvidersAction({}, form(['8', '119']))).rejects.toThrow('NEXT_REDIRECT:/');
    expect(store.saveProviders).toHaveBeenCalledWith('u1', [8, 119]);
  });

  it('remove duplicadas', async () => {
    await expect(saveMyProvidersAction({}, form(['8', '8']))).rejects.toThrow('NEXT_REDIRECT:/');
    expect(store.saveProviders).toHaveBeenCalledWith('u1', [8]);
  });

  it('nenhuma marcada limpa a seleção', async () => {
    await expect(saveMyProvidersAction({}, form([]))).rejects.toThrow('NEXT_REDIRECT:/');
    expect(store.saveProviders).toHaveBeenCalledWith('u1', []);
  });

  it.each([['999'], ['8', 'abc'], ['-8']])('recusa fora da allowlist %j', async (...ids) => {
    expect(await saveMyProvidersAction({}, form(ids))).toEqual({
      error: 'Seleção de plataformas inválida.',
    });
    expect(store.saveProviders).not.toHaveBeenCalled();
  });

  it('sem sessão manda para o login', async () => {
    auth.getCurrentUser.mockResolvedValue(null);
    await expect(saveMyProvidersAction({}, form(['8']))).rejects.toThrow(
      'NEXT_REDIRECT:/entrar?voltar=%2Fminhas-plataformas',
    );
    expect(store.saveProviders).not.toHaveBeenCalled();
  });

  it('falha no banco vira mensagem amigável', async () => {
    store.saveProviders.mockRejectedValue(new Error('timeout'));
    expect(await saveMyProvidersAction({}, form(['8']))).toEqual({
      error: 'Não foi possível salvar agora. Tente de novo.',
    });
  });
});

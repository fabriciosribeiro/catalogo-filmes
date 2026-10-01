import { describe, expect, it, vi } from 'vitest';
import { getCurrentUser } from './auth';

const server = vi.hoisted(() => ({ createSupabaseServerClient: vi.fn() }));
vi.mock('./server', () => server);

describe('getCurrentUser', () => {
  it('devolve o usuário validado pelo Supabase', async () => {
    server.createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: { user: { id: 'u1', email: 'ana@exemplo.com' } },
          error: null,
        }),
      },
    });
    expect(await getCurrentUser()).toEqual({ id: 'u1', email: 'ana@exemplo.com' });
  });

  it('Supabase mal configurado (env ausente) vira visitante deslogado em vez de derrubar o site', async () => {
    server.createSupabaseServerClient.mockRejectedValue(
      new Error('Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
    );
    expect(await getCurrentUser()).toBeNull();
  });

  it('não engole os erros internos do Next (render dinâmico precisa saber que a página lê cookies)', async () => {
    const dynamicUsage = Object.assign(new Error('Dynamic server usage: cookies'), {
      digest: 'DYNAMIC_SERVER_USAGE',
    });
    server.createSupabaseServerClient.mockRejectedValue(dynamicUsage);
    await expect(getCurrentUser()).rejects.toBe(dynamicUsage);
  });
});

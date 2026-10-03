import { describe, expect, it, vi } from 'vitest';
import {
  exchangeRecoveryCode,
  getCurrentUser,
  sendPasswordReset,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  updatePassword,
  verifyRecoveryToken,
} from './auth';

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

describe('wrappers de auth', () => {
  const misconfigured = new Error('Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.');

  it.each([
    ['signInWithPassword', () => signInWithPassword('ana@exemplo.com', 'x')],
    ['signUpWithPassword', () => signUpWithPassword('ana@exemplo.com', '12345678')],
    ['sendPasswordReset', () => sendPasswordReset('ana@exemplo.com', 'http://x/auth/confirmar')],
    ['verifyRecoveryToken', () => verifyRecoveryToken('hash')],
    ['exchangeRecoveryCode', () => exchangeRecoveryCode('code')],
    ['updatePassword', () => updatePassword('12345678')],
  ])('%s: falha de infraestrutura vira resultado de erro, não exceção', async (_name, call) => {
    server.createSupabaseServerClient.mockRejectedValue(misconfigured);
    expect(await call()).toEqual({ ok: false, code: undefined });
  });

  it('signOut: falha de infraestrutura não lança', async () => {
    server.createSupabaseServerClient.mockRejectedValue(misconfigured);
    await expect(signOut()).resolves.toBeUndefined();
  });

  it('exchangeRecoveryCode troca o código PKCE do e-mail por uma sessão', async () => {
    const exchangeCodeForSession = vi.fn(async () => ({ data: {}, error: null }));
    server.createSupabaseServerClient.mockResolvedValue({ auth: { exchangeCodeForSession } });
    expect(await exchangeRecoveryCode('abc')).toEqual({ ok: true });
    expect(exchangeCodeForSession).toHaveBeenCalledWith('abc');
  });
});

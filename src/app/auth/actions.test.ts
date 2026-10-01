import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RESET_SENT_MESSAGE } from '@/lib/auth-schemas';
import {
  requestPasswordResetAction,
  signInAction,
  signOutAction,
  signUpAction,
  updatePasswordAction,
} from './actions';

const auth = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  signInWithPassword: vi.fn(),
  signUpWithPassword: vi.fn(),
  sendPasswordReset: vi.fn(),
  updatePassword: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('@/lib/supabase/auth', () => auth);

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

const requestHeaders = vi.hoisted(() => new Headers({ origin: 'http://localhost:3000' }));
vi.mock('next/headers', () => ({ headers: async () => requestHeaders }));

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

beforeEach(() => {
  auth.signInWithPassword.mockResolvedValue({ ok: true });
  auth.signUpWithPassword.mockResolvedValue({ ok: true });
  auth.sendPasswordReset.mockResolvedValue({ ok: true });
  auth.updatePassword.mockResolvedValue({ ok: true });
  auth.getCurrentUser.mockResolvedValue({ id: 'u1', email: 'ana@exemplo.com' });
});

describe('signInAction', () => {
  it('entra e volta para a página de origem', async () => {
    await expect(
      signInAction({}, form({ email: 'ana@exemplo.com', password: 'x', voltar: '/filme/1' })),
    ).rejects.toThrow('NEXT_REDIRECT:/filme/1');
  });

  it('normaliza o e-mail (espaços e maiúsculas)', async () => {
    await expect(
      signInAction({}, form({ email: '  Ana@Exemplo.COM ', password: 'x' })),
    ).rejects.toThrow('NEXT_REDIRECT:/');
    expect(auth.signInWithPassword).toHaveBeenCalledWith('ana@exemplo.com', 'x');
  });

  it('ignora voltar externo', async () => {
    await expect(
      signInAction({}, form({ email: 'ana@exemplo.com', password: 'x', voltar: '//evil.com' })),
    ).rejects.toThrow('NEXT_REDIRECT:/');
  });

  it('e-mail inválido não chama o Supabase', async () => {
    expect(await signInAction({}, form({ email: 'ana', password: 'x' }))).toEqual({
      error: 'Informe um e-mail válido.',
    });
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('campos ausentes devolvem erro amigável', async () => {
    expect(await signInAction({}, new FormData())).toEqual({ error: 'Informe um e-mail válido.' });
  });

  it('credenciais erradas viram mensagem em português', async () => {
    auth.signInWithPassword.mockResolvedValue({ ok: false, code: 'invalid_credentials' });
    expect(await signInAction({}, form({ email: 'ana@exemplo.com', password: 'x' }))).toEqual({
      error: 'E-mail ou senha incorretos.',
    });
  });
});

describe('signUpAction', () => {
  it('cria a conta e entra', async () => {
    await expect(
      signUpAction({}, form({ email: 'ana@exemplo.com', password: '12345678' })),
    ).rejects.toThrow('NEXT_REDIRECT:/');
    expect(auth.signUpWithPassword).toHaveBeenCalledWith('ana@exemplo.com', '12345678');
  });

  it('senha curta não chama o Supabase', async () => {
    expect(await signUpAction({}, form({ email: 'ana@exemplo.com', password: '1234567' }))).toEqual(
      { error: 'A senha precisa ter pelo menos 8 caracteres.' },
    );
    expect(auth.signUpWithPassword).not.toHaveBeenCalled();
  });

  it('e-mail já cadastrado', async () => {
    auth.signUpWithPassword.mockResolvedValue({ ok: false, code: 'user_already_exists' });
    expect(
      await signUpAction({}, form({ email: 'ana@exemplo.com', password: '12345678' })),
    ).toEqual({ error: 'Já existe uma conta com este e-mail.' });
  });
});

describe('requestPasswordResetAction', () => {
  it('envia o link apontando para /auth/confirmar na origem do request', async () => {
    expect(await requestPasswordResetAction({}, form({ email: 'ana@exemplo.com' }))).toEqual({
      success: RESET_SENT_MESSAGE,
    });
    expect(auth.sendPasswordReset).toHaveBeenCalledWith(
      'ana@exemplo.com',
      'http://localhost:3000/auth/confirmar',
    );
  });

  it('não revela se o e-mail existe nem se o envio falhou', async () => {
    auth.sendPasswordReset.mockResolvedValue({ ok: false, code: 'over_email_send_rate_limit' });
    expect(await requestPasswordResetAction({}, form({ email: 'ana@exemplo.com' }))).toEqual({
      success: RESET_SENT_MESSAGE,
    });
  });

  it('e-mail inválido', async () => {
    expect(await requestPasswordResetAction({}, form({ email: 'x' }))).toEqual({
      error: 'Informe um e-mail válido.',
    });
  });
});

describe('updatePasswordAction', () => {
  it('troca a senha e vai para o catálogo', async () => {
    await expect(
      updatePasswordAction({}, form({ password: 'nova-senha-1', confirm: 'nova-senha-1' })),
    ).rejects.toThrow('NEXT_REDIRECT:/');
    expect(auth.updatePassword).toHaveBeenCalledWith('nova-senha-1');
  });

  it('confirmação diferente', async () => {
    expect(
      await updatePasswordAction({}, form({ password: 'nova-senha-1', confirm: 'nova-senha-2' })),
    ).toEqual({ error: 'As senhas não conferem.' });
  });

  it('sem sessão', async () => {
    auth.getCurrentUser.mockResolvedValue(null);
    expect(
      await updatePasswordAction({}, form({ password: 'nova-senha-1', confirm: 'nova-senha-1' })),
    ).toEqual({ error: 'Sua sessão expirou. Peça um novo link de redefinição.' });
    expect(auth.updatePassword).not.toHaveBeenCalled();
  });
});

describe('signOutAction', () => {
  it('sai e vai para o catálogo', async () => {
    await expect(signOutAction()).rejects.toThrow('NEXT_REDIRECT:/');
    expect(auth.signOut).toHaveBeenCalled();
  });
});

import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const auth = vi.hoisted(() => ({ verifyRecoveryToken: vi.fn(), exchangeRecoveryCode: vi.fn() }));
vi.mock('@/lib/supabase/auth', () => auth);

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

function request(query: string) {
  return { nextUrl: new URL(`http://localhost:3000/auth/confirmar${query}`) } as NextRequest;
}

beforeEach(() => {
  auth.verifyRecoveryToken.mockResolvedValue({ ok: true });
  auth.exchangeRecoveryCode.mockResolvedValue({ ok: true });
});

describe('GET /auth/confirmar', () => {
  it('link do template próprio (token_hash) leva à nova senha', async () => {
    await expect(GET(request('?token_hash=abc&type=recovery'))).rejects.toThrow(
      'NEXT_REDIRECT:/nova-senha',
    );
    expect(auth.verifyRecoveryToken).toHaveBeenCalledWith('abc');
  });

  it('link do e-mail padrão do Supabase (code PKCE) leva à nova senha', async () => {
    await expect(GET(request('?code=xyz'))).rejects.toThrow('NEXT_REDIRECT:/nova-senha');
    expect(auth.exchangeRecoveryCode).toHaveBeenCalledWith('xyz');
  });

  it.each([
    ['token inválido', '?token_hash=abc&type=recovery', 'verifyRecoveryToken'],
    ['code inválido ou de outro navegador', '?code=xyz', 'exchangeRecoveryCode'],
  ] as const)('%s volta com aviso', async (_label, query, fn) => {
    auth[fn].mockResolvedValue({ ok: false, code: 'otp_expired' });
    await expect(GET(request(query))).rejects.toThrow(
      'NEXT_REDIRECT:/recuperar-senha?aviso=link-invalido',
    );
  });

  it('sem parâmetros volta com aviso', async () => {
    await expect(GET(request(''))).rejects.toThrow(
      'NEXT_REDIRECT:/recuperar-senha?aviso=link-invalido',
    );
  });
});

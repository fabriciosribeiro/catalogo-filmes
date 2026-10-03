import 'server-only';
import type { AuthError } from '@supabase/supabase-js';
import { redirect, unstable_rethrow } from 'next/navigation';
import { cache } from 'react';
import { createSupabaseServerClient } from './server';

export type CurrentUser = { id: string; email: string };
export type AuthResult = { ok: true } | { ok: false; code: string | undefined };

function toResult(error: AuthError | null): AuthResult {
  return error ? { ok: false, code: error.code } : { ok: true };
}

/**
 * Usuário da sessão, validado no servidor do Supabase (getUser, não getSession). Uma chamada por request.
 * Qualquer falha (inclusive env ausente) vira "deslogado": o header roda em toda página e não pode derrubar o site.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email ?? '' };
  } catch (error) {
    unstable_rethrow(error); // sinais internos do Next (ex.: render dinâmico) não são falhas
    console.error('Supabase indisponível; seguindo como visitante.', error);
    return null;
  }
});

/** Para páginas protegidas: sem sessão, manda para o login e volta para `returnTo` depois. */
export async function requireUser(returnTo: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?voltar=${encodeURIComponent(returnTo)}`);
  return user;
}

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/**
 * Executa uma chamada de auth. Erros do Supabase viram `{ ok: false, code }`; exceções de
 * infraestrutura (env inválido, rede) viram erro genérico no formulário e vão para o log.
 */
async function attempt(
  name: string,
  call: (supabase: SupabaseClient) => Promise<{ error: AuthError | null }>,
): Promise<AuthResult> {
  try {
    const { error } = await call(await createSupabaseServerClient());
    return toResult(error);
  } catch (error) {
    unstable_rethrow(error);
    console.error(`Supabase: ${name} falhou.`, error);
    return { ok: false, code: undefined };
  }
}

export function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  return attempt('signIn', (supabase) => supabase.auth.signInWithPassword({ email, password }));
}

export function signUpWithPassword(email: string, password: string): Promise<AuthResult> {
  return attempt('signUp', (supabase) => supabase.auth.signUp({ email, password }));
}

export function sendPasswordReset(email: string, redirectTo: string): Promise<AuthResult> {
  return attempt('resetPassword', (supabase) =>
    supabase.auth.resetPasswordForEmail(email, { redirectTo }),
  );
}

/** Link do template próprio (local/CI): `?token_hash=…&type=recovery`. */
export function verifyRecoveryToken(tokenHash: string): Promise<AuthResult> {
  return attempt('verifyOtp', (supabase) =>
    supabase.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash }),
  );
}

/**
 * Link do e-mail padrão do Supabase (produção, sem SMTP próprio): `?code=…` do fluxo PKCE.
 * Só funciona no navegador que pediu a recuperação, onde ficou o cookie com o code verifier.
 */
export function exchangeRecoveryCode(code: string): Promise<AuthResult> {
  return attempt('exchangeCode', (supabase) => supabase.auth.exchangeCodeForSession(code));
}

export function updatePassword(password: string): Promise<AuthResult> {
  return attempt('updatePassword', (supabase) => supabase.auth.updateUser({ password }));
}

export async function signOut(): Promise<void> {
  await attempt('signOut', (supabase) => supabase.auth.signOut());
}

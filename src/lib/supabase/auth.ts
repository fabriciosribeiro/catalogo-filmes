import 'server-only';
import type { AuthError } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { createSupabaseServerClient } from './server';

export type CurrentUser = { id: string; email: string };
export type AuthResult = { ok: true } | { ok: false; code: string | undefined };

function toResult(error: AuthError | null): AuthResult {
  return error ? { ok: false, code: error.code } : { ok: true };
}

/** Usuário da sessão, validado no servidor do Supabase (getUser, não getSession). Uma chamada por request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? '' };
});

/** Para páginas protegidas: sem sessão, manda para o login e volta para `returnTo` depois. */
export async function requireUser(returnTo: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?voltar=${encodeURIComponent(returnTo)}`);
  return user;
}

export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return toResult(error);
}

export async function signUpWithPassword(email: string, password: string): Promise<AuthResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({ email, password });
  return toResult(error);
}

export async function sendPasswordReset(email: string, redirectTo: string): Promise<AuthResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  return toResult(error);
}

export async function verifyRecoveryToken(tokenHash: string): Promise<AuthResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash });
  return toResult(error);
}

export async function updatePassword(password: string): Promise<AuthResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  return toResult(error);
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}

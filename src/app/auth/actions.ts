'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  emailSchema,
  field,
  newPasswordFormSchema,
  RESET_SENT_MESSAGE,
  signInSchema,
  signUpSchema,
  type FormState,
} from '@/lib/auth-schemas';
import { safeRedirectPath } from '@/lib/safe-redirect';
import * as auth from '@/lib/supabase/auth';
import { authErrorMessage, GENERIC_AUTH_ERROR } from '@/lib/supabase/errors';

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse({
    email: field(formData, 'email'),
    password: field(formData, 'password'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const result = await auth.signInWithPassword(parsed.data.email, parsed.data.password);
  if (!result.ok) return { error: authErrorMessage(result.code) };
  redirect(safeRedirectPath(formData.get('voltar')));
}

export async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse({
    email: field(formData, 'email'),
    password: field(formData, 'password'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const result = await auth.signUpWithPassword(parsed.data.email, parsed.data.password);
  if (!result.ok) return { error: authErrorMessage(result.code) };
  redirect(safeRedirectPath(formData.get('voltar')));
}

export async function requestPasswordResetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = emailSchema.safeParse(field(formData, 'email'));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Server Actions sempre chegam com Origin (o Next confere com o Host); o Supabase só aceita
  // destinos listados em "Redirect URLs".
  const origin = (await headers()).get('origin');
  if (!origin) return { error: GENERIC_AUTH_ERROR };

  // Mesma resposta em qualquer caso, para não revelar quais e-mails têm conta
  await auth.sendPasswordReset(parsed.data, `${origin}/auth/confirmar`);
  return { success: RESET_SENT_MESSAGE };
}

export async function updatePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = newPasswordFormSchema.safeParse({
    password: field(formData, 'password'),
    confirm: field(formData, 'confirm'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  if (!(await auth.getCurrentUser())) {
    return { error: 'Sua sessão expirou. Peça um novo link de redefinição.' };
  }
  const result = await auth.updatePassword(parsed.data.password);
  if (!result.ok) return { error: authErrorMessage(result.code) };
  redirect('/');
}

export async function signOutAction(): Promise<void> {
  await auth.signOut();
  redirect('/');
}

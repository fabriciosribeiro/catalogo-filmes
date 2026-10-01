'use client';

import { useActionState } from 'react';
import { signInAction, signUpAction } from '@/app/auth/actions';
import { MIN_PASSWORD_LENGTH, type FormState } from '@/lib/auth-schemas';
import { Field, FormMessage, SubmitButton } from './form-parts';

type Props = { mode: 'entrar' | 'criar'; voltar: string };

export function CredentialsForm({ mode, voltar }: Props) {
  const isSignUp = mode === 'criar';
  const [state, formAction] = useActionState<FormState, FormData>(
    isSignUp ? signUpAction : signInAction,
    {},
  );
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="voltar" value={voltar} />
      <Field label="E-mail" name="email" type="email" autoComplete="email" required />
      <Field
        label="Senha"
        name="password"
        type="password"
        autoComplete={isSignUp ? 'new-password' : 'current-password'}
        minLength={isSignUp ? MIN_PASSWORD_LENGTH : undefined}
        required
      />
      <FormMessage error={state.error} />
      <SubmitButton>{isSignUp ? 'Criar conta' : 'Entrar'}</SubmitButton>
    </form>
  );
}

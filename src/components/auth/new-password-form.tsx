'use client';

import { useActionState } from 'react';
import { updatePasswordAction } from '@/app/auth/actions';
import { MIN_PASSWORD_LENGTH, type FormState } from '@/lib/auth-schemas';
import { Field, FormMessage, SubmitButton } from './form-parts';

export function NewPasswordForm() {
  const [state, formAction] = useActionState<FormState, FormData>(updatePasswordAction, {});
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field
        label="Nova senha"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        required
      />
      <Field
        label="Confirmar senha"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
      />
      <FormMessage error={state.error} />
      <SubmitButton>Salvar nova senha</SubmitButton>
    </form>
  );
}

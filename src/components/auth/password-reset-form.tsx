'use client';

import { useActionState } from 'react';
import { requestPasswordResetAction } from '@/app/auth/actions';
import type { FormState } from '@/lib/auth-schemas';
import { Field, FormMessage, SubmitButton } from './form-parts';

export function PasswordResetForm() {
  const [state, formAction] = useActionState<FormState, FormData>(requestPasswordResetAction, {});
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="E-mail" name="email" type="email" autoComplete="email" required />
      <FormMessage error={state.error} success={state.success} />
      <SubmitButton>Enviar link</SubmitButton>
    </form>
  );
}

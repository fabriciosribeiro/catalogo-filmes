import { z } from 'zod';

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72; // limite do bcrypt usado pelo Supabase Auth

export const RESET_SENT_MESSAGE =
  'Se existir uma conta com este e-mail, enviamos um link para redefinir a senha.';

export type FormState = { error?: string; success?: string };

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Informe um e-mail válido.').max(254, 'Informe um e-mail válido.'));

export const newPasswordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
  .max(MAX_PASSWORD_LENGTH, `A senha pode ter no máximo ${MAX_PASSWORD_LENGTH} caracteres.`);

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe a senha.').max(MAX_PASSWORD_LENGTH),
});

export const signUpSchema = z.object({ email: emailSchema, password: newPasswordSchema });

export const newPasswordFormSchema = z
  .object({ password: newPasswordSchema, confirm: z.string() })
  .refine((data) => data.password === data.confirm, { message: 'As senhas não conferem.' });

/** Lê um campo de texto do FormData; ausente vira string vazia (para o zod dar a mensagem certa). */
export function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

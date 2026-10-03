import type { Metadata } from 'next';
import { PasswordResetForm } from '@/components/auth/password-reset-form';
import type { SearchParamsInput } from '@/lib/filters';

export const metadata: Metadata = { title: 'Recuperar senha' };

type Props = { searchParams: Promise<SearchParamsInput> };

export default async function PasswordResetPage({ searchParams }: Props) {
  const { aviso } = await searchParams;
  return (
    <div className="mx-auto w-full max-w-sm space-y-4 py-12">
      <h1 className="text-xl font-semibold">Recuperar senha</h1>
      {aviso === 'link-invalido' && (
        <p role="alert" className="text-sm text-red-400">
          O link expirou, é inválido ou foi aberto em outro navegador. Peça um novo abaixo.
        </p>
      )}
      <p className="text-sm text-muted">
        Informe o e-mail da conta e enviaremos um link para criar uma nova senha.
      </p>
      <PasswordResetForm />
    </div>
  );
}

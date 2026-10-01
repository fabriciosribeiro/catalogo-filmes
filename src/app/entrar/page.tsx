import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CredentialsForm } from '@/components/auth/credentials-form';
import type { SearchParamsInput } from '@/lib/filters';
import { safeRedirectPath } from '@/lib/safe-redirect';
import { getCurrentUser } from '@/lib/supabase/auth';

export const metadata: Metadata = { title: 'Entrar' };

type Props = { searchParams: Promise<SearchParamsInput> };

export default async function SignInPage({ searchParams }: Props) {
  const params = await searchParams;
  const voltar = safeRedirectPath(params.voltar);
  if (await getCurrentUser()) redirect(voltar);

  const mode = params.modo === 'criar' ? 'criar' : 'entrar';
  const tabHref = (tab: 'entrar' | 'criar') => {
    const query = new URLSearchParams();
    if (tab === 'criar') query.set('modo', 'criar');
    if (voltar !== '/') query.set('voltar', voltar);
    const qs = query.toString();
    return qs ? `/entrar?${qs}` : '/entrar';
  };
  const tabClasses = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-center ${active ? 'bg-surface-2 font-semibold' : 'text-muted hover:text-fg'}`;

  return (
    <div className="mx-auto w-full max-w-sm py-12">
      <h1 className="sr-only">{mode === 'criar' ? 'Criar conta' : 'Entrar'}</h1>
      <nav
        aria-label="Entrar ou criar conta"
        className="mb-6 grid grid-cols-2 rounded-full bg-surface p-1 text-sm"
      >
        <Link
          href={tabHref('entrar')}
          aria-current={mode === 'entrar' ? 'page' : undefined}
          className={tabClasses(mode === 'entrar')}
        >
          Entrar
        </Link>
        <Link
          href={tabHref('criar')}
          aria-current={mode === 'criar' ? 'page' : undefined}
          className={tabClasses(mode === 'criar')}
        >
          Criar conta
        </Link>
      </nav>
      <CredentialsForm key={mode} mode={mode} voltar={voltar} />
      {mode === 'entrar' && (
        <p className="mt-4 text-center text-sm">
          <Link href="/recuperar-senha" className="text-accent underline-offset-4 hover:underline">
            Esqueci minha senha
          </Link>
        </p>
      )}
    </div>
  );
}

import type { Metadata } from 'next';
import { ProvidersForm } from '@/components/my-providers/providers-form';
import { requireUser } from '@/lib/supabase/auth';
import { getSavedProviders } from '@/lib/supabase/user-providers';
import { getProviders } from '@/lib/tmdb/movies';

export const metadata: Metadata = { title: 'Minhas plataformas' };

export default async function MyProvidersPage() {
  const user = await requireUser('/minhas-plataformas');
  const [providers, saved] = await Promise.all([getProviders(), getSavedProviders(user.id)]);
  return (
    <div className="mx-auto w-full max-w-xl space-y-4 py-8">
      <h1 className="text-xl font-semibold">Minhas plataformas</h1>
      <p className="text-sm text-muted">
        Marque os serviços que você assina. O catálogo vai abrir já filtrado por eles, e você ainda
        pode ver todos com um clique.
      </p>
      <ProvidersForm providers={providers} saved={saved} />
    </div>
  );
}

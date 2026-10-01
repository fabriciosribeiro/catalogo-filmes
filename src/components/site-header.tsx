import Link from 'next/link';
import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/supabase/auth';
import { SearchBox } from './search-box';
import { UserMenu } from './user-menu';

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-20 border-b border-surface-2 bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="shrink-0 text-lg font-extrabold tracking-tight">
          🎬 <span className="text-accent">Em</span>Cartaz
        </Link>
        <Suspense fallback={<div className="h-9 flex-1 rounded-full bg-surface" />}>
          <SearchBox />
        </Suspense>
        {user ? (
          <UserMenu email={user.email} />
        ) : (
          <Link href="/entrar" className="shrink-0 text-sm font-medium text-accent hover:underline">
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}

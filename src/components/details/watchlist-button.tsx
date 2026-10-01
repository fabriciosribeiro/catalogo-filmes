'use client';

import Link from 'next/link';
import { useOptimistic, useState, useTransition } from 'react';
import { toggleWatchlist } from '@/app/minha-lista/actions';

type Props = { tmdbId: number; initialSaved: boolean; signedIn: boolean };

const baseClasses =
  'inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait';

export function WatchlistButton({ tmdbId, initialSaved, signedIn }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(saved);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <Link
        href={`/entrar?voltar=${encodeURIComponent(`/filme/${tmdbId}`)}`}
        className={`${baseClasses} bg-surface-2 hover:brightness-110`}
      >
        + Salvar na lista
      </Link>
    );
  }

  const toggle = () => {
    const next = !saved;
    setError(null);
    startTransition(async () => {
      setOptimisticSaved(next);
      const result = await toggleWatchlist(tmdbId, next);
      startTransition(() => {
        if (result.ok) setSaved(result.saved);
        else setError(result.message);
      });
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        className={`${baseClasses} ${optimisticSaved ? 'bg-accent text-accent-fg' : 'bg-surface-2 hover:brightness-110'}`}
      >
        {optimisticSaved ? '✓ Na minha lista' : '+ Salvar na lista'}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

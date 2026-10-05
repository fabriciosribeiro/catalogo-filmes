'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { signOutAction } from '@/app/auth/actions';

const itemClasses = 'block w-full rounded px-3 py-2 text-left text-sm hover:bg-surface-2';

/**
 * Menu sobre <details>: abre e fecha sem JavaScript. O JS só complementa o que o <details>
 * não faz sozinho — fechar ao clicar fora, com Esc, ao sair com Tab e ao navegar
 * (o header fica no layout, então não é remontado na troca de página).
 */
export function UserMenu({ email }: { email: string }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  useEffect(() => {
    const details = ref.current;
    if (!details) return;

    const onPointerDown = (event: PointerEvent) => {
      if (details.open && !details.contains(event.target as Node)) details.open = false;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !details.open) return;
      details.open = false;
      details.querySelector('summary')?.focus();
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const close = () => {
    if (ref.current) ref.current.open = false;
  };

  return (
    <details
      ref={ref}
      className="relative shrink-0"
      onBlur={(event) => {
        // Só foco de teclado indo para fora; cliques do mouse ficam com o pointerdown.
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) close();
      }}
    >
      <summary className="cursor-pointer list-none rounded-full bg-surface-2 px-3 py-1.5 text-sm font-medium hover:brightness-110">
        Minha conta
      </summary>
      <div className="absolute right-0 z-30 mt-2 w-60 rounded-md bg-surface p-1 shadow-xl ring-1 ring-surface-2">
        <p className="truncate px-3 py-2 text-xs text-muted">{email}</p>
        {/* Fecha também ao clicar no link da página atual, quando o pathname não muda. */}
        <Link href="/minha-lista" className={itemClasses} onClick={close}>
          Minha lista
        </Link>
        <Link href="/minhas-plataformas" className={itemClasses} onClick={close}>
          Minhas plataformas
        </Link>
        <form action={signOutAction}>
          <button type="submit" className={itemClasses}>
            Sair
          </button>
        </form>
      </div>
    </details>
  );
}

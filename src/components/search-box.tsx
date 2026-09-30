'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export const SEARCH_DEBOUNCE_MS = 300;

export function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const urlQuery = useSearchParams().get('q') ?? '';
  const [value, setValue] = useState(urlQuery);
  // último termo que ESTE componente enviou para a URL
  const lastSubmitted = useRef(urlQuery);

  // A URL mudou por fora (Limpar filtros, voltar no histórico): sincroniza o campo.
  useEffect(() => {
    if (urlQuery !== lastSubmitted.current) {
      lastSubmitted.current = urlQuery;
      setValue(urlQuery);
    }
  }, [urlQuery]);

  const submit = useCallback(
    (raw: string) => {
      const term = raw.trim();
      if (term === lastSubmitted.current) return;
      if (pathname !== '/' && !term) return;
      lastSubmitted.current = term;
      const target = term ? `/?q=${encodeURIComponent(term)}` : '/';
      if (pathname === '/') router.replace(target, { scroll: false });
      else router.push(target);
    },
    [pathname, router],
  );

  useEffect(() => {
    const timer = setTimeout(() => submit(value), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, submit]);

  return (
    <form
      role="search"
      className="flex-1"
      onSubmit={(event) => {
        event.preventDefault();
        submit(value);
      }}
    >
      <label htmlFor="busca" className="sr-only">
        Buscar filme
      </label>
      <input
        id="busca"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Buscar filme…"
        autoComplete="off"
        className="w-full rounded-full bg-surface px-4 py-2 text-sm placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent"
      />
    </form>
  );
}

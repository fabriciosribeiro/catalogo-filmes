'use client';

import { useState } from 'react';
import { DEFAULT_FILTERS, hasActiveFilters, type Filters } from '@/lib/filters';
import type { Genre, Provider } from '@/lib/tmdb/types';
import { GenreChips } from './genre-chips';
import { ProviderPicker } from './provider-picker';
import { SortSelect } from './sort-select';
import { useFilterNavigation } from './use-filter-navigation';
import { YearRange } from './year-range';

type Props = {
  filters: Filters;
  providers: Provider[];
  genres: Genre[];
  savedProviders?: number[];
};

/**
 * O estado local ("draft") acumula cliques rápidos enquanto o servidor ainda não respondeu.
 * A página remonta este componente com key={serializeFilters(filters)} quando a URL muda.
 */
export function FilterBar({ filters, providers, genres, savedProviders = [] }: Props) {
  const [draft, setDraft] = useState(filters);
  const { navigate, isPending } = useFilterNavigation();
  const hasSaved = savedProviders.length > 0;
  const showingMine =
    hasSaved &&
    draft.providers.length === savedProviders.length &&
    savedProviders.every((id) => draft.providers.includes(id));

  // Com plataformas salvas, "nenhuma marcada" precisa ir explícito na URL (p=todas);
  // sem isso, o catálogo reaplicaria as salvas.
  const apply = (next: Filters) => {
    setDraft(next);
    navigate(next, { explicitAllProviders: hasSaved });
  };
  const update = (patch: Partial<Filters>) => apply({ ...draft, ...patch, query: undefined });

  return (
    <section aria-label="Filtros" aria-busy={isPending} className="space-y-3 py-4">
      <ProviderPicker
        providers={providers}
        selected={draft.providers}
        onChange={(ids) => update({ providers: ids })}
      />
      <GenreChips
        genres={genres}
        selected={draft.genres}
        onChange={(ids) => update({ genres: ids })}
      />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {hasSaved && (
          <button
            type="button"
            aria-pressed={showingMine}
            onClick={() => update({ providers: savedProviders })}
            className={[
              'rounded-full px-3 py-1 text-sm font-medium ring-1 transition',
              showingMine
                ? 'bg-accent text-accent-fg ring-accent'
                : 'ring-surface-2 hover:bg-surface-2',
            ].join(' ')}
          >
            Minhas plataformas
          </button>
        )}
        <YearRange
          yearFrom={draft.yearFrom}
          yearTo={draft.yearTo}
          onChange={(range) => update(range)}
        />
        <SortSelect value={draft.sort} onChange={(sort) => update({ sort })} />
        {hasActiveFilters(draft) && (
          <button
            type="button"
            onClick={() => apply(DEFAULT_FILTERS)}
            className="text-sm text-accent underline-offset-4 hover:underline"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </section>
  );
}

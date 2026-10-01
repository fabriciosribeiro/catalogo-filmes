import {
  MAX_IDS_PER_FILTER,
  parseFilters,
  serializeFilters,
  type SearchParamsInput,
} from './filters';

/**
 * Para quem tem plataformas salvas, o catálogo sem `p` na URL abre já filtrado por elas.
 * Devolve o destino, ou null quando nada muda: busca, `p` explícito (inclusive `p=todas`) ou nada salvo.
 */
export function resolveProviderRedirect(
  searchParams: SearchParamsInput,
  saved: number[],
): string | null {
  if (!saved.length || searchParams.p !== undefined) return null;
  const filters = parseFilters(searchParams);
  if (filters.query) return null;
  return `/?${serializeFilters({ ...filters, providers: saved.slice(0, MAX_IDS_PER_FILTER) })}`;
}

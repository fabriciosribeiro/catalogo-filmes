import { Suspense } from 'react';
import { CatalogResults } from '@/components/catalog-results';
import { FeaturedSection, FeaturedSkeleton } from '@/components/featured/featured-section';
import { FilterBar } from '@/components/filters/filter-bar';
import { MovieGridSkeleton } from '@/components/movie-grid-skeleton';
import { parseFilters, serializeFilters, type SearchParamsInput } from '@/lib/filters';
import { getGenres, getProviders } from '@/lib/tmdb/movies';

type Props = { searchParams: Promise<SearchParamsInput> };

export default async function CatalogPage({ searchParams }: Props) {
  const filters = parseFilters(await searchParams);
  const [providers, genres] = await Promise.all([getProviders(), getGenres()]);
  const key = serializeFilters(filters);

  return (
    <>
      {filters.query ? (
        <h1 className="pt-6 pb-4 text-xl font-semibold">Resultados para “{filters.query}”</h1>
      ) : (
        <>
          <h1 className="sr-only">Filmes em streaming por assinatura no Brasil</h1>
          {/* Fora da key dos filtros: trocar filtro não recarrega nem reinicia o destaque */}
          <Suspense fallback={<FeaturedSkeleton />}>
            <FeaturedSection />
          </Suspense>
          <FilterBar key={key} filters={filters} providers={providers} genres={genres} />
        </>
      )}
      {/* key: mudar a URL mostra o skeleton e reinicia a rolagem infinita */}
      <Suspense key={key} fallback={<MovieGridSkeleton />}>
        <CatalogResults filters={filters} genres={genres} />
      </Suspense>
    </>
  );
}

// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_FILTERS } from '@/lib/filters';
import { discoverStreaming, searchStreaming } from '@/lib/tmdb/movies';
import { genres, makeMovie } from '../../tests/fixtures/domain';
import { installFakeIntersectionObserver } from '../../tests/helpers/intersection-observer';
import { CatalogResults } from './catalog-results';

vi.mock('@/lib/tmdb/movies', () => ({ discoverStreaming: vi.fn(), searchStreaming: vi.fn() }));
vi.mock('@/app/actions', () => ({ loadMore: vi.fn() }));

const movies = (n: number) =>
  Array.from({ length: n }, (_, i) => makeMovie({ id: i + 1, title: `Filme ${i + 1}` }));

describe('CatalogResults', () => {
  beforeEach(() => {
    installFakeIntersectionObserver();
  });

  it('modo catálogo mostra a primeira página do discover', async () => {
    vi.mocked(discoverStreaming).mockResolvedValue({ movies: movies(3), page: 1, hasMore: true });
    render(await CatalogResults({ filters: { ...DEFAULT_FILTERS, providers: [8] }, genres }));

    expect(discoverStreaming).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, providers: [8] }, 1);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('catálogo vazio sugere limpar filtros', async () => {
    vi.mocked(discoverStreaming).mockResolvedValue({ movies: [], page: 1, hasMore: false });
    render(await CatalogResults({ filters: { ...DEFAULT_FILTERS, genres: [27] }, genres }));

    expect(screen.getByText('Nenhum filme encontrado com esses filtros')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Limpar filtros' })).toHaveAttribute('href', '/');
  });

  it('modo busca usa searchStreaming e não o discover', async () => {
    vi.mocked(searchStreaming).mockResolvedValue(movies(8));
    render(await CatalogResults({ filters: { ...DEFAULT_FILTERS, query: 'duna' }, genres }));

    expect(searchStreaming).toHaveBeenCalledWith('duna');
    expect(discoverStreaming).not.toHaveBeenCalled();
    expect(screen.getAllByRole('listitem')).toHaveLength(8);
    expect(screen.queryByText(/termo mais específico/)).not.toBeInTheDocument();
  });

  it('busca com poucos resultados sugere refinar', async () => {
    vi.mocked(searchStreaming).mockResolvedValue(movies(2));
    render(await CatalogResults({ filters: { ...DEFAULT_FILTERS, query: 'duna' }, genres }));
    expect(screen.getByText(/termo mais específico/)).toBeInTheDocument();
  });

  it('busca sem resultado em streaming cita o termo', async () => {
    vi.mocked(searchStreaming).mockResolvedValue([]);
    render(await CatalogResults({ filters: { ...DEFAULT_FILTERS, query: 'xyz' }, genres }));

    expect(
      screen.getByText('Nenhum resultado disponível em streaming para “xyz”'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver catálogo' })).toHaveAttribute('href', '/');
  });
});

// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadMore } from '@/app/actions';
import type { MoviePage } from '@/lib/tmdb/types';
import { genres, makeMovie } from '../../tests/fixtures/domain';
import { installFakeIntersectionObserver } from '../../tests/helpers/intersection-observer';
import { InfiniteMovieList } from './infinite-movie-list';

vi.mock('@/app/actions', () => ({ loadMore: vi.fn() }));

const page = (n: number, ids: number[], hasMore: boolean): MoviePage => ({
  page: n,
  hasMore,
  movies: ids.map((id) => makeMovie({ id, title: `Filme ${id}` })),
});

describe('InfiniteMovieList', () => {
  let io: ReturnType<typeof installFakeIntersectionObserver>;
  beforeEach(() => {
    io = installFakeIntersectionObserver();
  });

  it('renderiza a primeira página e carrega a próxima ao chegar no fim', async () => {
    vi.mocked(loadMore).mockResolvedValue(page(2, [3, 4], false));
    render(
      <InfiniteMovieList initialPage={page(1, [1, 2], true)} queryString="p=8" genres={genres} />,
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(2);

    await act(async () => io.trigger());

    expect(loadMore).toHaveBeenCalledWith('p=8', 2);
    expect(screen.getByText('Filme 4')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });

  it('não duplica filmes repetidos entre páginas', async () => {
    vi.mocked(loadMore).mockResolvedValue(page(2, [2, 3], false));
    render(
      <InfiniteMovieList initialPage={page(1, [1, 2], true)} queryString="" genres={genres} />,
    );

    await act(async () => io.trigger());

    expect(screen.getAllByText('Filme 2')).toHaveLength(1);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('não observa nada quando não há mais páginas', () => {
    render(<InfiniteMovieList initialPage={page(1, [1], false)} queryString="" genres={genres} />);
    expect(io.instances).toHaveLength(0);
  });

  it('dispara uma só requisição mesmo com gatilhos repetidos', async () => {
    let resolve!: (value: MoviePage) => void;
    vi.mocked(loadMore).mockReturnValue(new Promise((r) => (resolve = r)));
    render(<InfiniteMovieList initialPage={page(1, [1], true)} queryString="" genres={genres} />);

    act(() => {
      io.instances[0].trigger();
      io.instances[0].trigger();
    });
    await act(async () => resolve(page(2, [2], false)));

    expect(loadMore).toHaveBeenCalledOnce();
  });

  it('em erro mantém a grade e permite tentar de novo', async () => {
    vi.mocked(loadMore)
      .mockRejectedValueOnce(new Error('falhou'))
      .mockResolvedValueOnce(page(2, [2], false));
    render(<InfiniteMovieList initialPage={page(1, [1], true)} queryString="" genres={genres} />);

    await act(async () => io.trigger());
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar mais');
    expect(screen.getByText('Filme 1')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'tentar de novo' }));
    expect(screen.getByText('Filme 2')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

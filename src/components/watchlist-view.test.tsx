// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makeMovieDetails } from '../../tests/fixtures/domain';
import { WatchlistView } from './watchlist-view';

describe('WatchlistView', () => {
  it('lista os filmes e marca os que saíram do streaming', () => {
    render(
      <WatchlistView
        movies={[
          makeMovieDetails(),
          makeMovieDetails({ id: 7, title: 'Clássico', streamingProviders: [] }),
        ]}
      />,
    );
    expect(screen.getByRole('heading', { name: /Minha lista/ })).toHaveTextContent('(2)');
    const classic = screen.getByRole('link', { name: /Clássico/ });
    expect(classic).toHaveTextContent('Fora do streaming');
    expect(screen.getByRole('link', { name: /Duna/ })).not.toHaveTextContent('Fora do streaming');
  });

  it('lista vazia convida a explorar o catálogo', () => {
    render(<WatchlistView movies={[]} />);
    expect(screen.getByText('Sua lista está vazia')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explorar o catálogo' })).toHaveAttribute('href', '/');
  });
});

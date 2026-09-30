// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makeMovie } from '../../tests/fixtures/domain';
import { MovieCard } from './movie-card';

describe('MovieCard', () => {
  it('é um link para os detalhes com pôster, nota e metadados', () => {
    render(<MovieCard movie={makeMovie({ id: 42, title: 'Duna' })} genreLabel="Drama" />);

    expect(screen.getByRole('link')).toHaveAttribute('href', '/filme/42');
    expect(screen.getByRole('img', { name: 'Pôster de Duna' })).toBeInTheDocument();
    expect(screen.getByText('★ 7,1')).toBeInTheDocument();
    expect(screen.getByText('2023 · Drama')).toBeInTheDocument();
  });

  it('mostra um placeholder quando não há pôster', () => {
    render(<MovieCard movie={makeMovie({ title: 'Sem Capa', posterPath: null })} />);
    expect(screen.getByRole('img', { name: 'Sem pôster: Sem Capa' })).toBeInTheDocument();
  });

  it('esconde o selo de nota quando não há nota', () => {
    render(<MovieCard movie={makeMovie({ voteAverage: 0 })} />);
    expect(screen.queryByText(/★/)).not.toBeInTheDocument();
  });

  it('omite metadados ausentes', () => {
    render(<MovieCard movie={makeMovie({ releaseYear: null })} />);
    expect(screen.queryByText('·', { exact: false })).not.toBeInTheDocument();
  });
});

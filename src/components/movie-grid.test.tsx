// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { genres, makeMovie } from '../../tests/fixtures/domain';
import { MovieGrid } from './movie-grid';

describe('MovieGrid', () => {
  it('renderiza um item por filme com o nome do primeiro gênero conhecido', () => {
    render(
      <MovieGrid
        movies={[
          makeMovie({ id: 1, title: 'A', genreIds: [999, 27] }),
          makeMovie({ id: 2, title: 'B', genreIds: [] }),
        ]}
        genres={genres}
      />,
    );
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('2023 · Terror')).toBeInTheDocument();
    expect(within(items[1]).getByText('2023')).toBeInTheDocument();
  });
});

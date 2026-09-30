// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeFeaturedMovie } from '../../../tests/fixtures/domain';
import { FeaturedCarousel } from './featured-carousel';

const movies = [
  makeFeaturedMovie(),
  makeFeaturedMovie({ id: 2, title: 'Oppenheimer', logo: null, trailerKey: null }),
  makeFeaturedMovie({ id: 3, title: 'Barbie' }),
];

/** O jsdom não tem AnimationEvent, então o React escuta a versão com prefixo. */
function finishProgress() {
  const bar = screen.getByTestId('featured-progress');
  fireEvent(bar, new Event('webkitAnimationEnd', { bubbles: true }));
  fireEvent(bar, new Event('animationend', { bubbles: true }));
}

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: reduce, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
}

describe('FeaturedCarousel', () => {
  beforeEach(() => mockReducedMotion(false));

  it('mostra o primeiro destaque com logo, serviços e ações', () => {
    render(<FeaturedCarousel movies={movies} />);
    expect(screen.getByRole('heading', { name: 'Duna' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Duna' })).toHaveAttribute(
      'src',
      expect.stringMatching(/w500(\/|%2F)duna-logo-pt\.png/),
    );
    expect(screen.getByRole('img', { name: 'Max' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ver trailer/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mais informações' })).toHaveAttribute(
      'href',
      '/filme/438631',
    );
    expect(screen.getByRole('tab', { name: 'Duna' })).toHaveAttribute('aria-selected', 'true');
  });

  it('troca de destaque ao clicar numa aba e usa o título quando não há logo', async () => {
    render(<FeaturedCarousel movies={movies} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Oppenheimer' }));
    expect(screen.getByRole('heading', { name: 'Oppenheimer' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Ver trailer/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mais informações' })).toHaveAttribute(
      'href',
      '/filme/2',
    );
  });

  it('avança quando a barra de progresso termina e volta ao início depois do último', () => {
    render(<FeaturedCarousel movies={movies} />);
    for (const title of ['Oppenheimer', 'Barbie', 'Duna']) {
      finishProgress();
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }
  });

  it('navega pelas abas com as setas', async () => {
    render(<FeaturedCarousel movies={movies} />);
    screen.getByRole('tab', { name: 'Duna' }).focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Barbie' })).toHaveFocus();
    expect(screen.getByRole('heading', { name: 'Barbie' })).toBeInTheDocument();
  });

  it('pausa e retoma a rotação', async () => {
    render(<FeaturedCarousel movies={movies} />);
    await userEvent.click(screen.getByRole('button', { name: 'Pausar destaques' }));
    expect(screen.getByTestId('featured-progress')).toHaveStyle({ animationPlayState: 'paused' });
    await userEvent.click(screen.getByRole('button', { name: 'Retomar destaques' }));
    await userEvent.unhover(screen.getByRole('region', { name: 'Em alta nesta semana' }));
    expect(screen.getByTestId('featured-progress')).toHaveStyle({ animationPlayState: 'running' });
  });

  it('não gira sozinho quando o sistema pede menos movimento', () => {
    mockReducedMotion(true);
    render(<FeaturedCarousel movies={movies} />);
    expect(screen.queryByRole('button', { name: 'Pausar destaques' })).not.toBeInTheDocument();
    expect(screen.getByTestId('featured-progress').style.animation).toBe('');
  });

  it('esconde as abas quando há um só destaque', () => {
    render(<FeaturedCarousel movies={[movies[0]]} />);
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });
});

// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeMovieDetails } from '../../../tests/fixtures/domain';
import { CastList } from './cast-list';
import { MovieHero } from './movie-hero';
import { TrailerModal } from './trailer-modal';
import { WatchProviders } from './watch-providers';

describe('WatchProviders', () => {
  it('lista as plataformas com link para o TMDB/JustWatch', () => {
    render(
      <WatchProviders
        providers={[{ id: 1899, name: 'Max', logoPath: '/max.jpg' }]}
        link="https://tmdb/watch"
      />,
    );
    expect(screen.getByRole('heading', { name: 'Onde assistir' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Max' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver opções no TMDB/ })).toHaveAttribute(
      'href',
      'https://tmdb/watch',
    );
  });

  it('avisa quando o filme não está em streaming', () => {
    render(<WatchProviders providers={[]} link={null} />);
    expect(
      screen.getByText('Não está disponível em streaming por assinatura no momento.'),
    ).toBeInTheDocument();
  });
});

describe('CastList', () => {
  it('mostra nome, personagem e iniciais quando não há foto', () => {
    render(<CastList cast={makeMovieDetails().cast} />);
    expect(screen.getByRole('img', { name: 'Timothée Chalamet' })).toBeInTheDocument();
    expect(screen.getByText('Chani')).toBeInTheDocument();
    expect(screen.getByText('Z')).toBeInTheDocument();
  });
});

describe('TrailerModal', () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    });
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    });
  });

  it('abre o player só quando solicitado e fecha', async () => {
    render(<TrailerModal trailerKey="abc123" title="Duna" />);
    expect(document.querySelector('iframe')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: '▶ Ver trailer' }));
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    expect(document.querySelector('iframe')).toHaveAttribute(
      'src',
      'https://www.youtube-nocookie.com/embed/abc123?autoplay=1',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Fechar trailer' }));
    expect(document.querySelector('iframe')).toBeNull();
  });
});

describe('MovieHero', () => {
  it('mostra título, nota, metadados, onde assistir e botão de trailer', () => {
    render(<MovieHero movie={makeMovieDetails()} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Duna' })).toBeInTheDocument();
    expect(screen.getByText('★ 7,8')).toBeInTheDocument();
    expect(screen.getByText('2021 · 2h 35min · Ficção científica, Aventura')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Max' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '▶ Ver trailer' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Voltar ao catálogo' })).toHaveAttribute('href', '/');
  });

  it('esconde o botão de trailer quando não há trailer', () => {
    render(<MovieHero movie={makeMovieDetails({ trailerKey: null })} />);
    expect(screen.queryByRole('button', { name: /trailer/ })).not.toBeInTheDocument();
  });
});

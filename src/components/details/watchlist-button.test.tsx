// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ToggleResult } from '@/app/minha-lista/actions';
import { WatchlistButton } from './watchlist-button';

const actions = vi.hoisted(() => ({ toggleWatchlist: vi.fn() }));
vi.mock('@/app/minha-lista/actions', () => actions);

function deferred() {
  let resolve!: (value: ToggleResult) => void;
  const promise = new Promise<ToggleResult>((r) => (resolve = r));
  return { promise, resolve };
}

describe('WatchlistButton', () => {
  it('deslogado vira link para o login voltando ao filme', () => {
    render(<WatchlistButton tmdbId={42} initialSaved={false} signedIn={false} />);
    expect(screen.getByRole('link', { name: /Salvar na lista/ })).toHaveAttribute(
      'href',
      '/entrar?voltar=%2Ffilme%2F42',
    );
  });

  it('salva de forma otimista e confirma', async () => {
    const pending = deferred();
    actions.toggleWatchlist.mockReturnValue(pending.promise);
    render(<WatchlistButton tmdbId={42} initialSaved={false} signedIn />);

    await userEvent.click(screen.getByRole('button', { name: /Salvar na lista/ }));
    expect(screen.getByRole('button', { name: /Na minha lista/ })).toBeDisabled();
    expect(actions.toggleWatchlist).toHaveBeenCalledWith(42, true);

    pending.resolve({ ok: true, saved: true });
    expect(await screen.findByRole('button', { name: /Na minha lista/ })).toBeEnabled();
  });

  it('desfaz e mostra o erro quando a ação falha', async () => {
    actions.toggleWatchlist.mockResolvedValue({
      ok: false,
      message: 'Sua lista chegou ao limite de 100 filmes.',
    });
    render(<WatchlistButton tmdbId={42} initialSaved={false} signedIn />);

    await userEvent.click(screen.getByRole('button', { name: /Salvar na lista/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Sua lista chegou ao limite de 100 filmes.',
    );
    expect(screen.getByRole('button', { name: /Salvar na lista/ })).toBeEnabled();
  });

  it('falha de rede desfaz e mostra o erro sem derrubar a página', async () => {
    actions.toggleWatchlist.mockRejectedValue(new Error('Failed to fetch'));
    render(<WatchlistButton tmdbId={42} initialSaved={false} signedIn />);

    await userEvent.click(screen.getByRole('button', { name: /Salvar na lista/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível atualizar sua lista. Tente de novo.',
    );
    expect(screen.getByRole('button', { name: /Salvar na lista/ })).toBeEnabled();
  });

  it('remove um filme já salvo', async () => {
    actions.toggleWatchlist.mockResolvedValue({ ok: true, saved: false });
    render(<WatchlistButton tmdbId={42} initialSaved signedIn />);
    await userEvent.click(screen.getByRole('button', { name: /Na minha lista/ }));
    expect(actions.toggleWatchlist).toHaveBeenCalledWith(42, false);
    expect(await screen.findByRole('button', { name: /Salvar na lista/ })).toBeEnabled();
  });
});

// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_FILTERS } from '@/lib/filters';
import { genres, providers } from '../../../tests/fixtures/domain';
import { FilterBar } from './filter-bar';

const nav = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => nav }));

function renderBar(filters = DEFAULT_FILTERS, savedProviders: number[] = []) {
  return render(
    <FilterBar
      filters={filters}
      providers={providers}
      genres={genres}
      savedProviders={savedProviders}
    />,
  );
}

describe('FilterBar', () => {
  it('seleciona uma plataforma e atualiza a URL', async () => {
    renderBar();
    await userEvent.click(screen.getByRole('button', { name: 'Netflix' }));

    expect(nav.replace).toHaveBeenLastCalledWith('/?p=8', { scroll: false });
    expect(screen.getByRole('button', { name: 'Netflix' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Amazon Prime Video' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('cliques rápidos acumulam antes de o servidor responder', async () => {
    renderBar();
    await userEvent.click(screen.getByRole('button', { name: 'Netflix' }));
    await userEvent.click(screen.getByRole('button', { name: 'Amazon Prime Video' }));
    expect(nav.replace).toHaveBeenLastCalledWith('/?p=8,119', { scroll: false });
  });

  it('desmarca uma plataforma já selecionada', async () => {
    renderBar({ ...DEFAULT_FILTERS, providers: [8, 119] });
    await userEvent.click(screen.getByRole('button', { name: 'Netflix' }));
    expect(nav.replace).toHaveBeenLastCalledWith('/?p=119', { scroll: false });
  });

  it('plataforma sem logo mostra o nome', () => {
    renderBar();
    expect(screen.getByRole('button', { name: 'Max' })).toHaveTextContent('Max');
  });

  it('filtra por gênero mantendo as plataformas', async () => {
    renderBar({ ...DEFAULT_FILTERS, providers: [8] });
    await userEvent.click(screen.getByRole('button', { name: 'Terror' }));
    expect(nav.replace).toHaveBeenLastCalledWith('/?p=8&g=27', { scroll: false });
  });

  it('muda a ordenação', async () => {
    renderBar();
    await userEvent.selectOptions(screen.getByLabelText('Ordenar por'), 'nota');
    expect(nav.replace).toHaveBeenLastCalledWith('/?ordem=nota', { scroll: false });
  });

  it('define o intervalo de anos', async () => {
    renderBar();
    await userEvent.selectOptions(screen.getByLabelText('Ano inicial'), '2020');
    expect(nav.replace).toHaveBeenLastCalledWith('/?ano=2020-', { scroll: false });
  });

  it('mostra no select um ano da URL fora da faixa listada', () => {
    renderBar({ ...DEFAULT_FILTERS, yearFrom: 1905 });
    expect(screen.getByLabelText('Ano inicial')).toHaveValue('1905');
  });

  it('"Limpar filtros" só aparece com filtros ativos e volta para /', async () => {
    const { unmount } = renderBar();
    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument();
    unmount();

    renderBar({ ...DEFAULT_FILTERS, genres: [27], sort: 'nota' });
    await userEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(nav.replace).toHaveBeenLastCalledWith('/', { scroll: false });
  });
});

describe('FilterBar com plataformas salvas', () => {
  it('desmarcar a última plataforma escreve p=todas', async () => {
    renderBar({ ...DEFAULT_FILTERS, providers: [8] }, [8]);
    await userEvent.click(screen.getByRole('button', { name: 'Netflix' }));
    expect(nav.replace).toHaveBeenLastCalledWith('/?p=todas', { scroll: false });
  });

  it('"Limpar filtros" também mostra todas as plataformas', async () => {
    renderBar({ ...DEFAULT_FILTERS, providers: [8], genres: [27] }, [8]);
    await userEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(nav.replace).toHaveBeenLastCalledWith('/?p=todas', { scroll: false });
  });

  it('o chip "Minhas plataformas" reaplica as salvas', async () => {
    renderBar(DEFAULT_FILTERS, [8, 119]);
    const chip = screen.getByRole('button', { name: 'Minhas plataformas' });
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(chip);
    expect(nav.replace).toHaveBeenLastCalledWith('/?p=8,119', { scroll: false });
    expect(chip).toHaveAttribute('aria-pressed', 'true');
  });

  it('sem plataformas salvas: sem chip e desmarcar volta para "/"', async () => {
    renderBar({ ...DEFAULT_FILTERS, providers: [8] });
    expect(screen.queryByRole('button', { name: 'Minhas plataformas' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Netflix' }));
    expect(nav.replace).toHaveBeenLastCalledWith('/', { scroll: false });
  });
});

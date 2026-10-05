// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UserMenu } from './user-menu';

const nav = vi.hoisted(() => ({ pathname: '/' }));

vi.mock('next/navigation', () => ({ usePathname: () => nav.pathname }));
vi.mock('@/app/auth/actions', () => ({ signOutAction: vi.fn() }));

function setup() {
  const view = render(
    <>
      <UserMenu email="ana@exemplo.com" />
      <button type="button">Fora</button>
    </>,
  );
  const details = view.container.querySelector('details')!;
  const open = async () => {
    await userEvent.click(screen.getByText('Minha conta'));
    expect(details).toHaveAttribute('open');
  };
  return { ...view, details, open };
}

describe('UserMenu', () => {
  it('fecha ao clicar fora do menu', async () => {
    const { details, open } = setup();
    await open();
    await userEvent.click(screen.getByRole('button', { name: 'Fora' }));
    expect(details).not.toHaveAttribute('open');
  });

  it('continua aberto ao clicar dentro do painel', async () => {
    const { details, open } = setup();
    await open();
    await userEvent.click(screen.getByText('ana@exemplo.com'));
    expect(details).toHaveAttribute('open');
  });

  it('fecha com Esc e devolve o foco para "Minha conta"', async () => {
    const { details, open } = setup();
    await open();
    await userEvent.keyboard('{Escape}');
    expect(details).not.toHaveAttribute('open');
    expect(screen.getByText('Minha conta')).toHaveFocus();
  });

  it('fecha quando o foco de teclado sai do menu', async () => {
    const { details, open } = setup();
    await open();
    fireEvent.blur(screen.getByText('Minha conta'), {
      relatedTarget: screen.getByRole('button', { name: 'Fora' }),
    });
    expect(details).not.toHaveAttribute('open');
  });

  it('fecha ao escolher um item e ao trocar de página', async () => {
    const { details, open, rerender } = setup();
    await open();
    const link = screen.getByRole('link', { name: 'Minha lista' });
    link.addEventListener('click', (event) => event.preventDefault()); // jsdom não navega
    fireEvent.click(link);
    expect(details).not.toHaveAttribute('open');

    await open();
    nav.pathname = '/minhas-plataformas';
    rerender(
      <>
        <UserMenu email="ana@exemplo.com" />
        <button type="button">Fora</button>
      </>,
    );
    expect(details).not.toHaveAttribute('open');
  });
});

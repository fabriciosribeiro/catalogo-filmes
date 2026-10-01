// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { providers } from '../../../tests/fixtures/domain';
import { ProvidersForm } from './providers-form';

const actions = vi.hoisted(() => ({
  saveMyProvidersAction: vi.fn(async () => ({
    error: 'Não foi possível salvar agora. Tente de novo.',
  })),
}));
vi.mock('@/app/minhas-plataformas/actions', () => actions);

describe('ProvidersForm', () => {
  it('marca as plataformas já salvas', () => {
    render(<ProvidersForm providers={providers} saved={[119]} />);
    expect(screen.getByLabelText('Amazon Prime Video')).toBeChecked();
    expect(screen.getByLabelText('Netflix')).not.toBeChecked();
  });

  it('envia as marcadas e mostra o erro devolvido', async () => {
    render(<ProvidersForm providers={providers} saved={[]} />);
    await userEvent.click(screen.getByLabelText('Netflix'));
    await userEvent.click(screen.getByLabelText('Max'));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar agora.');
    const sent = (actions.saveMyProvidersAction.mock.calls[0] as unknown[])[1] as FormData;
    expect(sent.getAll('p')).toEqual(['8', '1899']);
  });
});

// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CredentialsForm } from './credentials-form';

const actions = vi.hoisted(() => ({
  signInAction: vi.fn(async () => ({ error: 'E-mail ou senha incorretos.' })),
  signUpAction: vi.fn(async () => ({ error: 'Já existe uma conta com este e-mail.' })),
}));
vi.mock('@/app/auth/actions', () => actions);

describe('CredentialsForm', () => {
  it('modo entrar: envia e mostra o erro devolvido pela action', async () => {
    render(<CredentialsForm mode="entrar" voltar="/filme/1" />);
    await userEvent.type(screen.getByLabelText('E-mail'), 'ana@exemplo.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'errada');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.');
    const sent = (actions.signInAction.mock.calls[0] as unknown[])[1] as FormData;
    expect(sent.get('voltar')).toBe('/filme/1');
  });

  it('modo criar: usa a action de cadastro e pede no mínimo 8 caracteres', async () => {
    render(<CredentialsForm mode="criar" voltar="/" />);
    expect(screen.getByLabelText('Senha')).toHaveAttribute('minLength', '8');
    await userEvent.type(screen.getByLabelText('E-mail'), 'ana@exemplo.com');
    await userEvent.type(screen.getByLabelText('Senha'), '12345678');
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Já existe uma conta com este e-mail.',
    );
    expect(actions.signInAction).not.toHaveBeenCalled();
  });
});

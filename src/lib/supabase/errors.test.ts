import { describe, expect, it } from 'vitest';
import { authErrorMessage, GENERIC_AUTH_ERROR } from './errors';

describe('authErrorMessage', () => {
  it.each([
    ['invalid_credentials', 'E-mail ou senha incorretos.'],
    ['user_already_exists', 'Já existe uma conta com este e-mail.'],
    ['email_exists', 'Já existe uma conta com este e-mail.'],
    ['weak_password', 'Senha fraca: use pelo menos 8 caracteres.'],
    ['same_password', 'A nova senha precisa ser diferente da atual.'],
    ['over_request_rate_limit', 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'],
    [
      'over_email_send_rate_limit',
      'Muitos e-mails enviados. Aguarde alguns minutos e tente de novo.',
    ],
  ])('traduz %s', (code, message) => {
    expect(authErrorMessage(code)).toBe(message);
  });

  it.each([undefined, 'codigo_novo', 'constructor', '__proto__'])(
    'código %j cai na mensagem genérica',
    (code) => {
      expect(authErrorMessage(code)).toBe(GENERIC_AUTH_ERROR);
    },
  );
});

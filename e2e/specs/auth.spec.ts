import { expect, test } from '@playwright/test';
import { PASSWORD, signIn, signOut, signUp } from '../helpers/auth';
import { recoveryLink } from '../helpers/mailpit';

test('cria conta, sai e entra de novo', async ({ page }) => {
  const email = await signUp(page);
  await expect(page).toHaveURL(/\/$/);
  await signOut(page);
  await signIn(page, email);
});

test('senha errada mostra o erro em português', async ({ page }) => {
  const email = await signUp(page);
  await signOut(page);
  await page.goto('/entrar');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill('senha-errada');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('main').getByRole('alert')).toHaveText('E-mail ou senha incorretos.');
});

test('volta para a página de origem depois de criar a conta', async ({ page }) => {
  await page.goto('/entrar?voltar=%2Ffilme%2F438631');
  await page.getByRole('link', { name: 'Criar conta' }).click();
  await expect(page).toHaveURL(/modo=criar/);
  await expect(page).toHaveURL(/voltar=%2Ffilme%2F438631/);
  const email = `e2e-voltar-${Date.now()}@example.com`;
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page).toHaveURL(/\/filme\/438631$/);
});

test('logado, /entrar redireciona para o catálogo', async ({ page }) => {
  await signUp(page);
  await page.goto('/entrar');
  await expect(page).toHaveURL(/\/$/);
});

test('recupera a senha pelo link do e-mail', async ({ page }) => {
  const email = await signUp(page);
  await signOut(page);

  await page.goto('/recuperar-senha');
  await page.getByLabel('E-mail').fill(email);
  await page.getByRole('button', { name: 'Enviar link' }).click();
  await expect(page.getByRole('status')).toContainText('Se existir uma conta com este e-mail');

  await page.goto(await recoveryLink(email));
  await expect(page).toHaveURL(/\/nova-senha$/);
  await page.getByLabel('Nova senha').fill('outra-senha-456');
  await page.getByLabel('Confirmar senha').fill('outra-senha-456');
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.context().clearCookies();
  await signIn(page, email, 'outra-senha-456');
});

test('link de recuperação inválido volta com aviso', async ({ page }) => {
  await page.goto('/auth/confirmar?token_hash=invalido&type=recovery');
  await expect(page).toHaveURL(/\/recuperar-senha\?aviso=link-invalido$/);
  await expect(page.getByRole('main').getByRole('alert')).toHaveText(
    'O link expirou, é inválido ou foi aberto em outro navegador. Peça um novo abaixo.',
  );
});

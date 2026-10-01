import { expect, test } from '@playwright/test';
import { signOut, signUp } from '../helpers/auth';

test('catálogo abre com as plataformas salvas e permite ver todas', async ({ page }) => {
  await signUp(page);
  await page.getByText('Minha conta').click();
  await page.getByRole('link', { name: 'Minhas plataformas' }).click();
  await expect(page).toHaveURL(/\/minhas-plataformas$/);

  await page.getByLabel('Netflix').check();
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page).toHaveURL(/\/\?p=8$/);
  const netflix = page.getByRole('button', { name: 'Netflix', exact: true });
  await expect(netflix).toHaveAttribute('aria-pressed', 'true');

  await netflix.click();
  await expect(page).toHaveURL(/\/\?p=todas$/);
  await page.reload();
  await expect(page).toHaveURL(/\/\?p=todas$/);

  await page.getByRole('button', { name: 'Minhas plataformas' }).click();
  await expect(page).toHaveURL(/\/\?p=8$/);

  await page.goto('/minhas-plataformas');
  await expect(page.getByLabel('Netflix')).toBeChecked();

  await page.goto('/');
  await signOut(page);
  await page.goto('/');
  await expect(page).toHaveURL(/\/$/);
});

test('deslogado, /minhas-plataformas pede login', async ({ page }) => {
  await page.goto('/minhas-plataformas');
  await expect(page).toHaveURL(/\/entrar\?voltar=%2Fminhas-plataformas$/);
});

import { expect, test } from '@playwright/test';
import { signUp } from '../helpers/auth';

test('salva e remove um filme pela página de detalhes', async ({ page }) => {
  await signUp(page);
  await page.goto('/filme/438631');

  await page.getByRole('button', { name: /Salvar na lista/ }).click();
  await expect(page.getByRole('button', { name: /Na minha lista/ })).toBeEnabled();
  await page.reload();
  await expect(page.getByRole('button', { name: /Na minha lista/ })).toBeVisible();

  await page.getByRole('button', { name: /Na minha lista/ }).click();
  await expect(page.getByRole('button', { name: /Salvar na lista/ })).toBeEnabled();
  await page.reload();
  await expect(page.getByRole('button', { name: /Salvar na lista/ })).toBeVisible();
});

test('deslogado, "Salvar na lista" leva ao login e volta ao filme', async ({ page }) => {
  await page.goto('/filme/438631');
  await page.getByRole('link', { name: /Salvar na lista/ }).click();
  await expect(page).toHaveURL(/\/entrar\?voltar=%2Ffilme%2F438631$/);
});

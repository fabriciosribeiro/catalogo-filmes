import { expect, test } from '@playwright/test';

test('filtra por Netflix e Terror e reflete na URL', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Filme 1001/ })).toBeVisible();

  await page.getByRole('button', { name: 'Netflix' }).click();
  await expect(page).toHaveURL(/\/\?p=8$/);
  await expect(page.getByRole('button', { name: 'Netflix' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.getByRole('button', { name: 'Terror' }).click();
  await expect(page).toHaveURL(/\/\?p=8&g=27$/);
  await expect(page.getByRole('link', { name: /Terror 1/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Filme 1001/ })).toHaveCount(0);
});

test('URL compartilhada reproduz os filtros', async ({ page }) => {
  await page.goto('/?p=8&g=27');
  await expect(page.getByRole('button', { name: 'Netflix' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: 'Terror' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('link', { name: /Terror 3/ })).toBeVisible();

  await page.getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('link', { name: /Filme 1001/ })).toBeVisible();
});

test('mostra o rodapé de atribuição', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByText('Este produto usa a API do TMDB mas não é endossado ou certificado pelo TMDB.', {
      exact: false,
    }),
  ).toBeVisible();
});

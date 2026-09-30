import { expect, test } from '@playwright/test';

test('busca um título e abre os detalhes com "Onde assistir"', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Buscar filme' }).fill('duna');

  await expect(page).toHaveURL(/\/\?q=duna$/);
  await expect(page.getByRole('heading', { name: 'Resultados para “duna”' })).toBeVisible();
  const results = page.getByRole('main').getByRole('link', { name: /Duna/ });
  await expect(results).toHaveCount(1); // Parte Dois (só aluguel) e a versão de 1984 (só nos EUA) ficam de fora

  await results.click();
  await expect(page).toHaveURL(/\/filme\/438631$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Duna' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Onde assistir' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Max' })).toBeVisible();
  await expect(page.getByRole('button', { name: '▶ Ver trailer' })).toBeVisible();
});

test('ID de filme inválido ou inexistente mostra 404 amigável', async ({ page }) => {
  for (const path of ['/filme/abc', '/filme/-1', '/filme/999999']) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.getByText('Filme não encontrado')).toBeVisible();
  }
});

import { expect, test } from '@playwright/test';

test('rolagem infinita carrega a página 2 e para no fim', async ({ page }) => {
  await page.goto('/');
  // Cards da grade: itens com link (os logos de serviço do destaque também são itens de lista).
  const cards = page
    .getByRole('main')
    .getByRole('listitem')
    .filter({ has: page.getByRole('link') });
  await expect(cards.first()).toBeVisible();

  await page.getByRole('link', { name: /Filme 1020/ }).scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 5000);

  await expect(page.getByRole('link', { name: /Filme 1021/ })).toBeVisible();
  await expect(cards).toHaveCount(40);
});

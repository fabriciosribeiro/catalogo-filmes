import { expect, test } from '@playwright/test';

test('rolagem infinita carrega a página 2 e para no fim', async ({ page }) => {
  await page.goto('/');
  const cards = page.getByRole('main').getByRole('listitem');
  await expect(cards.first()).toBeVisible();

  await page.getByRole('link', { name: /Filme 1020/ }).scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 5000);

  await expect(page.getByRole('link', { name: /Filme 1021/ })).toBeVisible();
  await expect(cards).toHaveCount(40);
});

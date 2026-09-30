import { expect, test } from '@playwright/test';

// O headless esconde as barras de rolagem por padrão; sem isso o teste não enxerga
// as barras clássicas que aparecem de verdade no Linux e no Windows.
test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } });

test('gêneros não exibem barra de rolagem no mobile nem no desktop', async ({ page }) => {
  const genres = page.getByRole('group', { name: 'Gêneros' });
  const metrics = () =>
    genres.evaluate((el: HTMLElement) => ({
      scrollbarGutter: el.offsetHeight - el.clientHeight,
      overflowsX: el.scrollWidth > el.clientWidth,
    }));

  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/');
  // Mobile: carrossel horizontal, mas sem barra visível.
  expect(await metrics()).toEqual({ scrollbarGutter: 0, overflowsX: true });

  await page.setViewportSize({ width: 1280, height: 800 });
  // Desktop: chips quebram linha, sem rolagem.
  expect(await metrics()).toEqual({ scrollbarGutter: 0, overflowsX: false });
});

import { expect, type Page } from '@playwright/test';

export const PASSWORD = 'senha-e2e-123';

export function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/** Cria uma conta nova (já logada) e devolve o e-mail. */
export async function signUp(page: Page, options: { voltar?: string } = {}): Promise<string> {
  const email = uniqueEmail();
  const query = new URLSearchParams({
    modo: 'criar',
    ...(options.voltar ? { voltar: options.voltar } : {}),
  });
  await page.goto(`/entrar?${query}`);
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByText('Minha conta')).toBeVisible();
  return email;
}

export async function signIn(page: Page, email: string, password = PASSWORD): Promise<void> {
  await page.goto('/entrar');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByText('Minha conta')).toBeVisible();
}

export async function signOut(page: Page): Promise<void> {
  await page.getByText('Minha conta').click();
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page.getByRole('link', { name: 'Entrar', exact: true })).toBeVisible();
}

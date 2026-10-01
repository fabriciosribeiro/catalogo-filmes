import { expect } from '@playwright/test';

const MAILPIT = 'http://127.0.0.1:54324';

/** Link de recuperação de senha do e-mail mais recente enviado para `to` (Mailpit do Supabase local). */
export async function recoveryLink(to: string): Promise<string> {
  let id: string | undefined;
  await expect
    .poll(
      async () => {
        const response = await fetch(
          `${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`,
        );
        const body = (await response.json()) as { messages: { ID: string }[] };
        id = body.messages[0]?.ID;
        return id;
      },
      { timeout: 15_000 },
    )
    .toBeTruthy();
  const message = (await (await fetch(`${MAILPIT}/api/v1/message/${id}`)).json()) as {
    HTML: string;
  };
  const href = message.HTML.match(/href="([^"]*\/auth\/confirmar[^"]*)"/)?.[1];
  if (!href) throw new Error('Link de recuperação não encontrado no e-mail.');
  return href.replaceAll('&amp;', '&');
}

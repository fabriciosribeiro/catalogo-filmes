import { execSync } from 'node:child_process';

/** URL e chave pública do Supabase local (`npm run db:start`), lidas de `supabase status`. */
export function localSupabaseEnv(): { url: string; key: string } {
  let output: string;
  try {
    output = execSync('npx supabase status -o env', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    throw new Error('Supabase local não está rodando: rode `npm run db:start` antes do E2E.');
  }
  const vars = Object.fromEntries(
    output.split('\n').flatMap((line) => {
      const match = line.match(/^([A-Z_]+)="?(.*?)"?$/);
      return match ? [[match[1], match[2]]] : [];
    }),
  );
  const url = vars.API_URL;
  const key = vars.PUBLISHABLE_KEY ?? vars.ANON_KEY;
  if (!url || !key)
    throw new Error('Não achei API_URL/PUBLISHABLE_KEY em `supabase status -o env`.');
  return { url, key };
}

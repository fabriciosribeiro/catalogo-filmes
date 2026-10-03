import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { exchangeRecoveryCode, verifyRecoveryToken } from '@/lib/supabase/auth';

/**
 * Destino do link do e-mail de recuperação: troca o token por uma sessão e leva à troca de senha.
 * Aceita os dois formatos: `token_hash` (template próprio, local/CI) e `code` (e-mail padrão
 * do Supabase com PKCE, usado em produção sem SMTP próprio).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get('token_hash');
  const code = params.get('code');

  let result = null;
  if (tokenHash && params.get('type') === 'recovery') {
    result = await verifyRecoveryToken(tokenHash);
  } else if (code) {
    result = await exchangeRecoveryCode(code);
  }

  if (result?.ok) redirect('/nova-senha');
  redirect('/recuperar-senha?aviso=link-invalido');
}

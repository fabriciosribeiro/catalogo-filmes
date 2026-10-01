import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { verifyRecoveryToken } from '@/lib/supabase/auth';

/** Destino do link do e-mail de recuperação: troca o token por uma sessão e leva à troca de senha. */
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type');
  if (tokenHash && type === 'recovery') {
    const result = await verifyRecoveryToken(tokenHash);
    if (result.ok) redirect('/nova-senha');
  }
  redirect('/recuperar-senha?aviso=link-invalido');
}

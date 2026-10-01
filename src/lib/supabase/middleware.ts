import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from './database.types';
import { supabaseEnv } from './env';

/** Renova o token da sessão (se houver) e repassa os cookies atualizados para a página e o navegador. */
export async function updateSession(request: NextRequest) {
  // Visitante sem cookie de sessão: nada a renovar, e evita uma chamada ao Supabase por request
  if (!request.cookies.getAll().some((cookie) => cookie.name.startsWith('sb-'))) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, key } = supabaseEnv();
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // Cache-Control: no-store etc.: resposta com cookie de sessão não pode ir para cache compartilhado
        for (const [header, value] of Object.entries(headers)) response.headers.set(header, value);
      },
    },
  });

  // Nada entre criar o client e o getUser: é ele que renova o token
  await supabase.auth.getUser();
  return response;
}

import 'server-only';
import { getCurrentUser } from './supabase/auth';
import { getSavedProviders } from './supabase/user-providers';

/** Plataformas salvas para o catálogo. Qualquer falha degrada para a experiência de quem não está logado. */
export async function savedProvidersForCatalog(): Promise<number[]> {
  try {
    const user = await getCurrentUser();
    return user ? await getSavedProviders(user.id) : [];
  } catch {
    return [];
  }
}

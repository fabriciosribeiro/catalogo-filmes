import 'server-only';
import { createSupabaseServerClient } from './server';

export async function getSavedProviders(userId: string): Promise<number[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('user_providers')
    .select('provider_ids')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(`Falha ao ler as plataformas: ${error.message}`);
  return data?.provider_ids ?? [];
}

export async function saveProviders(userId: string, providerIds: number[]): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('user_providers')
    .upsert(
      { user_id: userId, provider_ids: providerIds, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
  if (error) throw new Error(`Falha ao salvar as plataformas: ${error.message}`);
}

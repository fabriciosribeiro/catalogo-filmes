'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/supabase/auth';
import { saveProviders } from '@/lib/supabase/user-providers';
import { FEATURED_PROVIDER_IDS } from '@/lib/tmdb/config';

export type ProvidersFormState = { error?: string };

const ALLOWED = new Set<number>(FEATURED_PROVIDER_IDS);
const providerIdsSchema = z
  .array(
    z.coerce
      .number()
      .int()
      .refine((id) => ALLOWED.has(id)),
  )
  .max(FEATURED_PROVIDER_IDS.length * 2);

export async function saveMyProvidersAction(
  _prev: ProvidersFormState,
  formData: FormData,
): Promise<ProvidersFormState> {
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?voltar=${encodeURIComponent('/minhas-plataformas')}`);

  const parsed = providerIdsSchema.safeParse(formData.getAll('p'));
  if (!parsed.success) return { error: 'Seleção de plataformas inválida.' };

  try {
    await saveProviders(user.id, [...new Set(parsed.data)]);
  } catch {
    return { error: 'Não foi possível salvar agora. Tente de novo.' };
  }
  redirect('/');
}

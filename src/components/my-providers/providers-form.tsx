'use client';

import Image from 'next/image';
import { useActionState } from 'react';
import { saveMyProvidersAction, type ProvidersFormState } from '@/app/minhas-plataformas/actions';
import { FormMessage, SubmitButton } from '@/components/auth/form-parts';
import { tmdbImageUrl } from '@/lib/tmdb/images';
import type { Provider } from '@/lib/tmdb/types';

type Props = { providers: Provider[]; saved: number[] };

export function ProvidersForm({ providers, saved }: Props) {
  const [state, formAction] = useActionState<ProvidersFormState, FormData>(
    saveMyProvidersAction,
    {},
  );
  return (
    <form action={formAction} className="flex flex-col gap-6">
      <fieldset className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <legend className="sr-only">Plataformas que você assina</legend>
        {providers.map((provider) => {
          const logo = tmdbImageUrl(provider.logoPath, 'w92');
          return (
            <label
              key={provider.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg bg-surface p-3 ring-1 ring-surface-2 has-checked:ring-2 has-checked:ring-accent"
            >
              <input
                type="checkbox"
                name="p"
                value={provider.id}
                defaultChecked={saved.includes(provider.id)}
                className="size-4 accent-(--color-accent)"
              />
              <span className="relative size-8 shrink-0 overflow-hidden rounded-md bg-surface-2">
                {logo && <Image src={logo} alt="" fill sizes="32px" className="object-cover" />}
              </span>
              <span className="text-sm font-medium">{provider.name}</span>
            </label>
          );
        })}
      </fieldset>
      <FormMessage error={state.error} />
      <div>
        <SubmitButton>Salvar</SubmitButton>
      </div>
    </form>
  );
}

import Image from 'next/image';
import { tmdbImageUrl } from '@/lib/tmdb/images';
import type { Provider } from '@/lib/tmdb/types';

type Props = { providers: Provider[]; link: string | null };

export function WatchProviders({ providers, link }: Props) {
  if (!providers.length) {
    return (
      <p className="rounded-md bg-surface px-3 py-2 text-sm text-muted">
        Não está disponível em streaming por assinatura no momento.
      </p>
    );
  }
  return (
    <div>
      <h2 className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
        Onde assistir
      </h2>
      <ul className="flex flex-wrap items-center gap-2">
        {providers.map((provider) => {
          const logo = tmdbImageUrl(provider.logoPath, 'w92');
          return (
            <li
              key={provider.id}
              title={provider.name}
              className="relative flex size-11 items-center justify-center overflow-hidden rounded-xl bg-surface-2 text-[10px]"
            >
              {logo ? (
                <Image src={logo} alt={provider.name} fill sizes="44px" className="object-cover" />
              ) : (
                provider.name
              )}
            </li>
          );
        })}
      </ul>
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-xs text-muted underline hover:text-fg"
        >
          Ver opções no TMDB (dados JustWatch)
        </a>
      )}
    </div>
  );
}

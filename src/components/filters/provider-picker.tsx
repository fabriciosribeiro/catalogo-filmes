import Image from 'next/image';
import { tmdbImageUrl } from '@/lib/tmdb/images';
import type { Provider } from '@/lib/tmdb/types';

type Props = { providers: Provider[]; selected: number[]; onChange: (ids: number[]) => void };

export function ProviderPicker({ providers, selected, onChange }: Props) {
  const hasSelection = selected.length > 0;
  return (
    <div
      role="group"
      aria-label="Plataformas"
      className="-mx-4 flex gap-3 overflow-x-auto px-4 py-1"
    >
      {providers.map((provider) => {
        const isSelected = selected.includes(provider.id);
        const logo = tmdbImageUrl(provider.logoPath, 'w92');
        const toggle = () =>
          onChange(
            isSelected ? selected.filter((id) => id !== provider.id) : [...selected, provider.id],
          );
        return (
          <button
            key={provider.id}
            type="button"
            aria-pressed={isSelected}
            title={provider.name}
            onClick={toggle}
            className={[
              'relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-2 text-[10px] leading-tight font-semibold transition',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              isSelected
                ? 'ring-2 ring-accent'
                : hasSelection
                  ? 'opacity-40 hover:opacity-80'
                  : 'hover:brightness-110',
            ].join(' ')}
          >
            {logo ? (
              <Image src={logo} alt={provider.name} fill sizes="48px" className="object-cover" />
            ) : (
              provider.name
            )}
          </button>
        );
      })}
    </div>
  );
}

import Image from 'next/image';
import { initials } from '@/lib/format';
import { tmdbImageUrl } from '@/lib/tmdb/images';
import type { CastMember } from '@/lib/tmdb/types';

export function CastList({ cast }: { cast: CastMember[] }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold">Elenco</h2>
      <ul className="-mx-4 mt-4 flex gap-4 overflow-x-auto px-4 pb-2">
        {cast.map((person) => {
          const photo = tmdbImageUrl(person.profilePath, 'w185');
          return (
            <li key={person.id} className="w-24 shrink-0 text-center">
              <div className="relative mx-auto size-20 overflow-hidden rounded-full bg-surface-2">
                {photo ? (
                  <Image src={photo} alt={person.name} fill sizes="80px" className="object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-lg font-semibold text-muted">
                    {initials(person.name)}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs font-semibold">{person.name}</p>
              {person.character && <p className="text-xs text-muted">{person.character}</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

import type { Genre } from '@/lib/tmdb/types';

type Props = { genres: Genre[]; selected: number[]; onChange: (ids: number[]) => void };

export function GenreChips({ genres, selected, onChange }: Props) {
  return (
    <div
      role="group"
      aria-label="Gêneros"
      className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:flex-wrap sm:overflow-visible"
    >
      {genres.map((genre) => {
        const isSelected = selected.includes(genre.id);
        return (
          <button
            key={genre.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() =>
              onChange(
                isSelected ? selected.filter((id) => id !== genre.id) : [...selected, genre.id],
              )
            }
            className={[
              'shrink-0 rounded-full px-3 py-1 text-sm whitespace-nowrap transition',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              isSelected
                ? 'bg-accent font-semibold text-accent-fg'
                : 'bg-surface-2 hover:bg-surface-2/70',
            ].join(' ')}
          >
            {genre.name}
          </button>
        );
      })}
    </div>
  );
}

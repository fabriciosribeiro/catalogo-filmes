import type { SortOption } from '@/lib/filters';

const LABELS: Record<SortOption, string> = {
  popularidade: 'Popularidade',
  nota: 'Nota',
  lancamento: 'Lançamento',
};

type Props = { value: SortOption; onChange: (value: SortOption) => void };

export function SortSelect({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor="ordenar" className="text-muted">
        Ordenar por
      </label>
      <select
        id="ordenar"
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="rounded-md bg-surface-2 px-2 py-1.5 focus-visible:outline-2 focus-visible:outline-accent"
      >
        {(Object.keys(LABELS) as SortOption[]).map((option) => (
          <option key={option} value={option}>
            {LABELS[option]}
          </option>
        ))}
      </select>
    </div>
  );
}

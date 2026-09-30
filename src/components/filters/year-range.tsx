import { MIN_YEAR } from '@/lib/filters';

type Props = {
  yearFrom?: number;
  yearTo?: number;
  onChange: (range: { yearFrom?: number; yearTo?: number }) => void;
};

const FIRST_LISTED_YEAR = Math.max(MIN_YEAR, 1920);

function years(): number[] {
  const current = new Date().getFullYear();
  return Array.from({ length: current - FIRST_LISTED_YEAR + 1 }, (_, i) => current - i);
}

const selectClasses =
  'rounded-md bg-surface-2 px-2 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-accent';

export function YearRange({ yearFrom, yearTo, onChange }: Props) {
  const toNumber = (value: string) => (value ? Number(value) : undefined);
  return (
    <div className="flex items-center gap-2 text-sm">
      <label className="sr-only" htmlFor="ano-inicial">
        Ano inicial
      </label>
      <select
        id="ano-inicial"
        className={selectClasses}
        value={yearFrom ?? ''}
        onChange={(e) => onChange({ yearFrom: toNumber(e.target.value), yearTo })}
      >
        <option value="">Desde sempre</option>
        {years().map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
      <span className="text-muted">até</span>
      <label className="sr-only" htmlFor="ano-final">
        Ano final
      </label>
      <select
        id="ano-final"
        className={selectClasses}
        value={yearTo ?? ''}
        onChange={(e) => onChange({ yearFrom, yearTo: toNumber(e.target.value) })}
      >
        <option value="">Hoje</option>
        {years().map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
}

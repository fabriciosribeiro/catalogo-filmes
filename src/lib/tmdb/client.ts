import 'server-only';

const DEFAULT_BASE_URL = 'https://api.themoviedb.org/3';
const DEFAULT_RETRY_AFTER_SECONDS = 1;
const MAX_RETRY_AFTER_SECONDS = 10;

export class TmdbError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'TmdbError';
    this.status = status;
  }
}

export type TmdbParams = Record<string, string | number | undefined>;

function retryAfterMs(header: string | null): number {
  const seconds = header === null || header.trim() === '' ? NaN : Number(header);
  const safe = Number.isFinite(seconds) && seconds >= 0 ? seconds : DEFAULT_RETRY_AFTER_SECONDS;
  return Math.min(safe, MAX_RETRY_AFTER_SECONDS) * 1000;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function tmdbFetch<T>(
  path: string,
  params: TmdbParams,
  options: { revalidate: number },
): Promise<T> {
  const token = process.env.TMDB_READ_TOKEN;
  if (!token) throw new Error('TMDB_READ_TOKEN não está configurado');

  const url = new URL(`${process.env.TMDB_API_BASE_URL ?? DEFAULT_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const init = {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    next: { revalidate: options.revalidate },
  };

  let response = await fetch(url, init);
  if (response.status === 429) {
    await sleep(retryAfterMs(response.headers.get('Retry-After')));
    response = await fetch(url, init);
  }

  if (!response.ok) {
    const error = new TmdbError(response.status, `TMDB respondeu ${response.status} em ${path}`);
    if (response.status !== 404) console.error(error.message);
    throw error;
  }

  return (await response.json()) as T;
}

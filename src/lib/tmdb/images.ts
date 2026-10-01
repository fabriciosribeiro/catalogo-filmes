export type ImageSize = 'w92' | 'w185' | 'w300' | 'w342' | 'w500' | 'w780' | 'w1280';

export function tmdbImageUrl(path: string | null, size: ImageSize): string | null {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}

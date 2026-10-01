export const WATCH_REGION = 'BR';
export const LANGUAGE = 'pt-BR';
export const MAX_PAGE = 500;
export const MIN_VOTES_FOR_RATING_SORT = 200;

export const REVALIDATE = {
  catalogMetadata: 86_400, // provedores e gêneros
  listings: 21_600, // discover e busca
  movie: 86_400, // detalhes e provedores por filme
  trending: 21_600, // destaques da semana
} as const;

/** Quantos filmes o carrossel de destaques mostra e quantos candidatos do trending são avaliados. */
export const FEATURED_COUNT = 5;
export const FEATURED_CANDIDATES = 20;

/**
 * Serviços de assinatura exibidos na faixa de plataformas, nesta ordem.
 * IDs do TMDB: Netflix, Amazon Prime Video, Max, Disney Plus, Globoplay,
 * Apple TV Plus, Paramount Plus, MUBI. IDs que o TMDB não retornar para o BR são descartados.
 */
export const FEATURED_PROVIDER_IDS = [8, 119, 1899, 337, 307, 350, 531, 11] as const;

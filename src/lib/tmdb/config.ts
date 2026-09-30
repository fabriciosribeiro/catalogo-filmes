export const WATCH_REGION = 'BR';
export const LANGUAGE = 'pt-BR';
export const MAX_PAGE = 500;
export const MIN_VOTES_FOR_RATING_SORT = 200;

export const REVALIDATE = {
  catalogMetadata: 86_400, // provedores e gêneros
  listings: 21_600, // discover e busca
  movie: 86_400, // detalhes e provedores por filme
} as const;

/**
 * Serviços de assinatura exibidos na faixa de plataformas, nesta ordem.
 * IDs do TMDB: Netflix, Amazon Prime Video, Max, Disney Plus, Globoplay,
 * Apple TV Plus, Paramount Plus, MUBI. IDs que o TMDB não retornar para o BR são descartados.
 */
export const FEATURED_PROVIDER_IDS = [8, 119, 1899, 337, 307, 350, 531, 11] as const;

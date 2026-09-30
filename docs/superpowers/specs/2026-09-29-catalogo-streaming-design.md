# EmCartaz — Catálogo de filmes em streaming (Design)

- **Data:** 2026-09-29
- **Status:** aprovado (2026-09-29)
- **Nome:** "EmCartaz" é provisório.

## 1. Objetivo e contexto

Aplicação web que mostra os filmes disponíveis **agora** em streaming por assinatura no **Brasil**, usando a API do TMDB (dados de disponibilidade fornecidos pela JustWatch).

- **Propósito:** projeto de portfólio/estudo, e primeiro projeto construído com o Claude (avaliação da ferramenta). Deve ser bem-acabado de ponta a ponta: visual caprichado, código organizado, testes, CI e deploy público.
- **Autor:** já programa; explicações técnicas podem ser diretas.

### Critérios de sucesso

1. Os 6 itens do MVP (seção 3) funcionando em produção na Vercel, com link público.
2. Chave do TMDB nunca exposta ao navegador.
3. Qualquer estado de filtro/busca reproduzível por URL.
4. Suíte de testes verde no CI (lint, typecheck, unit/integração, build).
5. README apresentável (screenshots, arquitetura, decisões).

## 2. Decisões de escopo

| Decisão | Escolha |
|---|---|
| Região | Somente Brasil (`watch_region=BR`) |
| Tipo de disponibilidade | Somente assinatura (`with_watch_monetization_types=flatrate`) |
| Idioma | Interface e dados em pt-BR (`language=pt-BR`) |
| Stack | Next.js 15 (App Router) + TypeScript strict + Tailwind CSS, deploy na Vercel |
| Estratégia de dados | Server Components sob demanda lendo a URL, com cache do Next; sem banco de dados |

**Fora do escopo:** login/contas, favoritos/listas, séries, outros países, aluguel/compra/grátis, índice próprio sincronizado, i18n.

## 3. Funcionalidades do MVP

1. **Catálogo** em grade de pôsteres com rolagem infinita.
2. **Filtro por plataforma** (múltipla seleção; lógica OU entre plataformas).
3. **Filtros por gênero e ano** + **ordenação** (popularidade, nota, lançamento).
4. **Busca por título**, restrita a filmes disponíveis em streaming por assinatura no Brasil.
5. **Página de detalhes**: sinopse, nota, duração, gêneros, elenco, trailer, "Onde assistir".
6. **URL compartilhável**: todo estado de filtro/busca vive na URL.

## 4. Arquitetura

### 4.1 Estrutura

```
src/
  lib/tmdb/
    client.ts        fetch autenticado (env TMDB_READ_TOKEN), revalidate, TmdbError, retry em 429
    movies.ts        discoverStreaming(filters, page), searchStreaming(q),
                     getMovieDetails(id), getProviders(), getGenres()
    types.ts         tipos crus do TMDB + mapeamento para tipos de domínio
  lib/filters.ts     parse/serialize searchParams ⇄ Filters (validado com zod)
  app/
    page.tsx               catálogo (Server Component; lê searchParams)
    loading.tsx            skeleton da grade
    error.tsx              erro genérico com "Tentar de novo"
    not-found.tsx          404
    actions.ts             Server Action loadMore(filters, page)
    filme/[id]/page.tsx    detalhes
    filme/[id]/error.tsx
  components/        MovieGrid, MovieCard, FilterBar, ProviderPicker, GenreChips,
                     SortSelect, YearRange, SearchBox, TrailerModal, WatchProviders, ...
```

### 4.2 Regras de fronteira

- **Somente `lib/tmdb` conhece o TMDB.** Páginas e componentes consomem funções que retornam tipos de domínio (`Movie`, `MovieDetails`, `Provider`, `Genre`), nunca o formato cru da API. Isso permite trocar a fonte de dados (ex.: índice próprio) sem mexer na UI.
- **`lib/filters.ts` é a única fonte da verdade da URL.** Página: URL → `Filters`. `FilterBar`: altera `Filters` → URL.
- **Token só no servidor.** `TMDB_READ_TOKEN` sem prefixo `NEXT_PUBLIC_`; nenhuma chamada ao TMDB a partir do cliente. Imagens vêm do CDN público `image.tmdb.org` (não exige token).

### 4.3 Modelo `Filters`

```ts
type SortOption = 'popularidade' | 'nota' | 'lancamento';

type Filters = {
  providers: number[];      // IDs de provedor TMDB; [] = todas as plataformas principais
  genres: number[];         // IDs de gênero TMDB
  yearFrom?: number;
  yearTo?: number;
  sort: SortOption;         // padrão: 'popularidade'
  query?: string;           // se presente, modo busca (ignora os demais filtros)
};
```

Parâmetros de URL: `p` (provedores, separados por vírgula), `g` (gêneros), `ano` (`AAAA-AAAA`, `AAAA-` ou `-AAAA`), `ordem`, `q`. Exemplo: `/?p=8,119&g=27&ano=2020-2025&ordem=nota`. Valores inválidos são descartados individualmente, sem quebrar a página.

### 4.4 Cache (`revalidate`)

| Dado | Revalidação |
|---|---|
| Provedores e gêneros | 24h |
| Discover e busca | 6h |
| Detalhes do filme e provedores por filme | 24h |

### 4.5 Atribuição

Rodapé com o logo do TMDB, o aviso "Este produto usa a API do TMDB mas não é endossado ou certificado pelo TMDB" e "Dados de streaming fornecidos por JustWatch".

## 5. Fluxo de dados

### 5.1 Catálogo, filtros e ordenação

`page.tsx` converte `searchParams` → `Filters` → `discoverStreaming(filters, 1)`, que chama `/discover/movie` com:

- `watch_region=BR`, `with_watch_monetization_types=flatrate`, `language=pt-BR`
- `with_watch_providers` = IDs unidos por `|` (OU). Sem provedores selecionados, usa a lista de plataformas principais do Brasil — as mesmas exibidas na faixa de plataformas. Essa lista é uma allowlist fixa de IDs de serviços de assinatura (`FEATURED_PROVIDER_IDS` em `lib/tmdb`), cruzada com `/watch/providers/movie?watch_region=BR` para obter nome e logo; IDs que o TMDB não retornar são descartados. (Usar só o top-N por `display_priority` traria lojas de aluguel/compra, como Google Play e Apple TV, para a faixa.)
- `with_genres` = IDs unidos por `,` (E)
- `primary_release_date.gte` / `.lte` a partir do ano
- `sort_by`: popularidade → `popularity.desc`; nota → `vote_average.desc` com `vote_count.gte=200`; lançamento → `primary_release_date.desc`

### 5.2 Rolagem infinita

A primeira página é renderizada no servidor. Um client component observa o fim da grade (IntersectionObserver) e chama a Server Action `loadMore(filters, page + 1)`, que retorna `{ movies: Movie[], hasMore: boolean }`. A rolagem para quando `page >= total_pages` ou `page >= 500` (limite do TMDB). Mudar filtros reinicia a lista.

### 5.3 Busca

`/?q=duna` ativa o modo busca, que ignora os demais filtros (o TMDB não combina busca textual com filtros de provedor). `searchStreaming(q)`:

1. `/search/movie?query=q&language=pt-BR&region=BR`, só a primeira página (20 resultados).
2. Para cada resultado, `/movie/{id}/watch/providers` em paralelo (`Promise.all`, cache de 24h por filme).
3. Mantém só os filmes com `results.BR.flatrate` não vazio.

A busca não tem rolagem infinita. Com poucos resultados, a tela sugere refinar o termo.

### 5.4 Detalhes

`/filme/[id]` → `getMovieDetails(id)` → `/movie/{id}?append_to_response=credits,videos,watch/providers&language=pt-BR`. Os vídeos também são pedidos com `include_video_language=pt,en`. Trailer: prioriza o YouTube `type=Trailer` em pt; se não houver, usa em inglês; se não houver nenhum, o botão fica oculto. Elenco: os 10 primeiros. "Onde assistir": `results.BR.flatrate` com logos e link para a página do TMDB/JustWatch. Sem `flatrate` no Brasil, a página abre mesmo assim, com o aviso "Não está disponível em streaming por assinatura no momento".

### 5.5 URL

Mudanças de filtro usam `router.replace` (sem empilhar histórico), com debounce de ~300ms na busca textual.

## 6. Interface

### 6.1 Estilo visual: "cinema escuro"

- Fundo quase preto (~`#0b0c10`), superfícies `#1c1e25`, texto `#e8e8ea`.
- Destaque amarelo-ingresso (~`#f5c518`) para seleção, nota e ações primárias.
- Pôsteres como protagonistas. Nota em selo amarelo no canto do card; título e "ano · gênero" abaixo.

### 6.2 Catálogo: layout "faixa de plataformas + chips"

- Header: marca + campo de busca.
- Faixa de logos das plataformas (seleção múltipla; os não selecionados ficam esmaecidos quando há seleção).
- Linha de chips: gêneros (rolagem horizontal), ano e ordenação.
- Grade larga de pôsteres 2:3 (responsiva: ~2 colunas no celular, até 6+ no desktop).
- No celular, faixa de plataformas e chips com rolagem horizontal.

### 6.3 Detalhes: layout "hero com backdrop"

- Backdrop largo com gradiente escurecendo para o fundo; pôster sobreposto; link "← Voltar ao catálogo".
- Título, selo de nota, ano, duração, gêneros.
- "Onde assistir" logo abaixo do título, e botão "▶ Ver trailer", que abre um modal (`TrailerModal`) com o embed do YouTube.
- Sinopse e elenco (fotos circulares + nome + personagem) abaixo.

## 7. Estados e erros

**Carregamento**
- `loading.tsx`: grade de skeletons 2:3.
- Rolagem infinita: 6 skeletons no fim da grade.
- `next/image` com `remotePatterns` para `image.tmdb.org`. Filme sem pôster mostra um placeholder com o título.

**Vazios**
- Filtros sem resultado: "Nenhum filme encontrado com esses filtros" + "Limpar filtros".
- Busca sem resultado em streaming: mensagem específica, com o termo buscado.
- Filme fora do streaming: aviso na página de detalhes (5.4).

**Erros**
- `TmdbError { status, message }` lançado por `client.ts`.
- 404 em detalhes → `notFound()` → `not-found.tsx` ("Filme não encontrado").
- 401/5xx → registrado no log do servidor; o usuário vê só a mensagem genérica do `error.tsx`, com "Tentar de novo" (`reset()`).
- 429 → uma nova tentativa após `Retry-After` (padrão de 1s, se o header não vier); se falhar de novo, lança o erro.
- Falha no `loadMore`: mantém a grade já carregada e mostra "Não foi possível carregar mais — tentar de novo" no fim.
- Parâmetros de URL inválidos: descartados pelo zod, com os valores padrão aplicados.

**Acessibilidade**
- Cards são links com `alt` no pôster.
- Filtros operáveis por teclado; chips e logos com `aria-pressed`.
- Foco preso no modal do trailer, que fecha com Esc.
- Contraste AA no tema escuro.

## 8. Testes e qualidade

**Ferramentas:** Vitest + Testing Library + MSW (mock HTTP do TMDB) + Playwright.

| Camada | Tipo | O que cobre |
|---|---|---|
| `lib/filters.ts` | unitário | ida e volta URL ⇄ `Filters`, descarte de inválidos, valores padrão |
| `lib/tmdb/` | integração (MSW) | query correta do discover (provedores com `\|`, flatrate, BR, piso de votos), mapeamento para o domínio, filtro de flatrate na busca, 404 → `TmdbError`, retry em 429 |
| componentes | Testing Library | `FilterBar` → URL, `ProviderPicker` alterna seleção e `aria-pressed`, `MovieCard` sem pôster, estados vazios/erro |
| E2E | Playwright | (1) filtrar Netflix + Terror e conferir URL e grade; (2) buscar e abrir detalhes com "Onde assistir"; (3) rolagem infinita carrega a página 2 |

- Fixtures: respostas reais do TMDB salvas em `tests/fixtures/`.
- Os E2E rodam contra o MSW por padrão. Rodar contra a API real é opcional, com o token como secret no CI.
- Desenvolvimento com TDD, principalmente em `lib/filters` e `lib/tmdb`.

**Qualidade/CI**
- TypeScript strict, ESLint e Prettier.
- GitHub Actions a cada push/PR: lint, typecheck, testes unit/integração, build.
- Vercel: preview por PR e produção a partir da `main`. `TMDB_READ_TOKEN` configurado como variável de ambiente.

**README:** screenshots, link do deploy, diagrama de arquitetura, decisões com justificativa (flatrate/BR, limite de 500 páginas, custo da busca, por que não há banco) e como rodar localmente.

## 9. Evolução futura (não faz parte deste escopo)

- Índice próprio sincronizado por cron (Postgres/SQLite), para remover o limite de 500 páginas e enriquecer filtros e busca. A fronteira `lib/tmdb` existe para permitir essa troca.
- Favoritos/listas, séries, seletor de região.

# EmCartaz — Catálogo de filmes em streaming: Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir e publicar na Vercel um app Next.js que lista os filmes disponíveis agora em streaming por assinatura no Brasil (dados do TMDB), com filtros na URL, busca, rolagem infinita e página de detalhes.

**Architecture:** Server Components renderizam cada página a partir da URL. Toda comunicação com o TMDB fica isolada em `src/lib/tmdb/` (somente servidor, cache via `fetch` com `revalidate`) e devolve tipos de domínio. O estado de filtros vive na URL, e `src/lib/filters.ts` é a única fonte da verdade de parse/serialize. A rolagem infinita usa uma Server Action. Não há banco de dados.

**Tech Stack:** Node 24 LTS, Next.js 15 (App Router), React 19, TypeScript strict, Tailwind CSS v4, zod, Vitest 3 + Testing Library + MSW 2, Playwright, GitHub Actions, Vercel.

**Spec:** `docs/superpowers/specs/2026-09-29-catalogo-streaming-design.md` (leia junto com este plano).

## Pré-requisitos (ações do usuário, antes da Task 1)

1. **Node 24 LTS (já instalado: v24.21.0 via nvm).** A máquina tem Node 18.19 (fora de suporte; Tailwind v4, jsdom e Playwright atuais pedem Node 20+). Instale via nvm:
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
   # abra um novo terminal
   nvm install 24 && nvm alias default 24
   node -v   # deve mostrar v24.x
   ```
2. **Token do TMDB.** Crie uma conta em https://www.themoviedb.org/signup, vá em *Configurações → API* (https://www.themoviedb.org/settings/api), solicite uma chave (uso pessoal/educacional) e copie o **API Read Access Token** (o token longo, "Bearer"). Ele será salvo em `.env.local` na Task 1.

## Global Constraints

- Node 24 LTS (`.nvmrc` = `24`). No shell do agente, o Node do sistema é 18: prefixe comandos com `export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH";` (ou rode `export` uma vez por sessão de Bash); `next@15` com App Router; TypeScript `strict: true`.
- Toda chamada ao TMDB usa `language=pt-BR` e, quando aplicável, `watch_region=BR` e `with_watch_monetization_types=flatrate`.
- `TMDB_READ_TOKEN` só existe no servidor: nunca usar prefixo `NEXT_PUBLIC_`. Todo arquivo que chama o TMDB começa com `import 'server-only';`.
- Somente `src/lib/tmdb/` conhece o formato cru do TMDB. Componentes importam apenas tipos de domínio de `@/lib/tmdb/types` e o helper `@/lib/tmdb/images`.
- `src/lib/filters.ts` é a única fonte da verdade da URL (`p`, `g`, `ano`, `ordem`, `q`).
- Revalidação: provedores e gêneros `86400`; discover e busca `21600`; detalhes e provedores por filme `86400`.
- Limite de paginação do TMDB: página máxima `500`. Ordenação por nota usa `vote_count.gte=200`.
- Paleta: fundo `#0b0c10`, superfície `#1c1e25`, superfície 2 `#262a33`, texto `#e8e8ea`, texto secundário `#9aa1af`, destaque `#f5c518`, texto sobre destaque `#111111`.
- Texto de atribuição no rodapé, exato: "Este produto usa a API do TMDB mas não é endossado ou certificado pelo TMDB." e "Dados de streaming fornecidos por JustWatch."
- Toda a interface em pt-BR.
- Testes nunca acessam a API real: MSW com `onUnhandledRequest: 'error'`.
- Todo commit termina com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` (use um segundo `-m`, como nos exemplos).
- Trabalhar numa branch (ex.: `feat/mvp`), nunca direto na `main`.
- Antes de cada commit, rode `npm run format` (o CI roda `format:check`). Os blocos de código deste plano podem passar de 100 colunas; o Prettier ajusta.

## Review Focus

1. **Cliques rápidos em filtros antes de o servidor responder.** Clicar em Netflix e logo depois em Prime deve resultar em `?p=8,119`; o segundo clique não pode descartar o primeiro. Teste na Task 8.
2. **Busca digitada enquanto a URL se atualiza.** Digitar "dun", o debounce atualizar a URL, e continuar digitando "duna" não pode fazer o campo voltar para "dun". Teste na Task 8.
3. **Filme repetido entre páginas da rolagem infinita.** O discover do TMDB pode repetir um filme na página seguinte quando a popularidade muda. A lista não pode duplicar o card nem gerar chave React repetida. Teste na Task 9.
4. **Server Action chamada com entrada arbitrária.** A Server Action é um endpoint público: `loadMore('lixo', 0)`, `loadMore('', 9999)` e `loadMore('q=duna', 2)` devem devolver página vazia, sem erro nem chamada ao TMDB. Teste na Task 9.
5. **ID de filme inválido na URL.** `/filme/abc`, `/filme/-1` e um ID inexistente devem mostrar "Filme não encontrado" (404), nunca a página de erro genérica. Testes na Task 11 (unitário) e na Task 12 (E2E).

---

## Mapa de arquivos

```
.nvmrc                                  versão do Node
.env.example                            variáveis necessárias
.github/workflows/ci.yml                lint, format, testes, build, typecheck, e2e
next.config.ts                          remotePatterns de image.tmdb.org
vitest.config.mts                       Vitest (alias server-only, setup)
playwright.config.ts                    E2E com mock do TMDB
src/
  app/
    layout.tsx                          html pt-BR, header, footer
    globals.css                         Tailwind v4 + tokens do tema
    page.tsx                            catálogo (lê searchParams)
    loading.tsx | error.tsx | not-found.tsx
    actions.ts                          Server Action loadMore
    filme/[id]/page.tsx | error.tsx | not-found.tsx
  lib/
    filters.ts                          URL ⇄ Filters
    format.ts                           nota, duração, iniciais
    movie-id.ts                         parse do [id] da rota
    tmdb/
      config.ts                         constantes (região, revalidate, allowlist)
      client.ts                         tmdbFetch + TmdbError
      types.ts                          tipos crus + tipos de domínio
      mappers.ts                        cru → domínio
      movies.ts                         getProviders, getGenres, discoverStreaming, searchStreaming, getMovieDetails
      images.ts                         URL de imagem do CDN
  components/
    site-header.tsx | site-footer.tsx | search-box.tsx
    movie-card.tsx | movie-grid.tsx | movie-grid-skeleton.tsx | empty-state.tsx
    infinite-movie-list.tsx | catalog-results.tsx
    filters/  filter-bar.tsx provider-picker.tsx genre-chips.tsx year-range.tsx sort-select.tsx use-filter-navigation.ts
    details/  movie-hero.tsx watch-providers.tsx trailer-modal.tsx cast-list.tsx
tests/
  setup.ts                              jest-dom, MSW, cleanup, env
  stubs/server-only.ts                  stub para Vitest
  msw/server.ts | msw/handlers.ts       mock HTTP do TMDB (reusado no E2E)
  fixtures/tmdb.ts                      respostas no formato do TMDB
  fixtures/domain.ts                    objetos de domínio para testes de componentes
  helpers/intersection-observer.ts      IntersectionObserver falso (jsdom)
e2e/
  mock-tmdb-server.ts                   servidor HTTP com os handlers MSW
  specs/*.spec.ts                       fluxos Playwright
```

Os testes unitários ficam ao lado do código (`*.test.ts(x)` em `src/`). Arquivos de componente usam `// @vitest-environment jsdom` na primeira linha; o resto roda no ambiente `node`.

---

### Task 1: Scaffold do projeto, ferramentas de teste e CI

**Files:**
- Create: todo o scaffold do `create-next-app` (em `src/app/`, `public/`, configs)
- Create: `.nvmrc`, `.env.example`, `.env.local` (não versionado), `.prettierrc.json`, `.prettierignore`, `vitest.config.mts`, `tests/setup.ts`, `tests/stubs/server-only.ts`, `tests/msw/server.ts`, `tests/msw/handlers.ts`, `.github/workflows/ci.yml`
- Modify: `.gitignore`, `package.json` (scripts), `eslint.config.mjs`, `next.config.ts`, `src/app/page.tsx`

**Interfaces:**
- Produces: scripts `npm run lint | format | format:check | typecheck | test | build`; `tests/msw/server.ts` exporta `server` (MSW `setupServer`); `tests/msw/handlers.ts` exporta `handlers: HttpHandler[]` (vazio por enquanto); alias `@/*` → `src/*`.

- [ ] **Step 1: Confirmar Node 24**

Run: `node -v`
Expected: `v24.x`. Se não for, pare e peça ao usuário os pré-requisitos.

- [ ] **Step 2: Gerar o scaffold numa pasta irmã e copiar para o repositório**

O `create-next-app` recusa pastas com arquivos desconhecidos (`.superpowers/`), por isso o scaffold é gerado ao lado e copiado.

```bash
cd /home/fabricio/Documentos/projetos
npx create-next-app@15 catalogo-filmes-scaffold --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
rsync -a --exclude .git --exclude node_modules --exclude .gitignore catalogo-filmes-scaffold/ catalogo-filmes/
rm -rf catalogo-filmes-scaffold
cd catalogo-filmes
rm -f public/*.svg
npm install
```

- [ ] **Step 3: Substituir `.gitignore`**

```gitignore
# dependências
/node_modules

# next.js
/.next/
/out/
next-env.d.ts
*.tsbuildinfo

# testes
/coverage
/playwright-report/
/test-results/
/blob-report/

# env
.env
.env*.local

# misc
.DS_Store
*.pem
npm-debug.log*
.vercel

# brainstorming visual
.superpowers/
```

- [ ] **Step 4: Criar `.nvmrc`, `.env.example` e `.env.local`**

`.nvmrc`:
```
24
```

`.env.example`:
```bash
# Token "API Read Access Token" do TMDB (https://www.themoviedb.org/settings/api)
TMDB_READ_TOKEN=
# Opcional: sobrescreve a URL da API (usado pelo E2E com o mock)
# TMDB_API_BASE_URL=https://api.themoviedb.org/3
```

`.env.local` (não versionado): copie `.env.example` e preencha `TMDB_READ_TOKEN` com o token do usuário. Se o token ainda não existir, pergunte ao usuário. Ele só será necessário a partir do Step 7 da Task 4.

- [ ] **Step 5: Instalar dependências**

```bash
npm i zod server-only
npm i -D vitest@^3 @vitejs/plugin-react vite-tsconfig-paths jsdom @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom msw prettier eslint-config-prettier
```

- [ ] **Step 6: Configurar Prettier e ESLint**

`.prettierrc.json`:
```json
{ "singleQuote": true, "semi": true, "trailingComma": "all", "printWidth": 100 }
```

`.prettierignore`:
```
.next
node_modules
.superpowers
docs
package-lock.json
coverage
playwright-report
test-results
next-env.d.ts
```

`eslint.config.mjs` (substituir o conteúdo):
```js
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript', 'prettier'),
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'next-env.d.ts',
      'playwright-report/**',
      'test-results/**',
      '.superpowers/**',
    ],
  },
];

export default eslintConfig;
```

Se o scaffold não trouxe `@eslint/eslintrc`, rode `npm i -D @eslint/eslintrc`.

- [ ] **Step 7: Configurar `next.config.ts`**

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'image.tmdb.org', pathname: '/t/p/**' }],
  },
};

export default nextConfig;
```

- [ ] **Step 8: Configurar Vitest**

`vitest.config.mts`:
```ts
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      'server-only': fileURLToPath(new URL('./tests/stubs/server-only.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    clearMocks: true,
    restoreMocks: true,
  },
});
```

`tests/stubs/server-only.ts`:
```ts
// O pacote `server-only` lança erro fora do bundle de servidor do Next; nos testes ele é um no-op.
export {};
```

`tests/msw/handlers.ts`:
```ts
import type { HttpHandler } from 'msw';

export const handlers: HttpHandler[] = [];
```

`tests/msw/server.ts`:
```ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

`tests/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './msw/server';

process.env.TMDB_READ_TOKEN ??= 'test-token';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());
```

- [ ] **Step 9: Scripts do `package.json`**

Deixe o bloco `scripts` assim (mantenha o `dev` que o scaffold gerou, com ou sem `--turbopack`):
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run --passWithNoTests",
  "test:watch": "vitest",
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

- [ ] **Step 10: Página provisória**

`src/app/page.tsx`:
```tsx
export default function Home() {
  return <p>EmCartaz — em construção.</p>;
}
```

- [ ] **Step 11: CI**

`.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm test
      - run: npm run build
      # typecheck depois do build: o build gera next-env.d.ts
      - run: npm run typecheck
```

- [ ] **Step 12: Formatar e verificar tudo**

```bash
npm run format
npm run lint && npm run format:check && npm test && npm run build && npm run typecheck
```
Expected: todos passam (`vitest` informa "No test files found" e sai com 0).

- [ ] **Step 13: Commit**

```bash
git add -A
git status --short   # conferir que .env.local e .superpowers/ NÃO aparecem
git commit -m "chore: scaffold Next.js 15 com Tailwind, Vitest, MSW e CI" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: `lib/filters.ts` — URL ⇄ Filters

**Files:**
- Create: `src/lib/filters.ts`
- Test: `src/lib/filters.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const SORT_OPTIONS: readonly ['popularidade', 'nota', 'lancamento'];
  export type SortOption = 'popularidade' | 'nota' | 'lancamento';
  export type Filters = { providers: number[]; genres: number[]; yearFrom?: number; yearTo?: number; sort: SortOption; query?: string };
  export type SearchParamsInput = Record<string, string | string[] | undefined>;
  export const DEFAULT_FILTERS: Filters;
  export const MIN_YEAR = 1900; export const MAX_YEAR = 2100;
  export function parseFilters(searchParams: SearchParamsInput): Filters;
  export function serializeFilters(filters: Filters): string;   // sem '?'; '' quando tudo é padrão
  export function hasActiveFilters(filters: Filters): boolean;
  export function searchParamsFromQueryString(queryString: string): SearchParamsInput;
  ```

- [ ] **Step 1: Escrever os testes**

`src/lib/filters.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FILTERS,
  hasActiveFilters,
  parseFilters,
  searchParamsFromQueryString,
  serializeFilters,
  type Filters,
} from './filters';

describe('parseFilters', () => {
  it('retorna os padrões para URL vazia', () => {
    expect(parseFilters({})).toEqual(DEFAULT_FILTERS);
  });

  it('lê todos os parâmetros', () => {
    expect(parseFilters({ p: '8,119', g: '27', ano: '2020-2025', ordem: 'nota' })).toEqual({
      providers: [8, 119],
      genres: [27],
      yearFrom: 2020,
      yearTo: 2025,
      sort: 'nota',
    });
  });

  it('descarta IDs inválidos individualmente e remove duplicados', () => {
    expect(parseFilters({ p: '8,abc,-3,0,8.5,,119,8' }).providers).toEqual([8, 119]);
  });

  it('aceita intervalos de ano abertos', () => {
    expect(parseFilters({ ano: '2020-' })).toMatchObject({ yearFrom: 2020, yearTo: undefined });
    expect(parseFilters({ ano: '-1999' })).toMatchObject({ yearFrom: undefined, yearTo: 1999 });
  });

  it('inverte intervalo de ano ao contrário', () => {
    expect(parseFilters({ ano: '2025-2020' })).toMatchObject({ yearFrom: 2020, yearTo: 2025 });
  });

  it('descarta ano malformado ou fora da faixa', () => {
    expect(parseFilters({ ano: 'abc' })).toMatchObject({ yearFrom: undefined, yearTo: undefined });
    expect(parseFilters({ ano: '1800-2020' })).toMatchObject({ yearFrom: undefined, yearTo: 2020 });
  });

  it('usa a ordenação padrão quando o valor é desconhecido', () => {
    expect(parseFilters({ ordem: 'aleatorio' }).sort).toBe('popularidade');
  });

  it('usa o primeiro valor quando o parâmetro se repete', () => {
    expect(parseFilters({ ordem: ['nota', 'lancamento'] }).sort).toBe('nota');
  });

  it('modo busca ignora os demais filtros e apara o termo', () => {
    expect(parseFilters({ q: '  duna ', p: '8', ordem: 'nota' })).toEqual({
      ...DEFAULT_FILTERS,
      query: 'duna',
    });
  });

  it('ignora busca vazia', () => {
    expect(parseFilters({ q: '   ', p: '8' }).query).toBeUndefined();
    expect(parseFilters({ q: '   ', p: '8' }).providers).toEqual([8]);
  });

  it('limita o termo de busca a 100 caracteres', () => {
    expect(parseFilters({ q: 'a'.repeat(300) }).query).toHaveLength(100);
  });
});

describe('serializeFilters', () => {
  it('retorna string vazia para os padrões', () => {
    expect(serializeFilters(DEFAULT_FILTERS)).toBe('');
  });

  it('gera a URL legível do exemplo da spec', () => {
    const filters: Filters = { providers: [8, 119], genres: [27], yearFrom: 2020, yearTo: 2025, sort: 'nota' };
    expect(serializeFilters(filters)).toBe('p=8,119&g=27&ano=2020-2025&ordem=nota');
  });

  it('serializa intervalos abertos', () => {
    expect(serializeFilters({ ...DEFAULT_FILTERS, yearFrom: 2020 })).toBe('ano=2020-');
    expect(serializeFilters({ ...DEFAULT_FILTERS, yearTo: 1999 })).toBe('ano=-1999');
  });

  it('em modo busca serializa só o termo, codificado', () => {
    expect(serializeFilters({ ...DEFAULT_FILTERS, providers: [8], query: 'velozes & furiosos #9' })).toBe(
      'q=velozes%20%26%20furiosos%20%239',
    );
  });
});

describe('ida e volta', () => {
  const cases: Filters[] = [
    DEFAULT_FILTERS,
    { providers: [8, 119], genres: [27, 35], yearFrom: 2020, yearTo: 2025, sort: 'lancamento' },
    { providers: [], genres: [], yearTo: 1980, sort: 'nota' },
    { ...DEFAULT_FILTERS, query: 'ação & aventura' },
  ];

  it.each(cases)('parse(serialize(%j)) é idêntico', (filters) => {
    const roundTrip = parseFilters(searchParamsFromQueryString(serializeFilters(filters)));
    expect(roundTrip).toEqual(filters);
  });
});

describe('hasActiveFilters', () => {
  it('é falso só para os padrões', () => {
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, sort: 'nota' })).toBe(true);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, query: 'duna' })).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/filters.test.ts`
Expected: FAIL, "Failed to resolve import './filters'".

- [ ] **Step 3: Implementar**

`src/lib/filters.ts`:
```ts
import { z } from 'zod';

export const SORT_OPTIONS = ['popularidade', 'nota', 'lancamento'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export type Filters = {
  providers: number[];
  genres: number[];
  yearFrom?: number;
  yearTo?: number;
  sort: SortOption;
  query?: string;
};

export type SearchParamsInput = Record<string, string | string[] | undefined>;

export const DEFAULT_FILTERS: Filters = { providers: [], genres: [], sort: 'popularidade' };

export const MIN_YEAR = 1900;
export const MAX_YEAR = 2100;
const MAX_QUERY_LENGTH = 100;

const idSchema = z.coerce.number().int().positive();
const yearSchema = z.coerce.number().int().min(MIN_YEAR).max(MAX_YEAR);
const sortSchema = z.enum(SORT_OPTIONS);

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseIdList(raw: string | undefined): number[] {
  if (!raw) return [];
  const ids = raw.split(',').flatMap((part) => {
    const trimmed = part.trim();
    if (!trimmed) return [];
    const result = idSchema.safeParse(trimmed);
    return result.success ? [result.data] : [];
  });
  return [...new Set(ids)];
}

function parseYear(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const result = yearSchema.safeParse(raw);
  return result.success ? result.data : undefined;
}

function parseYearRange(raw: string | undefined): Pick<Filters, 'yearFrom' | 'yearTo'> {
  const match = raw?.match(/^(\d{4})?-(\d{4})?$/);
  if (!match) return {};
  let yearFrom = parseYear(match[1]);
  let yearTo = parseYear(match[2]);
  if (yearFrom !== undefined && yearTo !== undefined && yearFrom > yearTo) {
    [yearFrom, yearTo] = [yearTo, yearFrom];
  }
  return { yearFrom, yearTo };
}

export function parseFilters(searchParams: SearchParamsInput): Filters {
  const query = first(searchParams.q)?.trim().slice(0, MAX_QUERY_LENGTH);
  if (query) return { providers: [], genres: [], sort: DEFAULT_FILTERS.sort, query };

  const sort = sortSchema.safeParse(first(searchParams.ordem));
  return {
    providers: parseIdList(first(searchParams.p)),
    genres: parseIdList(first(searchParams.g)),
    ...parseYearRange(first(searchParams.ano)),
    sort: sort.success ? sort.data : DEFAULT_FILTERS.sort,
  };
}

export function serializeFilters(filters: Filters): string {
  const query = filters.query?.trim();
  if (query) return `q=${encodeURIComponent(query)}`;

  const parts: string[] = [];
  if (filters.providers.length) parts.push(`p=${filters.providers.join(',')}`);
  if (filters.genres.length) parts.push(`g=${filters.genres.join(',')}`);
  if (filters.yearFrom !== undefined || filters.yearTo !== undefined) {
    parts.push(`ano=${filters.yearFrom ?? ''}-${filters.yearTo ?? ''}`);
  }
  if (filters.sort !== DEFAULT_FILTERS.sort) parts.push(`ordem=${filters.sort}`);
  return parts.join('&');
}

export function hasActiveFilters(filters: Filters): boolean {
  return serializeFilters(filters) !== '';
}

export function searchParamsFromQueryString(queryString: string): SearchParamsInput {
  return Object.fromEntries(new URLSearchParams(queryString));
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/lib/filters.test.ts`
Expected: PASS em todos. Os casos de ida e volta usam `toEqual`, que trata chave ausente e `undefined` como iguais.

- [ ] **Step 5: Commit**

```bash
git add src/lib/filters.ts src/lib/filters.test.ts
git commit -m "feat: parse e serialização de filtros na URL" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Cliente HTTP do TMDB (`tmdbFetch` + `TmdbError`)

**Files:**
- Create: `src/lib/tmdb/client.ts`
- Test: `src/lib/tmdb/client.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export class TmdbError extends Error { readonly status: number }
  export type TmdbParams = Record<string, string | number | undefined>;
  export function tmdbFetch<T>(path: string, params: TmdbParams, options: { revalidate: number }): Promise<T>;
  ```
  - Base URL: `process.env.TMDB_API_BASE_URL ?? 'https://api.themoviedb.org/3'`, lida a cada chamada.
  - Header `Authorization: Bearer ${TMDB_READ_TOKEN}`. Sem token, lança `Error('TMDB_READ_TOKEN não está configurado')`.
  - Parâmetros `undefined` são omitidos.
  - 429: espera `Retry-After` segundos (padrão 1, máximo 10) e tenta mais uma vez.
  - Resposta não-ok: lança `TmdbError(status)`. Registra `console.error` para qualquer status exceto 404.

- [ ] **Step 1: Escrever os testes**

`src/lib/tmdb/client.test.ts`:
```ts
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../../tests/msw/server';
import { TmdbError, tmdbFetch } from './client';

const opts = { revalidate: 60 };

describe('tmdbFetch', () => {
  afterEach(() => {
    delete process.env.TMDB_API_BASE_URL;
    process.env.TMDB_READ_TOKEN = 'test-token';
  });

  it('envia o token e os parâmetros definidos', async () => {
    let captured: Request | undefined;
    server.use(
      http.get('*/3/teste', ({ request }) => {
        captured = request;
        return HttpResponse.json({ ok: true });
      }),
    );

    const data = await tmdbFetch<{ ok: boolean }>('/teste', { a: '1', b: 2, c: undefined }, opts);

    expect(data).toEqual({ ok: true });
    expect(captured!.headers.get('authorization')).toBe('Bearer test-token');
    const url = new URL(captured!.url);
    expect(url.origin).toBe('https://api.themoviedb.org');
    expect(url.searchParams.get('a')).toBe('1');
    expect(url.searchParams.get('b')).toBe('2');
    expect(url.searchParams.has('c')).toBe(false);
  });

  it('respeita TMDB_API_BASE_URL', async () => {
    process.env.TMDB_API_BASE_URL = 'http://localhost:4010/3';
    server.use(http.get('http://localhost:4010/3/teste', () => HttpResponse.json({ mock: true })));
    await expect(tmdbFetch('/teste', {}, opts)).resolves.toEqual({ mock: true });
  });

  it('lança erro claro sem token', async () => {
    delete process.env.TMDB_READ_TOKEN;
    await expect(tmdbFetch('/teste', {}, opts)).rejects.toThrow('TMDB_READ_TOKEN não está configurado');
  });

  it('404 vira TmdbError sem registrar no log', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    server.use(http.get('*/3/teste', () => HttpResponse.json({}, { status: 404 })));

    const error = await tmdbFetch('/teste', {}, opts).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(TmdbError);
    expect((error as TmdbError).status).toBe(404);
    expect(log).not.toHaveBeenCalled();
  });

  it('500 vira TmdbError e é registrado no log sem vazar o token', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    server.use(http.get('*/3/teste', () => HttpResponse.json({}, { status: 500 })));

    await expect(tmdbFetch('/teste', {}, opts)).rejects.toMatchObject({ status: 500 });
    expect(log).toHaveBeenCalledOnce();
    expect(String(log.mock.calls[0])).not.toContain('test-token');
  });

  it('tenta de novo uma vez após 429', async () => {
    let calls = 0;
    server.use(
      http.get('*/3/teste', () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json({}, { status: 429, headers: { 'Retry-After': '0' } })
          : HttpResponse.json({ ok: true });
      }),
    );

    await expect(tmdbFetch('/teste', {}, opts)).resolves.toEqual({ ok: true });
    expect(calls).toBe(2);
  });

  it('desiste após o segundo 429', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let calls = 0;
    server.use(
      http.get('*/3/teste', () => {
        calls += 1;
        return HttpResponse.json({}, { status: 429, headers: { 'Retry-After': '0' } });
      }),
    );

    await expect(tmdbFetch('/teste', {}, opts)).rejects.toMatchObject({ status: 429 });
    expect(calls).toBe(2);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/tmdb/client.test.ts`
Expected: FAIL, "Failed to resolve import './client'".

- [ ] **Step 3: Implementar**

`src/lib/tmdb/client.ts`:
```ts
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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/lib/tmdb/client.test.ts`
Expected: PASS (7 testes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/tmdb/client.ts src/lib/tmdb/client.test.ts
git commit -m "feat: cliente HTTP do TMDB com retry em 429 e TmdbError" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Tipos, fixtures e dados do catálogo (provedores, gêneros, discover)

**Files:**
- Create: `src/lib/tmdb/config.ts`, `src/lib/tmdb/types.ts`, `src/lib/tmdb/mappers.ts`, `src/lib/tmdb/movies.ts`, `tests/fixtures/tmdb.ts`
- Modify: `tests/msw/handlers.ts`
- Test: `src/lib/tmdb/mappers.test.ts`, `src/lib/tmdb/movies.test.ts`

**Interfaces:**
- Consumes: `tmdbFetch`, `TmdbError` (Task 3); `Filters`, `SortOption` (Task 2).
- Produces (tipos de domínio em `@/lib/tmdb/types`):
  ```ts
  export type Movie = { id: number; title: string; posterPath: string | null; releaseYear: number | null; voteAverage: number; genreIds: number[] };
  export type MoviePage = { movies: Movie[]; page: number; hasMore: boolean };
  export type Provider = { id: number; name: string; logoPath: string | null };
  export type Genre = { id: number; name: string };
  export type CastMember = { id: number; name: string; character: string; profilePath: string | null };
  export type MovieDetails = { id: number; title: string; overview: string; posterPath: string | null; backdropPath: string | null; releaseYear: number | null; runtime: number | null; voteAverage: number; genres: Genre[]; cast: CastMember[]; trailerKey: string | null; streamingProviders: Provider[]; watchLink: string | null };
  ```
  - `@/lib/tmdb/movies`: `getProviders(): Promise<Provider[]>`, `getGenres(): Promise<Genre[]>`, `discoverStreaming(filters: Filters, page: number): Promise<MoviePage>`.
  - `@/lib/tmdb/config`: `WATCH_REGION`, `LANGUAGE`, `MAX_PAGE`, `MIN_VOTES_FOR_RATING_SORT`, `REVALIDATE`, `FEATURED_PROVIDER_IDS`.
  - `@/lib/tmdb/mappers`: `releaseYearOf`, `toMovie`, `toProvider`, `toGenre`.
  - Fixtures em `tests/fixtures/tmdb.ts` e handlers MSW padrão em `tests/msw/handlers.ts`, reaproveitados pelas Tasks 5, 6 e 12.

- [ ] **Step 1: Constantes**

`src/lib/tmdb/config.ts`:
```ts
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
```

- [ ] **Step 2: Tipos**

`src/lib/tmdb/types.ts`:
```ts
// ---------- Formato cru do TMDB (somente os campos usados) ----------

export type TmdbPagedResponse<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

export type TmdbMovieResult = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
};

export type TmdbProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority: number;
};

export type TmdbProviderListResponse = { results: TmdbProvider[] };

export type TmdbGenre = { id: number; name: string };
export type TmdbGenreListResponse = { genres: TmdbGenre[] };

export type TmdbWatchProviderRegion = {
  link?: string;
  flatrate?: TmdbProvider[];
  rent?: TmdbProvider[];
  buy?: TmdbProvider[];
};

export type TmdbWatchProvidersResponse = {
  id?: number;
  results: Partial<Record<string, TmdbWatchProviderRegion>>;
};

export type TmdbVideo = { key: string; site: string; type: string; iso_639_1: string };

export type TmdbCastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
};

export type TmdbMovieDetailsResponse = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number | null;
  vote_average: number;
  genres: TmdbGenre[];
  credits?: { cast: TmdbCastMember[] };
  videos?: { results: TmdbVideo[] };
  'watch/providers'?: TmdbWatchProvidersResponse;
};

// ---------- Tipos de domínio (o que a UI consome) ----------

export type Movie = {
  id: number;
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
  voteAverage: number;
  genreIds: number[];
};

export type MoviePage = { movies: Movie[]; page: number; hasMore: boolean };

export type Provider = { id: number; name: string; logoPath: string | null };

export type Genre = { id: number; name: string };

export type CastMember = {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
};

export type MovieDetails = {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseYear: number | null;
  runtime: number | null;
  voteAverage: number;
  genres: Genre[];
  cast: CastMember[];
  trailerKey: string | null;
  streamingProviders: Provider[];
  watchLink: string | null;
};
```

- [ ] **Step 3: Testes dos mappers**

`src/lib/tmdb/mappers.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { releaseYearOf, toMovie, toProvider } from './mappers';

describe('releaseYearOf', () => {
  it('extrai o ano', () => expect(releaseYearOf('2021-09-15')).toBe(2021));
  it('retorna null para data vazia ou inválida', () => {
    expect(releaseYearOf('')).toBeNull();
    expect(releaseYearOf('xx')).toBeNull();
  });
});

describe('toMovie', () => {
  it('mapeia o resultado cru para o domínio', () => {
    expect(
      toMovie({ id: 1, title: 'A', poster_path: '/a.jpg', release_date: '2020-01-02', vote_average: 7.25, genre_ids: [18] }),
    ).toEqual({ id: 1, title: 'A', posterPath: '/a.jpg', releaseYear: 2020, voteAverage: 7.25, genreIds: [18] });
  });
});

describe('toProvider', () => {
  it('mapeia o provedor cru', () => {
    expect(toProvider({ provider_id: 8, provider_name: 'Netflix', logo_path: '/n.jpg', display_priority: 1 })).toEqual({
      id: 8,
      name: 'Netflix',
      logoPath: '/n.jpg',
    });
  });
});
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `npx vitest run src/lib/tmdb/mappers.test.ts`
Expected: FAIL, "Failed to resolve import './mappers'".

- [ ] **Step 5: Implementar os mappers**

`src/lib/tmdb/mappers.ts`:
```ts
import type { Genre, Movie, Provider, TmdbGenre, TmdbMovieResult, TmdbProvider } from './types';

export function releaseYearOf(date: string | undefined): number | null {
  const year = Number(date?.slice(0, 4));
  return Number.isInteger(year) && year > 0 ? year : null;
}

export function toMovie(raw: TmdbMovieResult): Movie {
  return {
    id: raw.id,
    title: raw.title,
    posterPath: raw.poster_path,
    releaseYear: releaseYearOf(raw.release_date),
    voteAverage: raw.vote_average,
    genreIds: raw.genre_ids,
  };
}

export function toProvider(raw: TmdbProvider): Provider {
  return { id: raw.provider_id, name: raw.provider_name, logoPath: raw.logo_path };
}

export function toGenre(raw: TmdbGenre): Genre {
  return { id: raw.id, name: raw.name };
}
```

Run: `npx vitest run src/lib/tmdb/mappers.test.ts`
Expected: PASS.

- [ ] **Step 6: Fixtures e handlers MSW padrão**

`tests/fixtures/tmdb.ts`:
```ts
import type {
  TmdbCastMember,
  TmdbGenreListResponse,
  TmdbMovieDetailsResponse,
  TmdbMovieResult,
  TmdbPagedResponse,
  TmdbProvider,
  TmdbProviderListResponse,
  TmdbWatchProvidersResponse,
} from '@/lib/tmdb/types';

// Respostas no formato real do TMDB, reduzidas aos campos usados.

export const netflix: TmdbProvider = { provider_id: 8, provider_name: 'Netflix', logo_path: '/netflix.jpg', display_priority: 2 };
export const prime: TmdbProvider = { provider_id: 119, provider_name: 'Amazon Prime Video', logo_path: '/prime.jpg', display_priority: 3 };
export const disney: TmdbProvider = { provider_id: 337, provider_name: 'Disney Plus', logo_path: '/disney.jpg', display_priority: 4 };
export const max: TmdbProvider = { provider_id: 1899, provider_name: 'Max', logo_path: '/max.jpg', display_priority: 5 };
export const globoplay: TmdbProvider = { provider_id: 307, provider_name: 'Globoplay', logo_path: '/globoplay.jpg', display_priority: 6 };
export const googlePlay: TmdbProvider = { provider_id: 3, provider_name: 'Google Play Movies', logo_path: '/gplay.jpg', display_priority: 1 };

// Inclui uma loja (Google Play) que NÃO deve aparecer na faixa.
export const providersResponse: TmdbProviderListResponse = {
  results: [googlePlay, netflix, prime, disney, max, globoplay],
};

// Ordem embaralhada de propósito: getGenres deve ordenar por nome.
export const genresResponse: TmdbGenreListResponse = {
  genres: [
    { id: 27, name: 'Terror' },
    { id: 28, name: 'Ação' },
    { id: 18, name: 'Drama' },
    { id: 878, name: 'Ficção científica' },
    { id: 35, name: 'Comédia' },
    { id: 12, name: 'Aventura' },
  ],
};

export function makeMovieResult(id: number, overrides: Partial<TmdbMovieResult> = {}): TmdbMovieResult {
  return {
    id,
    title: `Filme ${id}`,
    poster_path: `/poster-${id}.jpg`,
    release_date: '2023-05-10',
    vote_average: 7.1,
    genre_ids: [18],
    ...overrides,
  };
}

/** Página do discover padrão: 20 filmes por página, IDs 1001… */
export function discoverPage(page: number, totalPages = 2): TmdbPagedResponse<TmdbMovieResult> {
  const start = 1000 + (page - 1) * 20;
  return {
    page,
    results: Array.from({ length: 20 }, (_, i) => makeMovieResult(start + i + 1)),
    total_pages: totalPages,
    total_results: totalPages * 20,
  };
}

/** Resposta do discover quando o filtro inclui Terror (27). */
export const horrorDiscoverResponse: TmdbPagedResponse<TmdbMovieResult> = {
  page: 1,
  results: [1, 2, 3].map((n) => makeMovieResult(2700 + n, { title: `Terror ${n}`, genre_ids: [27] })),
  total_pages: 1,
  total_results: 3,
};

export const emptyPage: TmdbPagedResponse<TmdbMovieResult> = {
  page: 1,
  results: [],
  total_pages: 0,
  total_results: 0,
};

// Busca "duna": só 438631 está em flatrate no BR.
export const dunaSearchResponse: TmdbPagedResponse<TmdbMovieResult> = {
  page: 1,
  results: [
    makeMovieResult(438631, { title: 'Duna', release_date: '2021-09-15', genre_ids: [878, 12], vote_average: 7.8 }),
    makeMovieResult(693134, { title: 'Duna: Parte Dois', release_date: '2024-02-27', genre_ids: [878, 12] }),
    makeMovieResult(841, { title: 'Duna', release_date: '1984-12-14', genre_ids: [878] }),
  ],
  total_pages: 1,
  total_results: 3,
};

export const watchProvidersById: Record<string, TmdbWatchProvidersResponse> = {
  '438631': {
    id: 438631,
    results: { BR: { link: 'https://www.themoviedb.org/movie/438631-dune/watch?locale=BR', flatrate: [max] } },
  },
  '693134': {
    id: 693134,
    results: { BR: { link: 'https://www.themoviedb.org/movie/693134/watch?locale=BR', rent: [googlePlay] } },
  },
  '841': {
    id: 841,
    results: { US: { link: 'https://www.themoviedb.org/movie/841/watch?locale=US', flatrate: [max] } },
  },
};

const duneCast: TmdbCastMember[] = Array.from({ length: 12 }, (_, i) => ({
  id: 100 + i,
  name: `Ator ${i + 1}`,
  character: `Personagem ${i + 1}`,
  profile_path: i === 0 ? null : `/ator-${i + 1}.jpg`,
  order: i,
}));

export const duneDetails: TmdbMovieDetailsResponse = {
  id: 438631,
  title: 'Duna',
  overview: 'Paul Atreides, um jovem brilhante, precisa viajar para o planeta mais perigoso do universo.',
  poster_path: '/duna-poster.jpg',
  backdrop_path: '/duna-backdrop.jpg',
  release_date: '2021-09-15',
  runtime: 155,
  vote_average: 7.8,
  genres: [
    { id: 878, name: 'Ficção científica' },
    { id: 12, name: 'Aventura' },
  ],
  credits: { cast: [...duneCast].reverse() }, // fora de ordem de propósito
  videos: {
    results: [
      { key: 'teaser-pt', site: 'YouTube', type: 'Teaser', iso_639_1: 'pt' },
      { key: 'trailer-en', site: 'YouTube', type: 'Trailer', iso_639_1: 'en' },
      { key: 'vimeo-pt', site: 'Vimeo', type: 'Trailer', iso_639_1: 'pt' },
      { key: 'trailer-pt', site: 'YouTube', type: 'Trailer', iso_639_1: 'pt' },
    ],
  },
  'watch/providers': watchProvidersById['438631'],
};

export const detailsById: Record<string, TmdbMovieDetailsResponse> = { '438631': duneDetails };

export const notFoundBody = {
  success: false,
  status_code: 34,
  status_message: 'The resource you requested could not be found.',
};
```

`tests/msw/handlers.ts` (substituir):
```ts
import { http, HttpResponse, type HttpHandler } from 'msw';
import {
  detailsById,
  discoverPage,
  dunaSearchResponse,
  emptyPage,
  genresResponse,
  horrorDiscoverResponse,
  notFoundBody,
  providersResponse,
  watchProvidersById,
} from '../fixtures/tmdb';

// `*/3` casa tanto com https://api.themoviedb.org/3 (testes) quanto com o mock local do E2E.
const API = '*/3';

export const handlers: HttpHandler[] = [
  http.get(`${API}/watch/providers/movie`, () => HttpResponse.json(providersResponse)),

  http.get(`${API}/genre/movie/list`, () => HttpResponse.json(genresResponse)),

  http.get(`${API}/discover/movie`, ({ request }) => {
    const params = new URL(request.url).searchParams;
    if (params.get('with_genres')?.split(',').includes('27')) {
      return HttpResponse.json(horrorDiscoverResponse);
    }
    return HttpResponse.json(discoverPage(Number(params.get('page') ?? '1')));
  }),

  http.get(`${API}/search/movie`, ({ request }) => {
    const query = new URL(request.url).searchParams.get('query')?.toLowerCase() ?? '';
    return HttpResponse.json(query.includes('duna') ? dunaSearchResponse : emptyPage);
  }),

  http.get(`${API}/movie/:id/watch/providers`, ({ params }) => {
    const id = String(params.id);
    return HttpResponse.json(watchProvidersById[id] ?? { id: Number(id), results: {} });
  }),

  http.get(`${API}/movie/:id`, ({ params }) => {
    const details = detailsById[String(params.id)];
    return details ? HttpResponse.json(details) : HttpResponse.json(notFoundBody, { status: 404 });
  }),
];
```

- [ ] **Step 7: Conferir a allowlist de provedores contra a API real**

Requer `TMDB_READ_TOKEN` em `.env.local`. Se ainda não existir, peça ao usuário antes de seguir.

```bash
set -a; source .env.local; set +a
curl -s -H "Authorization: Bearer $TMDB_READ_TOKEN" "https://api.themoviedb.org/3/watch/providers/movie?watch_region=BR&language=pt-BR" \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const r=JSON.parse(s).results;for(const id of [8,119,1899,337,307,350,531,11]){const p=r.find(x=>x.provider_id===id);console.log(id,p?p.provider_name:"AUSENTE")}})'
```
Expected: cada ID imprime um nome de serviço de assinatura. Se algum aparecer `AUSENTE` ou com nome inesperado (o TMDB às vezes troca IDs, como aconteceu de HBO Max para Max), procure o ID correto na mesma resposta (`grep -i` pelo nome) e atualize `FEATURED_PROVIDER_IDS`. Registre a correção na mensagem de commit. Se mudar algum ID, atualize também `tests/fixtures/tmdb.ts` (os provedores de `providersResponse`) e as expectativas de `getProviders` e `discoverStreaming` (`8|119|1899|337|307`) no Step 8.

- [ ] **Step 8: Escrever os testes de `movies.ts` (catálogo)**

`src/lib/tmdb/movies.test.ts`:
```ts
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { discoverPage } from '../../../tests/fixtures/tmdb';
import { server } from '../../../tests/msw/server';
import { DEFAULT_FILTERS, type Filters } from '../filters';
import { discoverStreaming, getGenres, getProviders } from './movies';

function captureDiscover(response = discoverPage(1)) {
  const calls: URLSearchParams[] = [];
  server.use(
    http.get('*/3/discover/movie', ({ request }) => {
      calls.push(new URL(request.url).searchParams);
      return HttpResponse.json(response);
    }),
  );
  return calls;
}

describe('getProviders', () => {
  it('mantém só a allowlist, na ordem da allowlist, e descarta lojas', async () => {
    const providers = await getProviders();
    expect(providers.map((p) => p.name)).toEqual(['Netflix', 'Amazon Prime Video', 'Max', 'Disney Plus', 'Globoplay']);
    expect(providers[0]).toEqual({ id: 8, name: 'Netflix', logoPath: '/netflix.jpg' });
  });

  it('pede a lista do Brasil em pt-BR', async () => {
    let params: URLSearchParams | undefined;
    server.use(
      http.get('*/3/watch/providers/movie', ({ request }) => {
        params = new URL(request.url).searchParams;
        return HttpResponse.json({ results: [] });
      }),
    );
    await getProviders();
    expect(params!.get('watch_region')).toBe('BR');
    expect(params!.get('language')).toBe('pt-BR');
  });
});

describe('getGenres', () => {
  it('retorna os gêneros ordenados por nome', async () => {
    const genres = await getGenres();
    expect(genres.map((g) => g.name)).toEqual(['Ação', 'Aventura', 'Comédia', 'Drama', 'Ficção científica', 'Terror']);
  });
});

describe('discoverStreaming', () => {
  it('sem plataforma selecionada usa todas as plataformas principais', async () => {
    const calls = captureDiscover();
    await discoverStreaming(DEFAULT_FILTERS, 1);

    const params = calls[0];
    expect(params.get('with_watch_providers')).toBe('8|119|1899|337|307');
    expect(params.get('with_watch_monetization_types')).toBe('flatrate');
    expect(params.get('watch_region')).toBe('BR');
    expect(params.get('language')).toBe('pt-BR');
    expect(params.get('sort_by')).toBe('popularity.desc');
    expect(params.get('page')).toBe('1');
    expect(params.has('with_genres')).toBe(false);
    expect(params.has('vote_count.gte')).toBe(false);
  });

  it('traduz todos os filtros para a query do TMDB', async () => {
    const calls = captureDiscover();
    const filters: Filters = { providers: [8, 119], genres: [27, 35], yearFrom: 2020, yearTo: 2025, sort: 'lancamento' };
    await discoverStreaming(filters, 3);

    const params = calls[0];
    expect(params.get('with_watch_providers')).toBe('8|119');
    expect(params.get('with_genres')).toBe('27,35');
    expect(params.get('primary_release_date.gte')).toBe('2020-01-01');
    expect(params.get('primary_release_date.lte')).toBe('2025-12-31');
    expect(params.get('sort_by')).toBe('primary_release_date.desc');
    expect(params.get('page')).toBe('3');
  });

  it('ordenação por nota exige um mínimo de votos', async () => {
    const calls = captureDiscover();
    await discoverStreaming({ ...DEFAULT_FILTERS, sort: 'nota' }, 1);
    expect(calls[0].get('sort_by')).toBe('vote_average.desc');
    expect(calls[0].get('vote_count.gte')).toBe('200');
  });

  it('mapeia os filmes e informa se há mais páginas', async () => {
    const first = await discoverStreaming(DEFAULT_FILTERS, 1);
    expect(first.movies).toHaveLength(20);
    expect(first.movies[0]).toEqual({
      id: 1001,
      title: 'Filme 1001',
      posterPath: '/poster-1001.jpg',
      releaseYear: 2023,
      voteAverage: 7.1,
      genreIds: [18],
    });
    expect(first).toMatchObject({ page: 1, hasMore: true });

    const last = await discoverStreaming(DEFAULT_FILTERS, 2);
    expect(last).toMatchObject({ page: 2, hasMore: false });
  });

  it('para na página 500 mesmo que o TMDB diga que há mais', async () => {
    captureDiscover({ ...discoverPage(500, 900) });
    const page = await discoverStreaming(DEFAULT_FILTERS, 500);
    expect(page.hasMore).toBe(false);
  });

  it('página fora de 1..500 devolve vazio sem chamar a API', async () => {
    const calls = captureDiscover();
    for (const page of [0, -1, 501, 1.5, Number.NaN]) {
      expect(await discoverStreaming(DEFAULT_FILTERS, page)).toEqual({ movies: [], page, hasMore: false });
    }
    expect(calls).toHaveLength(0);
  });
});
```

- [ ] **Step 9: Rodar e ver falhar**

Run: `npx vitest run src/lib/tmdb/movies.test.ts`
Expected: FAIL, "Failed to resolve import './movies'".

- [ ] **Step 10: Implementar `movies.ts` (catálogo)**

`src/lib/tmdb/movies.ts`:
```ts
import 'server-only';
import type { Filters, SortOption } from '../filters';
import { tmdbFetch } from './client';
import {
  FEATURED_PROVIDER_IDS,
  LANGUAGE,
  MAX_PAGE,
  MIN_VOTES_FOR_RATING_SORT,
  REVALIDATE,
  WATCH_REGION,
} from './config';
import { toGenre, toMovie, toProvider } from './mappers';
import type {
  Genre,
  MoviePage,
  Provider,
  TmdbGenreListResponse,
  TmdbMovieResult,
  TmdbPagedResponse,
  TmdbProviderListResponse,
} from './types';

const SORT_BY: Record<SortOption, string> = {
  popularidade: 'popularity.desc',
  nota: 'vote_average.desc',
  lancamento: 'primary_release_date.desc',
};

export async function getProviders(): Promise<Provider[]> {
  const data = await tmdbFetch<TmdbProviderListResponse>(
    '/watch/providers/movie',
    { watch_region: WATCH_REGION, language: LANGUAGE },
    { revalidate: REVALIDATE.catalogMetadata },
  );
  const byId = new Map(data.results.map((provider) => [provider.provider_id, provider]));
  return FEATURED_PROVIDER_IDS.flatMap((id) => {
    const provider = byId.get(id);
    return provider ? [toProvider(provider)] : [];
  });
}

export async function getGenres(): Promise<Genre[]> {
  const data = await tmdbFetch<TmdbGenreListResponse>(
    '/genre/movie/list',
    { language: LANGUAGE },
    { revalidate: REVALIDATE.catalogMetadata },
  );
  return data.genres.map(toGenre).sort((a, b) => a.name.localeCompare(b.name, LANGUAGE));
}

export async function discoverStreaming(filters: Filters, page: number): Promise<MoviePage> {
  if (!Number.isInteger(page) || page < 1 || page > MAX_PAGE) {
    return { movies: [], page, hasMore: false };
  }

  const providerIds = filters.providers.length
    ? filters.providers
    : (await getProviders()).map((provider) => provider.id);

  const data = await tmdbFetch<TmdbPagedResponse<TmdbMovieResult>>(
    '/discover/movie',
    {
      language: LANGUAGE,
      watch_region: WATCH_REGION,
      with_watch_monetization_types: 'flatrate',
      with_watch_providers: providerIds.length ? providerIds.join('|') : undefined,
      with_genres: filters.genres.length ? filters.genres.join(',') : undefined,
      'primary_release_date.gte': filters.yearFrom ? `${filters.yearFrom}-01-01` : undefined,
      'primary_release_date.lte': filters.yearTo ? `${filters.yearTo}-12-31` : undefined,
      sort_by: SORT_BY[filters.sort],
      'vote_count.gte': filters.sort === 'nota' ? MIN_VOTES_FOR_RATING_SORT : undefined,
      include_adult: 'false',
      page,
    },
    { revalidate: REVALIDATE.listings },
  );

  return {
    movies: data.results.map(toMovie),
    page: data.page,
    hasMore: data.page < Math.min(data.total_pages, MAX_PAGE),
  };
}
```

- [ ] **Step 11: Rodar e ver passar**

Run: `npx vitest run src/lib/tmdb`
Expected: PASS (client, mappers e movies).

- [ ] **Step 12: Commit**

```bash
git add src/lib/tmdb tests/fixtures tests/msw
git commit -m "feat: provedores, gêneros e discover de filmes em streaming no BR" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Busca restrita a streaming (`searchStreaming`)

**Files:**
- Modify: `src/lib/tmdb/movies.ts`
- Test: `src/lib/tmdb/search.test.ts`

**Interfaces:**
- Consumes: `tmdbFetch`, `TmdbError`, `toMovie`, config (Tasks 3 e 4); fixtures `dunaSearchResponse` e `watchProvidersById`.
- Produces: `searchStreaming(query: string): Promise<Movie[]>`. Mantém a ordem de relevância do TMDB e só inclui filmes com `results.BR.flatrate` não vazio. Um 404 nos provedores de um filme conta como "não disponível"; qualquer outro erro é propagado.

- [ ] **Step 1: Escrever os testes**

`src/lib/tmdb/search.test.ts`:
```ts
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { makeMovieResult } from '../../../tests/fixtures/tmdb';
import { server } from '../../../tests/msw/server';
import { searchStreaming } from './movies';

describe('searchStreaming', () => {
  it('mantém só os resultados em flatrate no Brasil', async () => {
    const movies = await searchStreaming('duna');
    expect(movies.map((m) => [m.id, m.title, m.releaseYear])).toEqual([[438631, 'Duna', 2021]]);
  });

  it('envia o termo aparado, em pt-BR, região BR, só a primeira página', async () => {
    let params: URLSearchParams | undefined;
    server.use(
      http.get('*/3/search/movie', ({ request }) => {
        params = new URL(request.url).searchParams;
        return HttpResponse.json({ page: 1, results: [], total_pages: 0, total_results: 0 });
      }),
    );
    await searchStreaming('  duna  ');
    expect(params!.get('query')).toBe('duna');
    expect(params!.get('language')).toBe('pt-BR');
    expect(params!.get('region')).toBe('BR');
    expect(params!.get('page')).toBe('1');
  });

  it('termo vazio não chama a API', async () => {
    const spy = vi.fn();
    server.use(http.get('*/3/search/movie', spy));
    expect(await searchStreaming('   ')).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it('preserva a ordem de relevância', async () => {
    server.use(
      http.get('*/3/search/movie', () =>
        HttpResponse.json({ page: 1, results: [makeMovieResult(2), makeMovieResult(1)], total_pages: 1, total_results: 2 }),
      ),
      http.get('*/3/movie/:id/watch/providers', ({ params }) =>
        HttpResponse.json({ id: Number(params.id), results: { BR: { flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: null, display_priority: 1 }] } } }),
      ),
    );
    expect((await searchStreaming('x')).map((m) => m.id)).toEqual([2, 1]);
  });

  it('trata 404 nos provedores de um filme como indisponível', async () => {
    server.use(http.get('*/3/movie/:id/watch/providers', () => HttpResponse.json({}, { status: 404 })));
    expect(await searchStreaming('duna')).toEqual([]);
  });

  it('propaga outros erros', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    server.use(http.get('*/3/movie/:id/watch/providers', () => HttpResponse.json({}, { status: 500 })));
    await expect(searchStreaming('duna')).rejects.toMatchObject({ status: 500 });
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/tmdb/search.test.ts`
Expected: FAIL, "searchStreaming is not a function" (ou erro de export inexistente).

- [ ] **Step 3: Implementar**

Em `src/lib/tmdb/movies.ts`:
- Troque `import { tmdbFetch } from './client';` por `import { TmdbError, tmdbFetch } from './client';`.
- Acrescente `Movie` e `TmdbWatchProvidersResponse` ao import de `./types`.
- Adicione ao final do arquivo:

```ts
async function isStreamingInRegion(movieId: number): Promise<boolean> {
  try {
    const data = await tmdbFetch<TmdbWatchProvidersResponse>(
      `/movie/${movieId}/watch/providers`,
      {},
      { revalidate: REVALIDATE.movie },
    );
    return (data.results[WATCH_REGION]?.flatrate?.length ?? 0) > 0;
  } catch (error) {
    if (error instanceof TmdbError && error.status === 404) return false;
    throw error;
  }
}

export async function searchStreaming(query: string): Promise<Movie[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const data = await tmdbFetch<TmdbPagedResponse<TmdbMovieResult>>(
    '/search/movie',
    { query: trimmed, language: LANGUAGE, region: WATCH_REGION, include_adult: 'false', page: 1 },
    { revalidate: REVALIDATE.listings },
  );

  const available = await Promise.all(data.results.map((movie) => isStreamingInRegion(movie.id)));
  return data.results.filter((_, index) => available[index]).map(toMovie);
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/lib/tmdb`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/tmdb/movies.ts src/lib/tmdb/search.test.ts
git commit -m "feat: busca por título restrita a streaming no BR" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Detalhes do filme (`getMovieDetails`)

**Files:**
- Modify: `src/lib/tmdb/mappers.ts`, `src/lib/tmdb/movies.ts`
- Test: `src/lib/tmdb/mappers.test.ts` (acrescentar), `src/lib/tmdb/details.test.ts`

**Interfaces:**
- Consumes: fixtures `duneDetails` e `detailsById` (Task 4).
- Produces:
  - `pickTrailerKey(videos: TmdbVideo[]): string | null`: primeiro trailer do YouTube em `pt`; se não houver, em `en`; senão `null`.
  - `toMovieDetails(raw: TmdbMovieDetailsResponse): MovieDetails`: elenco ordenado por `order` e limitado a 10; `streamingProviders` = `BR.flatrate`; `watchLink` = `BR.link`.
  - `getMovieDetails(id: number): Promise<MovieDetails | null>`: `null` quando o TMDB responde 404.

- [ ] **Step 1: Testes dos novos mappers**

Acrescente ao final de `src/lib/tmdb/mappers.test.ts`:
```ts
import { duneDetails } from '../../../tests/fixtures/tmdb';
import { pickTrailerKey, toMovieDetails } from './mappers';

describe('pickTrailerKey', () => {
  it('prefere trailer do YouTube em português', () => {
    expect(pickTrailerKey(duneDetails.videos!.results)).toBe('trailer-pt');
  });

  it('cai para inglês quando não há em português', () => {
    expect(
      pickTrailerKey([
        { key: 'teaser-pt', site: 'YouTube', type: 'Teaser', iso_639_1: 'pt' },
        { key: 'trailer-en', site: 'YouTube', type: 'Trailer', iso_639_1: 'en' },
      ]),
    ).toBe('trailer-en');
  });

  it('retorna null sem trailer do YouTube', () => {
    expect(pickTrailerKey([{ key: 'v', site: 'Vimeo', type: 'Trailer', iso_639_1: 'pt' }])).toBeNull();
    expect(pickTrailerKey([])).toBeNull();
  });
});

describe('toMovieDetails', () => {
  it('mapeia os detalhes completos', () => {
    const details = toMovieDetails(duneDetails);
    expect(details).toMatchObject({
      id: 438631,
      title: 'Duna',
      releaseYear: 2021,
      runtime: 155,
      voteAverage: 7.8,
      posterPath: '/duna-poster.jpg',
      backdropPath: '/duna-backdrop.jpg',
      genres: [
        { id: 878, name: 'Ficção científica' },
        { id: 12, name: 'Aventura' },
      ],
      trailerKey: 'trailer-pt',
      streamingProviders: [{ id: 1899, name: 'Max', logoPath: '/max.jpg' }],
      watchLink: 'https://www.themoviedb.org/movie/438631-dune/watch?locale=BR',
    });
  });

  it('ordena o elenco por `order` e limita a 10', () => {
    const { cast } = toMovieDetails(duneDetails);
    expect(cast).toHaveLength(10);
    expect(cast[0]).toEqual({ id: 100, name: 'Ator 1', character: 'Personagem 1', profilePath: null });
    expect(cast[9].name).toBe('Ator 10');
  });

  it('tolera campos anexos ausentes e filme sem streaming no BR', () => {
    const details = toMovieDetails({
      ...duneDetails,
      credits: undefined,
      videos: undefined,
      'watch/providers': { results: { US: { flatrate: [] } } },
    });
    expect(details).toMatchObject({ cast: [], trailerKey: null, streamingProviders: [], watchLink: null });
  });
});
```
(Mova os `import` novos para o topo do arquivo, junto dos existentes.)

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/tmdb/mappers.test.ts`
Expected: FAIL, export `pickTrailerKey` inexistente.

- [ ] **Step 3: Implementar os mappers**

Em `src/lib/tmdb/mappers.ts`, amplie o import de tipos para:
```ts
import type {
  CastMember,
  Genre,
  Movie,
  MovieDetails,
  Provider,
  TmdbCastMember,
  TmdbGenre,
  TmdbMovieDetailsResponse,
  TmdbMovieResult,
  TmdbProvider,
  TmdbVideo,
} from './types';
import { WATCH_REGION } from './config';
```
E acrescente:
```ts
const MAX_CAST = 10;

export function pickTrailerKey(videos: TmdbVideo[]): string | null {
  const trailers = videos.filter((video) => video.site === 'YouTube' && video.type === 'Trailer');
  const trailer =
    trailers.find((video) => video.iso_639_1 === 'pt') ?? trailers.find((video) => video.iso_639_1 === 'en');
  return trailer?.key ?? null;
}

function toCastMember(raw: TmdbCastMember): CastMember {
  return { id: raw.id, name: raw.name, character: raw.character, profilePath: raw.profile_path };
}

export function toMovieDetails(raw: TmdbMovieDetailsResponse): MovieDetails {
  const region = raw['watch/providers']?.results[WATCH_REGION];
  const cast = [...(raw.credits?.cast ?? [])].sort((a, b) => a.order - b.order).slice(0, MAX_CAST);
  return {
    id: raw.id,
    title: raw.title,
    overview: raw.overview,
    posterPath: raw.poster_path,
    backdropPath: raw.backdrop_path,
    releaseYear: releaseYearOf(raw.release_date),
    runtime: raw.runtime || null,
    voteAverage: raw.vote_average,
    genres: raw.genres.map(toGenre),
    cast: cast.map(toCastMember),
    trailerKey: pickTrailerKey(raw.videos?.results ?? []),
    streamingProviders: (region?.flatrate ?? []).map(toProvider),
    watchLink: region?.link ?? null,
  };
}
```

Run: `npx vitest run src/lib/tmdb/mappers.test.ts`
Expected: PASS.

- [ ] **Step 4: Testes de `getMovieDetails`**

`src/lib/tmdb/details.test.ts`:
```ts
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server } from '../../../tests/msw/server';
import { getMovieDetails } from './movies';

describe('getMovieDetails', () => {
  it('busca detalhes com créditos, vídeos e provedores numa só chamada', async () => {
    let params: URLSearchParams | undefined;
    server.use(
      http.get('*/3/movie/:id', ({ request }) => {
        params = new URL(request.url).searchParams;
        return HttpResponse.json({ id: 1, title: 'X', overview: '', poster_path: null, backdrop_path: null, release_date: '', runtime: null, vote_average: 0, genres: [] });
      }),
    );
    await getMovieDetails(1);
    expect(params!.get('append_to_response')).toBe('credits,videos,watch/providers');
    expect(params!.get('language')).toBe('pt-BR');
    expect(params!.get('include_video_language')).toBe('pt,en');
  });

  it('retorna os detalhes de domínio', async () => {
    const details = await getMovieDetails(438631);
    expect(details).toMatchObject({ id: 438631, title: 'Duna', trailerKey: 'trailer-pt' });
  });

  it('retorna null para filme inexistente', async () => {
    expect(await getMovieDetails(999999)).toBeNull();
  });

  it('propaga outros erros', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    server.use(http.get('*/3/movie/:id', () => HttpResponse.json({}, { status: 500 })));
    await expect(getMovieDetails(1)).rejects.toMatchObject({ status: 500 });
  });
});
```

- [ ] **Step 5: Rodar e ver falhar**

Run: `npx vitest run src/lib/tmdb/details.test.ts`
Expected: FAIL, `getMovieDetails` inexistente.

- [ ] **Step 6: Implementar**

Em `src/lib/tmdb/movies.ts`: acrescente `toMovieDetails` ao import de `./mappers` e `MovieDetails` e `TmdbMovieDetailsResponse` ao import de `./types`. Depois adicione:
```ts
export async function getMovieDetails(id: number): Promise<MovieDetails | null> {
  try {
    const data = await tmdbFetch<TmdbMovieDetailsResponse>(
      `/movie/${id}`,
      {
        language: LANGUAGE,
        append_to_response: 'credits,videos,watch/providers',
        include_video_language: 'pt,en',
      },
      { revalidate: REVALIDATE.movie },
    );
    return toMovieDetails(data);
  } catch (error) {
    if (error instanceof TmdbError && error.status === 404) return null;
    throw error;
  }
}
```

- [ ] **Step 7: Rodar e ver passar**

Run: `npx vitest run src/lib && npm run lint`
Expected: PASS e lint sem erros.

- [ ] **Step 8: Commit**

```bash
git add src/lib/tmdb
git commit -m "feat: detalhes do filme com elenco, trailer e onde assistir" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Base visual — tema, layout, rodapé, cards e grade

**Files:**
- Create: `src/lib/format.ts`, `src/lib/tmdb/images.ts`, `src/components/site-header.tsx`, `src/components/site-footer.tsx`, `src/components/movie-card.tsx`, `src/components/movie-grid.tsx`, `src/components/movie-grid-skeleton.tsx`, `src/components/empty-state.tsx`, `tests/fixtures/domain.ts`, `public/tmdb-logo.svg`
- Modify: `src/app/globals.css`, `src/app/layout.tsx`
- Test: `src/lib/format.test.ts`, `src/components/movie-card.test.tsx`, `src/components/movie-grid.test.tsx`

**Interfaces:**
- Consumes: tipos de domínio (Task 4).
- Produces:
  - `formatRating(value: number): string` (`7.8` → `"7,8"`), `formatRuntime(minutes: number): string` (`155` → `"2h 35min"`), `initials(name: string): string`.
  - `tmdbImageUrl(path: string | null, size: 'w92' | 'w185' | 'w342' | 'w780' | 'w1280'): string | null`.
  - `<MovieCard movie genreLabel? />`, `<MovieGrid movies genres />`, `GRID_CLASSES` (string), `<MovieGridSkeleton count? />`, `<EmptyState title description? action? />`, `<SiteHeader />`, `<SiteFooter />`.
  - Classes de tema Tailwind: `bg-bg`, `bg-surface`, `bg-surface-2`, `text-fg`, `text-muted`, `bg-accent`, `text-accent`, `text-accent-fg`, `ring-accent`, `outline-accent`, `border-surface-2`.
  - `tests/fixtures/domain.ts`: `providers`, `genres`, `makeMovie()`, `makeMovieDetails()`.

- [ ] **Step 1: Testes de formatação**

`src/lib/format.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { formatRating, formatRuntime, initials } from './format';

describe('formatRating', () => {
  it('usa uma casa decimal com vírgula', () => {
    expect(formatRating(7.8)).toBe('7,8');
    expect(formatRating(8)).toBe('8,0');
    expect(formatRating(7.25)).toBe('7,3');
  });
});

describe('formatRuntime', () => {
  it('formata horas e minutos', () => {
    expect(formatRuntime(155)).toBe('2h 35min');
    expect(formatRuntime(120)).toBe('2h');
    expect(formatRuntime(45)).toBe('45min');
  });
});

describe('initials', () => {
  it('pega a primeira e a última inicial', () => {
    expect(initials('Timothée Chalamet')).toBe('TC');
    expect(initials('Zendaya')).toBe('Z');
    expect(initials('Rebecca de Souza Ferguson')).toBe('RF');
  });
});
```

Run: `npx vitest run src/lib/format.test.ts`
Expected: FAIL, módulo inexistente.

- [ ] **Step 2: Implementar formatação e imagens**

`src/lib/format.ts`:
```ts
export function formatRating(value: number): string {
  return value.toFixed(1).replace('.', ',');
}

export function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}min`;
  return rest ? `${hours}h ${rest}min` : `${hours}h`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}
```

`src/lib/tmdb/images.ts`:
```ts
export type ImageSize = 'w92' | 'w185' | 'w342' | 'w780' | 'w1280';

export function tmdbImageUrl(path: string | null, size: ImageSize): string | null {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}
```

Run: `npx vitest run src/lib/format.test.ts`
Expected: PASS.

- [ ] **Step 3: Tema e fixtures de domínio**

`src/app/globals.css` (substituir tudo):
```css
@import 'tailwindcss';

@theme {
  --color-bg: #0b0c10;
  --color-surface: #1c1e25;
  --color-surface-2: #262a33;
  --color-fg: #e8e8ea;
  --color-muted: #9aa1af;
  --color-accent: #f5c518;
  --color-accent-fg: #111111;
  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
}

html {
  color-scheme: dark;
}

body {
  background: var(--color-bg);
  color: var(--color-fg);
}
```

`tests/fixtures/domain.ts`:
```ts
import type { Genre, Movie, MovieDetails, Provider } from '@/lib/tmdb/types';

export const providers: Provider[] = [
  { id: 8, name: 'Netflix', logoPath: '/netflix.jpg' },
  { id: 119, name: 'Amazon Prime Video', logoPath: '/prime.jpg' },
  { id: 1899, name: 'Max', logoPath: null },
];

export const genres: Genre[] = [
  { id: 28, name: 'Ação' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Terror' },
];

export function makeMovie(overrides: Partial<Movie> = {}): Movie {
  return {
    id: 1,
    title: 'Filme Teste',
    posterPath: '/poster.jpg',
    releaseYear: 2023,
    voteAverage: 7.1,
    genreIds: [18],
    ...overrides,
  };
}

export function makeMovieDetails(overrides: Partial<MovieDetails> = {}): MovieDetails {
  return {
    id: 438631,
    title: 'Duna',
    overview: 'Paul Atreides precisa viajar para o planeta mais perigoso do universo.',
    posterPath: '/duna-poster.jpg',
    backdropPath: '/duna-backdrop.jpg',
    releaseYear: 2021,
    runtime: 155,
    voteAverage: 7.8,
    genres: [
      { id: 878, name: 'Ficção científica' },
      { id: 12, name: 'Aventura' },
    ],
    cast: [
      { id: 1, name: 'Timothée Chalamet', character: 'Paul Atreides', profilePath: '/tc.jpg' },
      { id: 2, name: 'Zendaya', character: 'Chani', profilePath: null },
    ],
    trailerKey: 'trailer-pt',
    streamingProviders: [{ id: 1899, name: 'Max', logoPath: '/max.jpg' }],
    watchLink: 'https://www.themoviedb.org/movie/438631-dune/watch?locale=BR',
    ...overrides,
  };
}
```

- [ ] **Step 4: Testes de card e grade**

`src/components/movie-card.test.tsx`:
```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makeMovie } from '../../tests/fixtures/domain';
import { MovieCard } from './movie-card';

describe('MovieCard', () => {
  it('é um link para os detalhes com pôster, nota e metadados', () => {
    render(<MovieCard movie={makeMovie({ id: 42, title: 'Duna' })} genreLabel="Drama" />);

    expect(screen.getByRole('link')).toHaveAttribute('href', '/filme/42');
    expect(screen.getByRole('img', { name: 'Pôster de Duna' })).toBeInTheDocument();
    expect(screen.getByText('★ 7,1')).toBeInTheDocument();
    expect(screen.getByText('2023 · Drama')).toBeInTheDocument();
  });

  it('mostra um placeholder quando não há pôster', () => {
    render(<MovieCard movie={makeMovie({ title: 'Sem Capa', posterPath: null })} />);
    expect(screen.getByRole('img', { name: 'Sem pôster: Sem Capa' })).toBeInTheDocument();
  });

  it('esconde o selo de nota quando não há nota', () => {
    render(<MovieCard movie={makeMovie({ voteAverage: 0 })} />);
    expect(screen.queryByText(/★/)).not.toBeInTheDocument();
  });

  it('omite metadados ausentes', () => {
    render(<MovieCard movie={makeMovie({ releaseYear: null })} />);
    expect(screen.queryByText('·', { exact: false })).not.toBeInTheDocument();
  });
});
```

`src/components/movie-grid.test.tsx`:
```tsx
// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { genres, makeMovie } from '../../tests/fixtures/domain';
import { MovieGrid } from './movie-grid';

describe('MovieGrid', () => {
  it('renderiza um item por filme com o nome do primeiro gênero conhecido', () => {
    render(
      <MovieGrid
        movies={[makeMovie({ id: 1, title: 'A', genreIds: [999, 27] }), makeMovie({ id: 2, title: 'B', genreIds: [] })]}
        genres={genres}
      />,
    );
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('2023 · Terror')).toBeInTheDocument();
    expect(within(items[1]).getByText('2023')).toBeInTheDocument();
  });
});
```

Run: `npx vitest run src/components`
Expected: FAIL, módulos inexistentes.

- [ ] **Step 5: Implementar card, grade, skeleton e estado vazio**

`src/components/movie-card.tsx`:
```tsx
import Image from 'next/image';
import Link from 'next/link';
import { formatRating } from '@/lib/format';
import { tmdbImageUrl } from '@/lib/tmdb/images';
import type { Movie } from '@/lib/tmdb/types';

type Props = { movie: Movie; genreLabel?: string };

export function MovieCard({ movie, genreLabel }: Props) {
  const poster = tmdbImageUrl(movie.posterPath, 'w342');
  const meta = [movie.releaseYear, genreLabel].filter(Boolean).join(' · ');

  return (
    <Link
      href={`/filme/${movie.id}`}
      className="group block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-surface">
        {poster ? (
          <Image
            src={poster}
            alt={`Pôster de ${movie.title}`}
            fill
            sizes="(min-width: 1280px) 16vw, (min-width: 1024px) 20vw, (min-width: 768px) 25vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            role="img"
            aria-label={`Sem pôster: ${movie.title}`}
            className="flex h-full items-center justify-center p-3 text-center text-sm text-muted"
          >
            <span aria-hidden>{movie.title}</span>
          </div>
        )}
        {movie.voteAverage > 0 && (
          <span className="absolute top-1.5 right-1.5 rounded bg-accent px-1.5 py-0.5 text-xs font-bold text-accent-fg">
            ★ {formatRating(movie.voteAverage)}
          </span>
        )}
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm font-semibold">{movie.title}</h3>
      {meta && <p className="text-xs text-muted">{meta}</p>}
    </Link>
  );
}
```

`src/components/movie-grid.tsx`:
```tsx
import type { Genre, Movie } from '@/lib/tmdb/types';
import { MovieCard } from './movie-card';

export const GRID_CLASSES =
  'grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';

type Props = { movies: Movie[]; genres: Genre[] };

export function MovieGrid({ movies, genres }: Props) {
  const genreNames = new Map(genres.map((genre) => [genre.id, genre.name]));
  return (
    <ul className={GRID_CLASSES}>
      {movies.map((movie) => (
        <li key={movie.id}>
          <MovieCard
            movie={movie}
            genreLabel={movie.genreIds.map((id) => genreNames.get(id)).find(Boolean)}
          />
        </li>
      ))}
    </ul>
  );
}
```

`src/components/movie-grid-skeleton.tsx`:
```tsx
import { GRID_CLASSES } from './movie-grid';

export function MovieGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div role="status">
      <span className="sr-only">Carregando filmes…</span>
      <ul className={GRID_CLASSES} aria-hidden>
        {Array.from({ length: count }, (_, i) => (
          <li key={i} className="animate-pulse">
            <div className="aspect-[2/3] rounded-md bg-surface" />
            <div className="mt-2 h-4 w-3/4 rounded bg-surface" />
            <div className="mt-1 h-3 w-1/2 rounded bg-surface" />
          </li>
        ))}
      </ul>
    </div>
  );
}
```

`src/components/empty-state.tsx`:
```tsx
import type { ReactNode } from 'react';

type Props = { title: string; description?: string; action?: ReactNode };

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {description && <p className="text-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}

export const primaryActionClasses =
  'rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
```

Run: `npx vitest run src/components src/lib/format.test.ts`
Expected: PASS.

- [ ] **Step 6: Logo do TMDB**

```bash
curl -sL https://www.themoviedb.org/about/logos-attribution \
  | grep -o 'https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-[^"]*\.svg' | head -1 \
  | xargs curl -sL -o public/tmdb-logo.svg
head -c 100 public/tmdb-logo.svg
```
Expected: o arquivo começa com `<svg` (ou `<?xml`). Se o grep não encontrar a URL, pare e peça ao usuário para baixar o logo "blue short" em https://www.themoviedb.org/about/logos-attribution e salvar em `public/tmdb-logo.svg`.

- [ ] **Step 7: Header, footer e layout**

`src/components/site-header.tsx`:
```tsx
import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-surface-2 bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="shrink-0 text-lg font-extrabold tracking-tight">
          🎬 <span className="text-accent">Em</span>Cartaz
        </Link>
      </div>
    </header>
  );
}
```

`src/components/site-footer.tsx`:
```tsx
import Image from 'next/image';

export function SiteFooter() {
  return (
    <footer className="border-t border-surface-2 px-4 py-6 text-xs text-muted">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="shrink-0">
          <Image src="/tmdb-logo.svg" alt="TMDB" width={96} height={12} />
        </a>
        <p>
          Este produto usa a API do TMDB mas não é endossado ou certificado pelo TMDB. Dados de
          streaming fornecidos por{' '}
          <a className="underline hover:text-fg" href="https://www.justwatch.com" target="_blank" rel="noreferrer">
            JustWatch
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
```

`src/app/layout.tsx` (substituir):
```tsx
import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: { default: 'EmCartaz — filmes em streaming no Brasil', template: '%s · EmCartaz' },
  description: 'Descubra os filmes disponíveis agora nos serviços de streaming por assinatura no Brasil.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${geist.variable} flex min-h-screen flex-col font-sans antialiased`}>
        <SiteHeader />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-12">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
```

- [ ] **Step 8: Verificar**

Run: `npm test && npm run lint && npm run build`
Expected: tudo passa.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: tema cinema escuro, layout, rodapé de atribuição e grade de filmes" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Filtros e busca na interface

**Files:**
- Create: `src/components/filters/use-filter-navigation.ts`, `provider-picker.tsx`, `genre-chips.tsx`, `year-range.tsx`, `sort-select.tsx`, `filter-bar.tsx`, `src/components/search-box.tsx`
- Modify: `src/components/site-header.tsx`
- Test: `src/components/filters/filter-bar.test.tsx`, `src/components/search-box.test.tsx`

**Interfaces:**
- Consumes: `Filters`, `DEFAULT_FILTERS`, `serializeFilters`, `hasActiveFilters`, `MIN_YEAR`, `SORT_OPTIONS` (Task 2); `Provider`, `Genre` (Task 4); `tmdbImageUrl` (Task 7).
- Produces:
  - `useFilterNavigation(): { navigate(next: Filters): void; isPending: boolean }`: `router.replace('/?…', { scroll: false })` dentro de `startTransition`; com filtros padrão, `'/'`.
  - `<FilterBar filters providers genres />` (client). **A página deve passar `key={serializeFilters(filters)}`**, porque o estado local é inicializado a partir das props.
  - `<ProviderPicker providers selected onChange />`, `<GenreChips genres selected onChange />`, `<YearRange yearFrom yearTo onChange />`, `<SortSelect value onChange />`.
  - `<SearchBox />` (client; usa `useSearchParams`, precisa de `<Suspense>`); `SEARCH_DEBOUNCE_MS = 300`.

- [ ] **Step 1: Testes do FilterBar**

`src/components/filters/filter-bar.test.tsx`:
```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_FILTERS } from '@/lib/filters';
import { genres, providers } from '../../../tests/fixtures/domain';
import { FilterBar } from './filter-bar';

const nav = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => nav }));

function renderBar(filters = DEFAULT_FILTERS) {
  return render(<FilterBar filters={filters} providers={providers} genres={genres} />);
}

describe('FilterBar', () => {
  it('seleciona uma plataforma e atualiza a URL', async () => {
    renderBar();
    await userEvent.click(screen.getByRole('button', { name: 'Netflix' }));

    expect(nav.replace).toHaveBeenLastCalledWith('/?p=8', { scroll: false });
    expect(screen.getByRole('button', { name: 'Netflix' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Amazon Prime Video' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('cliques rápidos acumulam antes de o servidor responder', async () => {
    renderBar();
    await userEvent.click(screen.getByRole('button', { name: 'Netflix' }));
    await userEvent.click(screen.getByRole('button', { name: 'Amazon Prime Video' }));
    expect(nav.replace).toHaveBeenLastCalledWith('/?p=8,119', { scroll: false });
  });

  it('desmarca uma plataforma já selecionada', async () => {
    renderBar({ ...DEFAULT_FILTERS, providers: [8, 119] });
    await userEvent.click(screen.getByRole('button', { name: 'Netflix' }));
    expect(nav.replace).toHaveBeenLastCalledWith('/?p=119', { scroll: false });
  });

  it('plataforma sem logo mostra o nome', () => {
    renderBar();
    expect(screen.getByRole('button', { name: 'Max' })).toHaveTextContent('Max');
  });

  it('filtra por gênero mantendo as plataformas', async () => {
    renderBar({ ...DEFAULT_FILTERS, providers: [8] });
    await userEvent.click(screen.getByRole('button', { name: 'Terror' }));
    expect(nav.replace).toHaveBeenLastCalledWith('/?p=8&g=27', { scroll: false });
  });

  it('muda a ordenação', async () => {
    renderBar();
    await userEvent.selectOptions(screen.getByLabelText('Ordenar por'), 'nota');
    expect(nav.replace).toHaveBeenLastCalledWith('/?ordem=nota', { scroll: false });
  });

  it('define o intervalo de anos', async () => {
    renderBar();
    await userEvent.selectOptions(screen.getByLabelText('Ano inicial'), '2020');
    expect(nav.replace).toHaveBeenLastCalledWith('/?ano=2020-', { scroll: false });
  });

  it('"Limpar filtros" só aparece com filtros ativos e volta para /', async () => {
    const { unmount } = renderBar();
    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument();
    unmount();

    renderBar({ ...DEFAULT_FILTERS, genres: [27], sort: 'nota' });
    await userEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(nav.replace).toHaveBeenLastCalledWith('/', { scroll: false });
  });
});
```

Run: `npx vitest run src/components/filters`
Expected: FAIL, módulo inexistente.

- [ ] **Step 2: Implementar os filtros**

`src/components/filters/use-filter-navigation.ts`:
```ts
'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { serializeFilters, type Filters } from '@/lib/filters';

export function useFilterNavigation() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback(
    (next: Filters) => {
      const queryString = serializeFilters(next);
      startTransition(() => {
        router.replace(queryString ? `/?${queryString}` : '/', { scroll: false });
      });
    },
    [router],
  );

  return { navigate, isPending };
}
```

`src/components/filters/provider-picker.tsx`:
```tsx
import Image from 'next/image';
import { tmdbImageUrl } from '@/lib/tmdb/images';
import type { Provider } from '@/lib/tmdb/types';

type Props = { providers: Provider[]; selected: number[]; onChange: (ids: number[]) => void };

export function ProviderPicker({ providers, selected, onChange }: Props) {
  const hasSelection = selected.length > 0;
  return (
    <div role="group" aria-label="Plataformas" className="-mx-4 flex gap-3 overflow-x-auto px-4 py-1">
      {providers.map((provider) => {
        const isSelected = selected.includes(provider.id);
        const logo = tmdbImageUrl(provider.logoPath, 'w92');
        const toggle = () =>
          onChange(isSelected ? selected.filter((id) => id !== provider.id) : [...selected, provider.id]);
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
              isSelected ? 'ring-2 ring-accent' : hasSelection ? 'opacity-40 hover:opacity-80' : 'hover:brightness-110',
            ].join(' ')}
          >
            {logo ? <Image src={logo} alt={provider.name} fill sizes="48px" className="object-cover" /> : provider.name}
          </button>
        );
      })}
    </div>
  );
}
```

`src/components/filters/genre-chips.tsx`:
```tsx
import type { Genre } from '@/lib/tmdb/types';

type Props = { genres: Genre[]; selected: number[]; onChange: (ids: number[]) => void };

export function GenreChips({ genres, selected, onChange }: Props) {
  return (
    <div role="group" aria-label="Gêneros" className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1">
      {genres.map((genre) => {
        const isSelected = selected.includes(genre.id);
        return (
          <button
            key={genre.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() =>
              onChange(isSelected ? selected.filter((id) => id !== genre.id) : [...selected, genre.id])
            }
            className={[
              'shrink-0 rounded-full px-3 py-1 text-sm whitespace-nowrap transition',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              isSelected ? 'bg-accent font-semibold text-accent-fg' : 'bg-surface-2 hover:bg-surface-2/70',
            ].join(' ')}
          >
            {genre.name}
          </button>
        );
      })}
    </div>
  );
}
```

`src/components/filters/year-range.tsx`:
```tsx
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
      <label className="sr-only" htmlFor="ano-inicial">Ano inicial</label>
      <select
        id="ano-inicial"
        className={selectClasses}
        value={yearFrom ?? ''}
        onChange={(e) => onChange({ yearFrom: toNumber(e.target.value), yearTo })}
      >
        <option value="">Desde sempre</option>
        {years().map((year) => <option key={year} value={year}>{year}</option>)}
      </select>
      <span className="text-muted">até</span>
      <label className="sr-only" htmlFor="ano-final">Ano final</label>
      <select
        id="ano-final"
        className={selectClasses}
        value={yearTo ?? ''}
        onChange={(e) => onChange({ yearFrom, yearTo: toNumber(e.target.value) })}
      >
        <option value="">Hoje</option>
        {years().map((year) => <option key={year} value={year}>{year}</option>)}
      </select>
    </div>
  );
}
```

`src/components/filters/sort-select.tsx`:
```tsx
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
      <label htmlFor="ordenar" className="text-muted">Ordenar por</label>
      <select
        id="ordenar"
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="rounded-md bg-surface-2 px-2 py-1.5 focus-visible:outline-2 focus-visible:outline-accent"
      >
        {(Object.keys(LABELS) as SortOption[]).map((option) => (
          <option key={option} value={option}>{LABELS[option]}</option>
        ))}
      </select>
    </div>
  );
}
```

`src/components/filters/filter-bar.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { DEFAULT_FILTERS, hasActiveFilters, type Filters } from '@/lib/filters';
import type { Genre, Provider } from '@/lib/tmdb/types';
import { GenreChips } from './genre-chips';
import { ProviderPicker } from './provider-picker';
import { SortSelect } from './sort-select';
import { useFilterNavigation } from './use-filter-navigation';
import { YearRange } from './year-range';

type Props = { filters: Filters; providers: Provider[]; genres: Genre[] };

/**
 * O estado local ("draft") acumula cliques rápidos enquanto o servidor ainda não respondeu.
 * A página remonta este componente com key={serializeFilters(filters)} quando a URL muda.
 */
export function FilterBar({ filters, providers, genres }: Props) {
  const [draft, setDraft] = useState(filters);
  const { navigate, isPending } = useFilterNavigation();

  const apply = (next: Filters) => {
    setDraft(next);
    navigate(next);
  };
  const update = (patch: Partial<Filters>) => apply({ ...draft, ...patch, query: undefined });

  return (
    <section aria-label="Filtros" aria-busy={isPending} className="space-y-3 py-4">
      <ProviderPicker providers={providers} selected={draft.providers} onChange={(ids) => update({ providers: ids })} />
      <GenreChips genres={genres} selected={draft.genres} onChange={(ids) => update({ genres: ids })} />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <YearRange yearFrom={draft.yearFrom} yearTo={draft.yearTo} onChange={(range) => update(range)} />
        <SortSelect value={draft.sort} onChange={(sort) => update({ sort })} />
        {hasActiveFilters(draft) && (
          <button
            type="button"
            onClick={() => apply(DEFAULT_FILTERS)}
            className="text-sm text-accent underline-offset-4 hover:underline"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </section>
  );
}
```

Run: `npx vitest run src/components/filters`
Expected: PASS.

- [ ] **Step 3: Testes do SearchBox**

`src/components/search-box.test.tsx`:
```tsx
// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SEARCH_DEBOUNCE_MS, SearchBox } from './search-box';

const nav = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
  pathname: '/',
  searchParams: new URLSearchParams(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: nav.replace, push: nav.push }),
  usePathname: () => nav.pathname,
  useSearchParams: () => nav.searchParams,
}));

function setup() {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const view = render(<SearchBox />);
  return { user, view, input: screen.getByRole('searchbox', { name: 'Buscar filme' }) };
}

describe('SearchBox', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    nav.pathname = '/';
    nav.searchParams = new URLSearchParams();
  });
  afterEach(() => vi.useRealTimers());

  it('atualiza a URL após o debounce', async () => {
    const { user, input } = setup();
    await user.type(input, 'duna');
    expect(nav.replace).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
    expect(nav.replace).toHaveBeenCalledOnce();
    expect(nav.replace).toHaveBeenCalledWith('/?q=duna', { scroll: false });
  });

  it('codifica caracteres especiais', async () => {
    const { user, input } = setup();
    await user.type(input, 'velozes & furiosos');
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
    expect(nav.replace).toHaveBeenCalledWith('/?q=velozes%20%26%20furiosos', { scroll: false });
  });

  it('não sobrescreve o que o usuário continua digitando quando a URL se atualiza', async () => {
    const { user, input, view } = setup();
    await user.type(input, 'dun');
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
    await user.type(input, 'a');

    // o servidor responde à navegação de "dun" enquanto o campo já tem "duna"
    nav.searchParams = new URLSearchParams('q=dun');
    view.rerender(<SearchBox />);

    expect(input).toHaveValue('duna');
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
    expect(nav.replace).toHaveBeenLastCalledWith('/?q=duna', { scroll: false });
  });

  it('sincroniza com mudanças externas da URL (ex.: Limpar filtros)', () => {
    nav.searchParams = new URLSearchParams('q=duna');
    const { input, view } = setup();
    expect(input).toHaveValue('duna');

    nav.searchParams = new URLSearchParams();
    view.rerender(<SearchBox />);
    expect(input).toHaveValue('');
  });

  it('apagar a busca no catálogo volta para /', async () => {
    nav.searchParams = new URLSearchParams('q=duna');
    const { user, input } = setup();
    await user.clear(input);
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
    expect(nav.replace).toHaveBeenCalledWith('/', { scroll: false });
  });

  it('em outra página, navega para o catálogo com push', async () => {
    nav.pathname = '/filme/1';
    const { user, input } = setup();
    await user.type(input, 'duna');
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
    expect(nav.push).toHaveBeenCalledWith('/?q=duna');
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it('Enter busca imediatamente', async () => {
    const { user, input } = setup();
    await user.type(input, 'duna{Enter}');
    expect(nav.replace).toHaveBeenCalledWith('/?q=duna', { scroll: false });
  });
});
```

Run: `npx vitest run src/components/search-box.test.tsx`
Expected: FAIL, módulo inexistente.

- [ ] **Step 4: Implementar o SearchBox**

`src/components/search-box.tsx`:
```tsx
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export const SEARCH_DEBOUNCE_MS = 300;

export function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const urlQuery = useSearchParams().get('q') ?? '';
  const [value, setValue] = useState(urlQuery);
  // último termo que ESTE componente enviou para a URL
  const lastSubmitted = useRef(urlQuery);

  // A URL mudou por fora (Limpar filtros, voltar no histórico): sincroniza o campo.
  useEffect(() => {
    if (urlQuery !== lastSubmitted.current) {
      lastSubmitted.current = urlQuery;
      setValue(urlQuery);
    }
  }, [urlQuery]);

  const submit = useCallback(
    (raw: string) => {
      const term = raw.trim();
      if (term === lastSubmitted.current) return;
      if (pathname !== '/' && !term) return;
      lastSubmitted.current = term;
      const target = term ? `/?q=${encodeURIComponent(term)}` : '/';
      if (pathname === '/') router.replace(target, { scroll: false });
      else router.push(target);
    },
    [pathname, router],
  );

  useEffect(() => {
    const timer = setTimeout(() => submit(value), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, submit]);

  return (
    <form
      role="search"
      className="flex-1"
      onSubmit={(event) => {
        event.preventDefault();
        submit(value);
      }}
    >
      <label htmlFor="busca" className="sr-only">Buscar filme</label>
      <input
        id="busca"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Buscar filme…"
        autoComplete="off"
        className="w-full rounded-full bg-surface px-4 py-2 text-sm placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent"
      />
    </form>
  );
}
```

Run: `npx vitest run src/components/search-box.test.tsx`
Expected: PASS.

- [ ] **Step 5: Colocar o SearchBox no header**

`src/components/site-header.tsx` (substituir):
```tsx
import Link from 'next/link';
import { Suspense } from 'react';
import { SearchBox } from './search-box';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-surface-2 bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="shrink-0 text-lg font-extrabold tracking-tight">
          🎬 <span className="text-accent">Em</span>Cartaz
        </Link>
        <Suspense fallback={<div className="h-9 flex-1 rounded-full bg-surface" />}>
          <SearchBox />
        </Suspense>
      </div>
    </header>
  );
}
```

- [ ] **Step 6: Verificar**

Run: `npm test && npm run lint && npm run build`
Expected: tudo passa.

- [ ] **Step 7: Commit**

```bash
git add src/components
git commit -m "feat: barra de filtros e busca com estado na URL" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Rolagem infinita (`loadMore` + `InfiniteMovieList`)

**Files:**
- Create: `src/app/actions.ts`, `src/components/infinite-movie-list.tsx`, `tests/helpers/intersection-observer.ts`
- Test: `src/app/actions.test.ts`, `src/components/infinite-movie-list.test.tsx`

**Interfaces:**
- Consumes: `discoverStreaming` (Task 4); `parseFilters` e `searchParamsFromQueryString` (Task 2); `MovieGrid` e `MovieGridSkeleton` (Task 7).
- Produces:
  - `loadMore(queryString: string, page: number): Promise<MoviePage>` (Server Action). Recebe a query string serializada, não o objeto `Filters`, porque é um endpoint público: a entrada passa sempre pelo mesmo parse/validação da URL.
  - `<InfiniteMovieList initialPage queryString genres />` (client). Deduplica filmes por `id`; em erro, mantém a grade e mostra "tentar de novo".
  - `installFakeIntersectionObserver(): { trigger(): void; instances: FakeIntersectionObserver[] }` para testes jsdom.

- [ ] **Step 1: Testes da Server Action**

`src/app/actions.test.ts`:
```ts
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server } from '../../tests/msw/server';
import { loadMore } from './actions';

describe('loadMore', () => {
  it('carrega a página pedida com os filtros da query string', async () => {
    let params: URLSearchParams | undefined;
    server.use(
      http.get('*/3/discover/movie', ({ request }) => {
        params = new URL(request.url).searchParams;
        return HttpResponse.json({ page: 2, results: [], total_pages: 2, total_results: 40 });
      }),
    );

    const result = await loadMore('p=8&g=27', 2);

    expect(result).toEqual({ movies: [], page: 2, hasMore: false });
    expect(params!.get('with_watch_providers')).toBe('8');
    expect(params!.get('with_genres')).toBe('27');
    expect(params!.get('page')).toBe('2');
  });

  it.each([
    ['lixo', 0],
    ['', 9999],
    ['', -5],
    ['q=duna', 2],
  ])('entrada arbitrária (%j, %j) devolve página vazia sem chamar o TMDB', async (qs, page) => {
    const spy = vi.fn();
    server.use(http.get('*/3/discover/movie', spy));
    const result = await loadMore(qs, page);
    expect(result.movies).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });
});
```

Run: `npx vitest run src/app/actions.test.ts`
Expected: FAIL, módulo inexistente.

- [ ] **Step 2: Implementar a Server Action**

`src/app/actions.ts`:
```ts
'use server';

import { parseFilters, searchParamsFromQueryString } from '@/lib/filters';
import { discoverStreaming } from '@/lib/tmdb/movies';
import type { MoviePage } from '@/lib/tmdb/types';

export async function loadMore(queryString: string, page: number): Promise<MoviePage> {
  const filters = parseFilters(searchParamsFromQueryString(String(queryString)));
  if (filters.query) return { movies: [], page, hasMore: false }; // busca não pagina
  return discoverStreaming(filters, page);
}
```

Run: `npx vitest run src/app/actions.test.ts`
Expected: PASS. (O caso `('lixo', 0)` passa porque `discoverStreaming` rejeita a página 0.)

- [ ] **Step 3: Helper de IntersectionObserver**

`tests/helpers/intersection-observer.ts`:
```ts
import { vi } from 'vitest';

export class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  readonly observe = vi.fn();
  readonly unobserve = vi.fn();
  readonly disconnect = vi.fn();
  readonly takeRecords = () => [];
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds = [];

  constructor(private readonly callback: IntersectionObserverCallback) {
    FakeIntersectionObserver.instances.push(this);
  }

  trigger() {
    this.callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

export function installFakeIntersectionObserver() {
  FakeIntersectionObserver.instances = [];
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  return {
    get instances() {
      return FakeIntersectionObserver.instances;
    },
    /** Dispara o observer ativo mais recente. */
    trigger() {
      const active = FakeIntersectionObserver.instances.filter((o) => o.disconnect.mock.calls.length === 0);
      active.at(-1)?.trigger();
    },
  };
}
```

- [ ] **Step 4: Testes do InfiniteMovieList**

`src/components/infinite-movie-list.test.tsx`:
```tsx
// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadMore } from '@/app/actions';
import type { MoviePage } from '@/lib/tmdb/types';
import { genres, makeMovie } from '../../tests/fixtures/domain';
import { installFakeIntersectionObserver } from '../../tests/helpers/intersection-observer';
import { InfiniteMovieList } from './infinite-movie-list';

vi.mock('@/app/actions', () => ({ loadMore: vi.fn() }));

const page = (n: number, ids: number[], hasMore: boolean): MoviePage => ({
  page: n,
  hasMore,
  movies: ids.map((id) => makeMovie({ id, title: `Filme ${id}` })),
});

describe('InfiniteMovieList', () => {
  let io: ReturnType<typeof installFakeIntersectionObserver>;
  beforeEach(() => {
    io = installFakeIntersectionObserver();
  });

  it('renderiza a primeira página e carrega a próxima ao chegar no fim', async () => {
    vi.mocked(loadMore).mockResolvedValue(page(2, [3, 4], false));
    render(<InfiniteMovieList initialPage={page(1, [1, 2], true)} queryString="p=8" genres={genres} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);

    await act(async () => io.trigger());

    expect(loadMore).toHaveBeenCalledWith('p=8', 2);
    expect(screen.getByText('Filme 4')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });

  it('não duplica filmes repetidos entre páginas', async () => {
    vi.mocked(loadMore).mockResolvedValue(page(2, [2, 3], false));
    render(<InfiniteMovieList initialPage={page(1, [1, 2], true)} queryString="" genres={genres} />);

    await act(async () => io.trigger());

    expect(screen.getAllByText('Filme 2')).toHaveLength(1);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('não observa nada quando não há mais páginas', () => {
    render(<InfiniteMovieList initialPage={page(1, [1], false)} queryString="" genres={genres} />);
    expect(io.instances).toHaveLength(0);
  });

  it('dispara uma só requisição mesmo com gatilhos repetidos', async () => {
    let resolve!: (value: MoviePage) => void;
    vi.mocked(loadMore).mockReturnValue(new Promise((r) => (resolve = r)));
    render(<InfiniteMovieList initialPage={page(1, [1], true)} queryString="" genres={genres} />);

    act(() => {
      io.instances[0].trigger();
      io.instances[0].trigger();
    });
    await act(async () => resolve(page(2, [2], false)));

    expect(loadMore).toHaveBeenCalledOnce();
  });

  it('em erro mantém a grade e permite tentar de novo', async () => {
    vi.mocked(loadMore)
      .mockRejectedValueOnce(new Error('falhou'))
      .mockResolvedValueOnce(page(2, [2], false));
    render(<InfiniteMovieList initialPage={page(1, [1], true)} queryString="" genres={genres} />);

    await act(async () => io.trigger());
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar mais');
    expect(screen.getByText('Filme 1')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'tentar de novo' }));
    expect(screen.getByText('Filme 2')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
```

Run: `npx vitest run src/components/infinite-movie-list.test.tsx`
Expected: FAIL, módulo inexistente.

- [ ] **Step 5: Implementar o InfiniteMovieList**

`src/components/infinite-movie-list.tsx`:
```tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { loadMore } from '@/app/actions';
import type { Genre, Movie, MoviePage } from '@/lib/tmdb/types';
import { MovieGrid } from './movie-grid';
import { MovieGridSkeleton } from './movie-grid-skeleton';

type Status = 'idle' | 'loading' | 'error' | 'done';
type Props = { initialPage: MoviePage; queryString: string; genres: Genre[] };

function appendUnique(current: Movie[], incoming: Movie[]): Movie[] {
  const seen = new Set(current.map((movie) => movie.id));
  return [...current, ...incoming.filter((movie) => !seen.has(movie.id))];
}

export function InfiniteMovieList({ initialPage, queryString, genres }: Props) {
  const [movies, setMovies] = useState(initialPage.movies);
  const [page, setPage] = useState(initialPage.page);
  const [status, setStatus] = useState<Status>(initialPage.hasMore ? 'idle' : 'done');
  const inFlight = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadNext = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus('loading');
    try {
      const next = await loadMore(queryString, page + 1);
      setMovies((current) => appendUnique(current, next.movies));
      setPage(next.page);
      setStatus(next.hasMore ? 'idle' : 'done');
    } catch {
      setStatus('error');
    } finally {
      inFlight.current = false;
    }
  }, [page, queryString]);

  useEffect(() => {
    if (status !== 'idle' || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadNext();
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [status, loadNext]);

  return (
    <>
      <MovieGrid movies={movies} genres={genres} />
      {status === 'loading' && (
        <div className="mt-6">
          <MovieGridSkeleton count={6} />
        </div>
      )}
      {status === 'error' && (
        <p role="alert" className="mt-8 text-center text-sm text-muted">
          Não foi possível carregar mais —{' '}
          <button type="button" onClick={() => void loadNext()} className="text-accent underline">
            tentar de novo
          </button>
        </p>
      )}
      {status === 'idle' && <div ref={sentinelRef} aria-hidden className="h-px" />}
    </>
  );
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `npx vitest run src/app src/components/infinite-movie-list.test.tsx && npm run lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/actions.ts src/app/actions.test.ts src/components/infinite-movie-list.tsx src/components/infinite-movie-list.test.tsx tests/helpers
git commit -m "feat: rolagem infinita via Server Action com deduplicação" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Página do catálogo (resultados, estados, erro e loading)

**Files:**
- Create: `src/components/catalog-results.tsx`, `src/app/loading.tsx`, `src/app/error.tsx`, `src/app/not-found.tsx`
- Modify: `src/app/page.tsx`
- Test: `src/components/catalog-results.test.tsx`

**Interfaces:**
- Consumes: `parseFilters`, `serializeFilters`, `SearchParamsInput` (Task 2); `getProviders`, `getGenres`, `discoverStreaming`, `searchStreaming` (Tasks 4 e 5); `FilterBar` (Task 8); `InfiniteMovieList` (Task 9); `MovieGrid`, `MovieGridSkeleton`, `EmptyState`, `primaryActionClasses` (Task 7).
- Produces: `CatalogResults({ filters, genres }): Promise<JSX.Element>` (async Server Component); `FEW_RESULTS = 5`.

- [ ] **Step 1: Testes do CatalogResults**

`src/components/catalog-results.test.tsx`:
```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_FILTERS } from '@/lib/filters';
import { discoverStreaming, searchStreaming } from '@/lib/tmdb/movies';
import { genres, makeMovie } from '../../tests/fixtures/domain';
import { installFakeIntersectionObserver } from '../../tests/helpers/intersection-observer';
import { CatalogResults } from './catalog-results';

vi.mock('@/lib/tmdb/movies', () => ({ discoverStreaming: vi.fn(), searchStreaming: vi.fn() }));
vi.mock('@/app/actions', () => ({ loadMore: vi.fn() }));

const movies = (n: number) => Array.from({ length: n }, (_, i) => makeMovie({ id: i + 1, title: `Filme ${i + 1}` }));

describe('CatalogResults', () => {
  beforeEach(() => {
    installFakeIntersectionObserver();
  });

  it('modo catálogo mostra a primeira página do discover', async () => {
    vi.mocked(discoverStreaming).mockResolvedValue({ movies: movies(3), page: 1, hasMore: true });
    render(await CatalogResults({ filters: { ...DEFAULT_FILTERS, providers: [8] }, genres }));

    expect(discoverStreaming).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, providers: [8] }, 1);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('catálogo vazio sugere limpar filtros', async () => {
    vi.mocked(discoverStreaming).mockResolvedValue({ movies: [], page: 1, hasMore: false });
    render(await CatalogResults({ filters: { ...DEFAULT_FILTERS, genres: [27] }, genres }));

    expect(screen.getByText('Nenhum filme encontrado com esses filtros')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Limpar filtros' })).toHaveAttribute('href', '/');
  });

  it('modo busca usa searchStreaming e não o discover', async () => {
    vi.mocked(searchStreaming).mockResolvedValue(movies(8));
    render(await CatalogResults({ filters: { ...DEFAULT_FILTERS, query: 'duna' }, genres }));

    expect(searchStreaming).toHaveBeenCalledWith('duna');
    expect(discoverStreaming).not.toHaveBeenCalled();
    expect(screen.getAllByRole('listitem')).toHaveLength(8);
    expect(screen.queryByText(/termo mais específico/)).not.toBeInTheDocument();
  });

  it('busca com poucos resultados sugere refinar', async () => {
    vi.mocked(searchStreaming).mockResolvedValue(movies(2));
    render(await CatalogResults({ filters: { ...DEFAULT_FILTERS, query: 'duna' }, genres }));
    expect(screen.getByText(/termo mais específico/)).toBeInTheDocument();
  });

  it('busca sem resultado em streaming cita o termo', async () => {
    vi.mocked(searchStreaming).mockResolvedValue([]);
    render(await CatalogResults({ filters: { ...DEFAULT_FILTERS, query: 'xyz' }, genres }));

    expect(screen.getByText('Nenhum resultado disponível em streaming para “xyz”')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver catálogo' })).toHaveAttribute('href', '/');
  });
});
```

Run: `npx vitest run src/components/catalog-results.test.tsx`
Expected: FAIL, módulo inexistente.

- [ ] **Step 2: Implementar o CatalogResults**

`src/components/catalog-results.tsx`:
```tsx
import Link from 'next/link';
import { serializeFilters, type Filters } from '@/lib/filters';
import { discoverStreaming, searchStreaming } from '@/lib/tmdb/movies';
import type { Genre } from '@/lib/tmdb/types';
import { EmptyState, primaryActionClasses } from './empty-state';
import { InfiniteMovieList } from './infinite-movie-list';
import { MovieGrid } from './movie-grid';

export const FEW_RESULTS = 5;

type Props = { filters: Filters; genres: Genre[] };

export async function CatalogResults({ filters, genres }: Props) {
  if (filters.query) {
    const movies = await searchStreaming(filters.query);
    if (!movies.length) {
      return (
        <EmptyState
          title={`Nenhum resultado disponível em streaming para “${filters.query}”`}
          description="A busca mostra só filmes disponíveis agora em serviços de assinatura no Brasil."
          action={<Link href="/" className={primaryActionClasses}>Ver catálogo</Link>}
        />
      );
    }
    return (
      <>
        <MovieGrid movies={movies} genres={genres} />
        {movies.length < FEW_RESULTS && (
          <p className="mt-8 text-center text-sm text-muted">
            A busca considera os 20 resultados mais relevantes. Não achou? Tente um termo mais específico.
          </p>
        )}
      </>
    );
  }

  const firstPage = await discoverStreaming(filters, 1);
  if (!firstPage.movies.length) {
    return (
      <EmptyState
        title="Nenhum filme encontrado com esses filtros"
        action={<Link href="/" className={primaryActionClasses}>Limpar filtros</Link>}
      />
    );
  }
  return <InfiniteMovieList initialPage={firstPage} queryString={serializeFilters(filters)} genres={genres} />;
}
```

Run: `npx vitest run src/components/catalog-results.test.tsx`
Expected: PASS.

- [ ] **Step 3: Página, loading, erro e 404**

`src/app/page.tsx` (substituir):
```tsx
import { Suspense } from 'react';
import { CatalogResults } from '@/components/catalog-results';
import { FilterBar } from '@/components/filters/filter-bar';
import { MovieGridSkeleton } from '@/components/movie-grid-skeleton';
import { parseFilters, serializeFilters, type SearchParamsInput } from '@/lib/filters';
import { getGenres, getProviders } from '@/lib/tmdb/movies';

type Props = { searchParams: Promise<SearchParamsInput> };

export default async function CatalogPage({ searchParams }: Props) {
  const filters = parseFilters(await searchParams);
  const [providers, genres] = await Promise.all([getProviders(), getGenres()]);
  const key = serializeFilters(filters);

  return (
    <>
      {filters.query ? (
        <h1 className="pt-6 pb-4 text-xl font-semibold">Resultados para “{filters.query}”</h1>
      ) : (
        <>
          <h1 className="sr-only">Filmes em streaming por assinatura no Brasil</h1>
          <FilterBar key={key} filters={filters} providers={providers} genres={genres} />
        </>
      )}
      {/* key: mudar a URL mostra o skeleton e reinicia a rolagem infinita */}
      <Suspense key={key} fallback={<MovieGridSkeleton />}>
        <CatalogResults filters={filters} genres={genres} />
      </Suspense>
    </>
  );
}
```

`src/app/loading.tsx`:
```tsx
import { MovieGridSkeleton } from '@/components/movie-grid-skeleton';

export default function Loading() {
  return (
    <div className="pt-6">
      <MovieGridSkeleton />
    </div>
  );
}
```

`src/app/error.tsx`:
```tsx
'use client';

import { EmptyState, primaryActionClasses } from '@/components/empty-state';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <EmptyState
      title="Algo deu errado"
      description="Não conseguimos carregar os filmes agora. Tente de novo em instantes."
      action={
        <button type="button" onClick={reset} className={primaryActionClasses}>
          Tentar de novo
        </button>
      }
    />
  );
}
```

`src/app/not-found.tsx`:
```tsx
import Link from 'next/link';
import { EmptyState, primaryActionClasses } from '@/components/empty-state';

export default function NotFound() {
  return (
    <EmptyState
      title="Página não encontrada"
      action={<Link href="/" className={primaryActionClasses}>Ver catálogo</Link>}
    />
  );
}
```

- [ ] **Step 4: Verificação automática**

Run: `npm test && npm run lint && npm run build`
Expected: tudo passa.

- [ ] **Step 5: Verificação manual contra a API real**

```bash
npm run dev
```
Em outro terminal:
```bash
curl -s http://localhost:3000/ | grep -o 'Pôster de [^"]*' | head -5
curl -s "http://localhost:3000/?p=8&g=27" | grep -o 'Pôster de [^"]*' | head -5
curl -s "http://localhost:3000/?q=duna" | grep -o 'Pôster de [^"]*' | head -5
curl -s "http://localhost:3000/?ano=abc&p=x" -o /dev/null -w '%{http_code}\n'
```
Expected: as três primeiras listam títulos reais de filmes (o segundo, filmes de terror); a última imprime `200`. Abra http://localhost:3000 no navegador e confira os filtros, a busca e a rolagem. Se possível, mostre ao usuário.

- [ ] **Step 6: Commit**

```bash
git add src/app src/components/catalog-results.tsx src/components/catalog-results.test.tsx
git commit -m "feat: página do catálogo com busca, estados vazios e erro" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Página de detalhes do filme

**Files:**
- Create: `src/lib/movie-id.ts`, `src/components/details/watch-providers.tsx`, `cast-list.tsx`, `trailer-modal.tsx`, `movie-hero.tsx`, `src/app/filme/[id]/page.tsx`, `src/app/filme/[id]/error.tsx`, `src/app/filme/[id]/not-found.tsx`
- Test: `src/lib/movie-id.test.ts`, `src/components/details/details.test.tsx`

**Interfaces:**
- Consumes: `getMovieDetails` (Task 6); `formatRating`, `formatRuntime`, `initials`, `tmdbImageUrl`, `EmptyState`, `primaryActionClasses` (Task 7); `makeMovieDetails` (fixtures de domínio).
- Produces: `parseMovieId(raw: string): number | null` (inteiro positivo, só dígitos); `<MovieHero movie />`, `<WatchProviders providers link />`, `<CastList cast />`, `<TrailerModal trailerKey title />`.

- [ ] **Step 1: Testes do `parseMovieId`**

`src/lib/movie-id.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { parseMovieId } from './movie-id';

describe('parseMovieId', () => {
  it('aceita inteiros positivos', () => {
    expect(parseMovieId('438631')).toBe(438631);
  });

  it.each(['abc', '-1', '0', '1.5', '1e3', ' 12', '', '12abc', '99999999999999999999'])('rejeita %j', (raw) => {
    expect(parseMovieId(raw)).toBeNull();
  });
});
```

Run: `npx vitest run src/lib/movie-id.test.ts`
Expected: FAIL, módulo inexistente.

- [ ] **Step 2: Implementar**

`src/lib/movie-id.ts`:
```ts
export function parseMovieId(raw: string): number | null {
  if (!/^\d{1,10}$/.test(raw)) return null;
  const id = Number(raw);
  return id > 0 ? id : null;
}
```

Run: `npx vitest run src/lib/movie-id.test.ts`
Expected: PASS.

- [ ] **Step 3: Testes dos componentes de detalhes**

`src/components/details/details.test.tsx`:
```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeMovieDetails } from '../../../tests/fixtures/domain';
import { CastList } from './cast-list';
import { MovieHero } from './movie-hero';
import { TrailerModal } from './trailer-modal';
import { WatchProviders } from './watch-providers';

describe('WatchProviders', () => {
  it('lista as plataformas com link para o TMDB/JustWatch', () => {
    render(<WatchProviders providers={[{ id: 1899, name: 'Max', logoPath: '/max.jpg' }]} link="https://tmdb/watch" />);
    expect(screen.getByRole('heading', { name: 'Onde assistir' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Max' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver opções no TMDB/ })).toHaveAttribute('href', 'https://tmdb/watch');
  });

  it('avisa quando o filme não está em streaming', () => {
    render(<WatchProviders providers={[]} link={null} />);
    expect(screen.getByText('Não está disponível em streaming por assinatura no momento.')).toBeInTheDocument();
  });
});

describe('CastList', () => {
  it('mostra nome, personagem e iniciais quando não há foto', () => {
    render(<CastList cast={makeMovieDetails().cast} />);
    expect(screen.getByRole('img', { name: 'Timothée Chalamet' })).toBeInTheDocument();
    expect(screen.getByText('Chani')).toBeInTheDocument();
    expect(screen.getByText('Z')).toBeInTheDocument();
  });
});

describe('TrailerModal', () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    });
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    });
  });

  it('abre o player só quando solicitado e fecha', async () => {
    render(<TrailerModal trailerKey="abc123" title="Duna" />);
    expect(document.querySelector('iframe')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: '▶ Ver trailer' }));
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    expect(document.querySelector('iframe')).toHaveAttribute(
      'src',
      'https://www.youtube-nocookie.com/embed/abc123?autoplay=1',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Fechar trailer' }));
    expect(document.querySelector('iframe')).toBeNull();
  });
});

describe('MovieHero', () => {
  it('mostra título, nota, metadados, onde assistir e botão de trailer', () => {
    render(<MovieHero movie={makeMovieDetails()} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Duna' })).toBeInTheDocument();
    expect(screen.getByText('★ 7,8')).toBeInTheDocument();
    expect(screen.getByText('2021 · 2h 35min · Ficção científica, Aventura')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Max' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '▶ Ver trailer' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Voltar ao catálogo' })).toHaveAttribute('href', '/');
  });

  it('esconde o botão de trailer quando não há trailer', () => {
    render(<MovieHero movie={makeMovieDetails({ trailerKey: null })} />);
    expect(screen.queryByRole('button', { name: /trailer/ })).not.toBeInTheDocument();
  });
});
```

Run: `npx vitest run src/components/details`
Expected: FAIL, módulos inexistentes.

- [ ] **Step 4: Implementar os componentes**

`src/components/details/watch-providers.tsx`:
```tsx
import Image from 'next/image';
import { tmdbImageUrl } from '@/lib/tmdb/images';
import type { Provider } from '@/lib/tmdb/types';

type Props = { providers: Provider[]; link: string | null };

export function WatchProviders({ providers, link }: Props) {
  if (!providers.length) {
    return (
      <p className="rounded-md bg-surface px-3 py-2 text-sm text-muted">
        Não está disponível em streaming por assinatura no momento.
      </p>
    );
  }
  return (
    <div>
      <h2 className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">Onde assistir</h2>
      <ul className="flex flex-wrap items-center gap-2">
        {providers.map((provider) => {
          const logo = tmdbImageUrl(provider.logoPath, 'w92');
          return (
            <li
              key={provider.id}
              title={provider.name}
              className="relative flex size-11 items-center justify-center overflow-hidden rounded-xl bg-surface-2 text-[10px]"
            >
              {logo ? <Image src={logo} alt={provider.name} fill sizes="44px" className="object-cover" /> : provider.name}
            </li>
          );
        })}
      </ul>
      {link && (
        <a href={link} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-muted underline hover:text-fg">
          Ver opções no TMDB (dados JustWatch)
        </a>
      )}
    </div>
  );
}
```

`src/components/details/cast-list.tsx`:
```tsx
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
```

`src/components/details/trailer-modal.tsx`:
```tsx
'use client';

import { useRef, useState } from 'react';

type Props = { trailerKey: string; title: string };

export function TrailerModal({ trailerKey, title }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  const openModal = () => {
    setOpen(true);
    dialogRef.current?.showModal(); // modal nativo: prende o foco e fecha com Esc
  };
  const closeModal = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        ▶ Ver trailer
      </button>
      <dialog
        ref={dialogRef}
        aria-label={`Trailer de ${title}`}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeModal();
        }}
        className="m-auto w-[min(960px,92vw)] rounded-lg bg-black p-0 text-fg backdrop:bg-black/80"
      >
        <div className="flex justify-end p-2">
          <button type="button" onClick={closeModal} aria-label="Fechar trailer" className="px-2 text-sm text-muted hover:text-fg">
            Fechar ✕
          </button>
        </div>
        {open && (
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1`}
              title={`Trailer de ${title}`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        )}
      </dialog>
    </>
  );
}
```

`src/components/details/movie-hero.tsx`:
```tsx
import Image from 'next/image';
import Link from 'next/link';
import { formatRating, formatRuntime } from '@/lib/format';
import { tmdbImageUrl } from '@/lib/tmdb/images';
import type { MovieDetails } from '@/lib/tmdb/types';
import { TrailerModal } from './trailer-modal';
import { WatchProviders } from './watch-providers';

export function MovieHero({ movie }: { movie: MovieDetails }) {
  const backdrop = tmdbImageUrl(movie.backdropPath, 'w1280');
  const poster = tmdbImageUrl(movie.posterPath, 'w342');
  const meta = [
    movie.releaseYear,
    movie.runtime ? formatRuntime(movie.runtime) : null,
    movie.genres.map((genre) => genre.name).join(', ') || null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <section className="relative -mx-4">
      <div className="relative h-56 sm:h-80 lg:h-[26rem]">
        {backdrop && <Image src={backdrop} alt="" fill priority sizes="100vw" className="object-cover" />}
        <div className="absolute inset-0 bg-linear-to-b from-bg/10 via-bg/60 to-bg" />
        <Link href="/" className="absolute top-4 left-4 rounded bg-bg/60 px-2 py-1 text-sm text-muted hover:text-fg">
          ← Voltar ao catálogo
        </Link>
      </div>
      <div className="relative -mt-24 flex flex-col gap-6 px-4 sm:-mt-40 sm:flex-row">
        <div className="relative aspect-[2/3] w-32 shrink-0 overflow-hidden rounded-lg bg-surface shadow-2xl shadow-black/60 sm:w-52">
          {poster && <Image src={poster} alt={`Pôster de ${movie.title}`} fill priority sizes="208px" className="object-cover" />}
        </div>
        <div className="flex flex-col gap-4 sm:pt-36">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{movie.title}</h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
            {movie.voteAverage > 0 && (
              <span className="rounded bg-accent px-1.5 py-0.5 text-xs font-bold text-accent-fg">
                ★ {formatRating(movie.voteAverage)}
              </span>
            )}
            {meta && <span>{meta}</span>}
          </p>
          <WatchProviders providers={movie.streamingProviders} link={movie.watchLink} />
          {movie.trailerKey && (
            <div>
              <TrailerModal trailerKey={movie.trailerKey} title={movie.title} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
```

Run: `npx vitest run src/components/details`
Expected: PASS.

- [ ] **Step 5: Rota de detalhes**

`src/app/filme/[id]/page.tsx`:
```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CastList } from '@/components/details/cast-list';
import { MovieHero } from '@/components/details/movie-hero';
import { parseMovieId } from '@/lib/movie-id';
import { getMovieDetails } from '@/lib/tmdb/movies';

type Props = { params: Promise<{ id: string }> };

async function loadMovie(rawId: string) {
  const id = parseMovieId(rawId);
  if (id === null) notFound();
  const movie = await getMovieDetails(id);
  if (!movie) notFound();
  return movie;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const movie = await loadMovie((await params).id);
  return { title: movie.title, description: movie.overview.slice(0, 160) || undefined };
}

export default async function MovieDetailsPage({ params }: Props) {
  const movie = await loadMovie((await params).id);
  return (
    <>
      <MovieHero movie={movie} />
      <section className="mt-10 max-w-3xl">
        <h2 className="text-lg font-semibold">Sinopse</h2>
        <p className="mt-2 leading-relaxed text-muted">{movie.overview || 'Sinopse não disponível.'}</p>
      </section>
      {movie.cast.length > 0 && <CastList cast={movie.cast} />}
    </>
  );
}
```

`src/app/filme/[id]/not-found.tsx`:
```tsx
import Link from 'next/link';
import { EmptyState, primaryActionClasses } from '@/components/empty-state';

export default function MovieNotFound() {
  return (
    <EmptyState
      title="Filme não encontrado"
      description="O link pode estar errado ou o filme foi removido do TMDB."
      action={<Link href="/" className={primaryActionClasses}>Voltar ao catálogo</Link>}
    />
  );
}
```

`src/app/filme/[id]/error.tsx`:
```tsx
'use client';

import { EmptyState, primaryActionClasses } from '@/components/empty-state';

export default function MovieError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <EmptyState
      title="Algo deu errado"
      description="Não conseguimos carregar este filme agora."
      action={
        <button type="button" onClick={reset} className={primaryActionClasses}>
          Tentar de novo
        </button>
      }
    />
  );
}
```

- [ ] **Step 6: Verificação automática e manual**

Run: `npm test && npm run lint && npm run build`
Expected: tudo passa.

Com `npm run dev` rodando:
```bash
curl -s http://localhost:3000/filme/438631 | grep -o '<h1[^>]*>[^<]*' | head -1
curl -s http://localhost:3000/filme/abc | grep -o 'Filme não encontrado' | head -1
curl -s http://localhost:3000/filme/999999999 | grep -o 'Filme não encontrado' | head -1
```
Expected: o primeiro imprime o `<h1>` com "Duna"; os outros dois imprimem "Filme não encontrado". Abra a página de um filme no navegador e teste o trailer: abrir, fechar com Esc e clicar fora.

- [ ] **Step 7: Commit**

```bash
git add src/lib/movie-id.ts src/lib/movie-id.test.ts src/components/details src/app/filme
git commit -m "feat: página de detalhes com hero, onde assistir, trailer e elenco" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Testes E2E com Playwright e job no CI

**Files:**
- Create: `playwright.config.ts`, `e2e/mock-tmdb-server.ts`, `e2e/specs/catalog.spec.ts`, `e2e/specs/search-details.spec.ts`, `e2e/specs/infinite-scroll.spec.ts`
- Modify: `package.json` (script), `.github/workflows/ci.yml`, `.prettierignore` (nada a mudar se já ignorar `playwright-report`/`test-results`)

**Interfaces:**
- Consumes: `handlers` de `tests/msw/handlers.ts` e as fixtures (Task 4). O app lê `TMDB_API_BASE_URL` (Task 3).
- Produces: script `npm run test:e2e`; job `e2e` no CI.

- [ ] **Step 1: Dependências**

```bash
npm i -D @playwright/test @mswjs/http-middleware tsx
npx playwright install chromium
```

- [ ] **Step 2: Servidor mock do TMDB**

`e2e/mock-tmdb-server.ts`:
```ts
import { createServer } from '@mswjs/http-middleware';
import { handlers } from '../tests/msw/handlers';

const port = Number(process.env.MOCK_TMDB_PORT ?? 4010);

createServer(...handlers).listen(port, () => {
  console.log(`Mock do TMDB em http://localhost:${port}/3`);
});
```

- [ ] **Step 3: Configuração do Playwright**

`playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test';

const MOCK_PORT = 4010;
const APP_PORT = 3100;

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: `http://localhost:${APP_PORT}`, trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npx tsx e2e/mock-tmdb-server.ts',
      url: `http://localhost:${MOCK_PORT}/3/genre/movie/list`,
      env: { MOCK_TMDB_PORT: String(MOCK_PORT) },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npm run build && npm run start -- -p ${APP_PORT}`,
      url: `http://localhost:${APP_PORT}`,
      env: { TMDB_READ_TOKEN: 'e2e-token', TMDB_API_BASE_URL: `http://localhost:${MOCK_PORT}/3` },
      timeout: 240_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

Em `package.json`, adicione `"test:e2e": "playwright test"` aos scripts.

**Atenção:** o build do E2E usa o mock, e o cache de `fetch` do Next fica em `.next/cache`. Depois de rodar o E2E, rode `rm -rf .next` antes de `npm run dev` contra a API real, para não servir dados do mock do cache.

- [ ] **Step 4: Specs**

`e2e/specs/catalog.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test('filtra por Netflix e Terror e reflete na URL', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Filme 1001/ })).toBeVisible();

  await page.getByRole('button', { name: 'Netflix' }).click();
  await expect(page).toHaveURL(/\/\?p=8$/);
  await expect(page.getByRole('button', { name: 'Netflix' })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Terror' }).click();
  await expect(page).toHaveURL(/\/\?p=8&g=27$/);
  await expect(page.getByRole('link', { name: /Terror 1/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Filme 1001/ })).toHaveCount(0);
});

test('URL compartilhada reproduz os filtros', async ({ page }) => {
  await page.goto('/?p=8&g=27');
  await expect(page.getByRole('button', { name: 'Netflix' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Terror' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('link', { name: /Terror 3/ })).toBeVisible();

  await page.getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('link', { name: /Filme 1001/ })).toBeVisible();
});

test('mostra o rodapé de atribuição', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Este produto usa a API do TMDB mas não é endossado ou certificado pelo TMDB.', { exact: false })).toBeVisible();
});
```

`e2e/specs/search-details.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test('busca um título e abre os detalhes com "Onde assistir"', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Buscar filme' }).fill('duna');

  await expect(page).toHaveURL(/\/\?q=duna$/);
  await expect(page.getByRole('heading', { name: 'Resultados para “duna”' })).toBeVisible();
  const results = page.getByRole('main').getByRole('link', { name: /Duna/ });
  await expect(results).toHaveCount(1); // Parte Dois (só aluguel) e a versão de 1984 (só nos EUA) ficam de fora

  await results.click();
  await expect(page).toHaveURL(/\/filme\/438631$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Duna' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Onde assistir' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Max' })).toBeVisible();
  await expect(page.getByRole('button', { name: '▶ Ver trailer' })).toBeVisible();
});

test('ID de filme inválido ou inexistente mostra 404 amigável', async ({ page }) => {
  for (const path of ['/filme/abc', '/filme/-1', '/filme/999999']) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.getByText('Filme não encontrado')).toBeVisible();
  }
});
```

`e2e/specs/infinite-scroll.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test('rolagem infinita carrega a página 2 e para no fim', async ({ page }) => {
  await page.goto('/');
  const cards = page.getByRole('main').getByRole('listitem');
  await expect(cards.first()).toBeVisible();

  await page.getByRole('link', { name: /Filme 1020/ }).scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 5000);

  await expect(page.getByRole('link', { name: /Filme 1021/ })).toBeVisible();
  await expect(cards).toHaveCount(40);
});
```

- [ ] **Step 5: Rodar**

Run: `npm run test:e2e`
Expected: 6 testes passam. Se o spec de 404 falhar porque o status veio 200 (em alguns casos de streaming o Next responde 200 com o conteúdo do not-found), remova só a linha `expect(response?.status()).toBe(404)`, mantenha a verificação do texto e registre isso no relatório da task.

- [ ] **Step 6: Job de E2E no CI**

Acrescente em `.github/workflows/ci.yml`, no mesmo nível de `check:`:
```yaml
  e2e:
    runs-on: ubuntu-latest
    needs: check
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

- [ ] **Step 7: Verificar tudo e commitar**

```bash
npm run lint && npm run format:check && npm test && npm run typecheck
git add -A
git commit -m "test: E2E com Playwright contra mock do TMDB e job no CI" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Deploy na Vercel e README de portfólio

**Files:**
- Create: `README.md` (substitui o do scaffold), `docs/screenshots/catalogo.png`, `docs/screenshots/detalhes.png`

**Interfaces:**
- Consumes: o app completo; branch com PR aberto.

- [ ] **Step 1: Subir a branch e abrir PR**

```bash
git push -u origin HEAD
gh pr create --fill --base main
gh pr checks --watch
```
Expected: jobs `check` e `e2e` verdes. Se falharem, corrija antes de seguir (`gh run view --log-failed`).

- [ ] **Step 2: Conectar a Vercel (ação do usuário)**

Peça ao usuário:
1. Entrar em https://vercel.com/new com a conta do GitHub e importar `fabriciosribeiro/catalogo-filmes` (o framework Next.js é detectado sozinho).
2. Em *Environment Variables*, adicionar `TMDB_READ_TOKEN` com o token (Production e Preview).
3. Fazer o deploy e informar a URL de produção.

Depois disso, a Vercel passa a comentar a URL de preview em cada PR.

- [ ] **Step 3: Verificar produção**

Com a URL informada (`PROD`):
```bash
PROD=https://SUBSTITUA-pela-url.vercel.app
curl -s "$PROD/" -o /dev/null -w '%{http_code}\n'
curl -s "$PROD/?p=8&g=27" | grep -o 'Pôster de [^"]*' | head -3
curl -s "$PROD/filme/438631" | grep -o '<h1[^>]*>[^<]*'
curl -s "$PROD/" | grep -c "$(grep TMDB_READ_TOKEN .env.local | cut -d= -f2 | cut -c1-20)"
```
Expected: `200`; títulos reais de terror; `<h1>` com "Duna"; o último imprime `0` (o token não aparece no HTML).

- [ ] **Step 4: Screenshots**

```bash
mkdir -p docs/screenshots
npx playwright screenshot --viewport-size=1440,900 --wait-for-timeout=3000 "$PROD/?p=8" docs/screenshots/catalogo.png
npx playwright screenshot --viewport-size=1440,900 --wait-for-timeout=3000 "$PROD/filme/438631" docs/screenshots/detalhes.png
```
Abra as imagens (ferramenta Read) e confira se mostram pôsteres de verdade. Se não, aumente `--wait-for-timeout`.

- [ ] **Step 5: README**

`README.md` (substituir; troque `PROD_URL` pela URL real):
````markdown
# 🎬 EmCartaz

Catálogo dos filmes disponíveis **agora** nos serviços de streaming por assinatura no **Brasil**, com dados do [TMDB](https://www.themoviedb.org) e disponibilidade da JustWatch.

**Demo:** PROD_URL

![Catálogo](docs/screenshots/catalogo.png)
![Detalhes](docs/screenshots/detalhes.png)

## Funcionalidades

- Grade de pôsteres com rolagem infinita
- Filtro por plataforma (Netflix, Prime Video, Max, Disney+, Globoplay…), gênero e ano, com ordenação por popularidade, nota ou lançamento
- Busca por título, limitada ao que está em streaming
- Página do filme com sinopse, elenco, trailer e "onde assistir"
- Todo o estado fica na URL: dá para compartilhar um link como `/?p=8&g=27&ordem=nota`

## Stack

Next.js 15 (App Router, Server Components, Server Actions) · TypeScript strict · Tailwind CSS v4 · zod · Vitest + Testing Library + MSW · Playwright · GitHub Actions · Vercel

## Arquitetura

```mermaid
flowchart LR
  B[Navegador] -- URL com filtros --> P[Server Components<br/>app/page.tsx, app/filme/[id]]
  B -- rolagem infinita --> A[Server Action<br/>loadMore]
  P --> F[lib/filters<br/>URL ⇄ Filters]
  P --> T[lib/tmdb<br/>único ponto que fala com o TMDB]
  A --> T
  T -- fetch com revalidate<br/>token só no servidor --> API[(API do TMDB)]
  B -. imagens .-> CDN[(image.tmdb.org)]
```

- **`lib/tmdb` é a única fronteira com o TMDB.** Ela devolve tipos de domínio (`Movie`, `MovieDetails`…), e a UI nunca vê o formato cru da API.
- **`lib/filters` é a única fonte da verdade da URL.** A página lê a URL e os filtros escrevem nela.
- **Cache:** provedores e gêneros por 24h, listagens por 6h, detalhes por 24h.

## Decisões

| Decisão | Por quê |
|---|---|
| Só Brasil e só assinatura (`flatrate`) | Responde a "o que dá para assistir agora com o que eu assino" |
| Sem banco de dados | O discover do TMDB já filtra por plataforma, região e tipo; um índice próprio seria complexidade que o MVP ainda não pede |
| Limite de 500 páginas | É o teto do TMDB (10 mil filmes por combinação de filtros); ninguém rola tanto, e os filtros resolvem |
| Busca custa N+1 chamadas | O `/search` do TMDB não filtra por streaming, então cada um dos 20 resultados tem os provedores consultados em paralelo, com cache de 24h |
| Allowlist de plataformas | A lista de provedores do TMDB mistura lojas de aluguel (Google Play, Apple TV); a faixa mostra só serviços de assinatura |
| Server Action recebe a query string | É um endpoint público, então a entrada passa pelo mesmo parse/validação da URL |

## Rodando localmente

Requer Node 24 (`nvm use`) e um [token de leitura do TMDB](https://www.themoviedb.org/settings/api).

```bash
cp .env.example .env.local   # preencha TMDB_READ_TOKEN
npm install
npm run dev                  # http://localhost:3000
```

| Comando | O que faz |
|---|---|
| `npm test` | testes unitários e de integração (MSW, sem acesso à API real) |
| `npm run test:e2e` | Playwright contra um mock HTTP do TMDB |
| `npm run lint` / `npm run typecheck` | qualidade |

---

<img src="public/tmdb-logo.svg" alt="TMDB" width="120" />

Este produto usa a API do TMDB mas não é endossado ou certificado pelo TMDB. Dados de streaming fornecidos por JustWatch.
````

- [ ] **Step 6: Commit, push e merge (com confirmação do usuário)**

```bash
npm run format:check
git add README.md docs/screenshots
git commit -m "docs: README de portfólio com screenshots, arquitetura e decisões" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
gh pr checks --watch
```
Depois, siga a skill `superpowers:finishing-a-development-branch`. **Peça confirmação ao usuário antes de fazer merge na `main`.**

import { describe, expect, it } from 'vitest';
import {
  ALL_PROVIDERS,
  DEFAULT_FILTERS,
  hasActiveFilters,
  MAX_IDS_PER_FILTER,
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

  it('limita listas de IDs a MAX_IDS_PER_FILTER', () => {
    const ids = Array.from({ length: 30 }, (_, i) => i + 1);
    expect(parseFilters({ p: ids.join(',') }).providers).toEqual(ids.slice(0, MAX_IDS_PER_FILTER));
    expect(parseFilters({ p: ids.join(',') }).providers).toHaveLength(20);
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
    const filters: Filters = {
      providers: [8, 119],
      genres: [27],
      yearFrom: 2020,
      yearTo: 2025,
      sort: 'nota',
    };
    expect(serializeFilters(filters)).toBe('p=8,119&g=27&ano=2020-2025&ordem=nota');
  });

  it('serializa intervalos abertos', () => {
    expect(serializeFilters({ ...DEFAULT_FILTERS, yearFrom: 2020 })).toBe('ano=2020-');
    expect(serializeFilters({ ...DEFAULT_FILTERS, yearTo: 1999 })).toBe('ano=-1999');
  });

  it('em modo busca serializa só o termo, codificado', () => {
    expect(
      serializeFilters({ ...DEFAULT_FILTERS, providers: [8], query: 'velozes & furiosos #9' }),
    ).toBe('q=velozes%20%26%20furiosos%20%239');
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

describe('serializeFilters com explicitAllProviders', () => {
  it('escreve p=todas quando nenhuma plataforma está marcada', () => {
    expect(
      serializeFilters({ ...DEFAULT_FILTERS, genres: [27] }, { explicitAllProviders: true }),
    ).toBe(`p=${ALL_PROVIDERS}&g=27`);
  });

  it('não muda nada quando há plataformas marcadas', () => {
    expect(
      serializeFilters({ ...DEFAULT_FILTERS, providers: [8] }, { explicitAllProviders: true }),
    ).toBe('p=8');
  });

  it('busca ignora o marcador', () => {
    expect(
      serializeFilters({ ...DEFAULT_FILTERS, query: 'duna' }, { explicitAllProviders: true }),
    ).toBe('q=duna');
  });

  it('p=todas é lido como "sem filtro de plataforma"', () => {
    expect(parseFilters({ p: 'todas' }).providers).toEqual([]);
  });
});

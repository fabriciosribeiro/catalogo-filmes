import { describe, expect, it } from 'vitest';
import type { SearchParamsInput } from './filters';
import { resolveProviderRedirect } from './provider-redirect';

describe('resolveProviderRedirect', () => {
  it('sem p na URL, aplica as plataformas salvas', () => {
    expect(resolveProviderRedirect({}, [8, 119])).toBe('/?p=8,119');
  });

  it('preserva gênero, ano e ordem', () => {
    expect(resolveProviderRedirect({ g: '27', ano: '2000-2010', ordem: 'nota' }, [8])).toBe(
      '/?p=8&g=27&ano=2000-2010&ordem=nota',
    );
  });

  it.each<[SearchParamsInput, string]>([
    [{ p: 'todas' }, 'p=todas'],
    [{ p: '337' }, 'p explícito'],
    [{ p: '' }, 'p vazio'],
    [{ q: 'duna' }, 'busca'],
  ])('não redireciona com %j (%s)', (params) => {
    expect(resolveProviderRedirect(params, [8])).toBeNull();
  });

  it('sem plataformas salvas, não redireciona', () => {
    expect(resolveProviderRedirect({}, [])).toBeNull();
  });
});

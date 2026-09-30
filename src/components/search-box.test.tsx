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
    // @testing-library/react's asyncWrapper (from tests/setup.ts's `cleanup` import) only
    // self-advances a pending 0ms timer when it detects Jest fake timers (`typeof jest !==
    // 'undefined'`). Under Vitest that check is always false, so without this shim every
    // userEvent interaction deadlocks: it awaits that 0ms timer, but our test code is itself
    // suspended awaiting the interaction, so `vi.advanceTimersByTime` never gets a chance to
    // run. A minimal `jest.advanceTimersByTime` shim routed through Vitest's own fake clock
    // closes that gap without relying on any wall-clock auto-advance.
    (globalThis as unknown as { jest?: { advanceTimersByTime: (ms: number) => unknown } }).jest = {
      advanceTimersByTime: (ms) => vi.advanceTimersByTime(ms),
    };
    nav.pathname = '/';
    nav.searchParams = new URLSearchParams();
  });
  afterEach(() => {
    vi.useRealTimers();
    delete (globalThis as unknown as { jest?: unknown }).jest;
  });

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

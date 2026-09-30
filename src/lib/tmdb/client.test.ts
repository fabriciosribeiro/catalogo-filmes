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
    await expect(tmdbFetch('/teste', {}, opts)).rejects.toThrow(
      'TMDB_READ_TOKEN não está configurado',
    );
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

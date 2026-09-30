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

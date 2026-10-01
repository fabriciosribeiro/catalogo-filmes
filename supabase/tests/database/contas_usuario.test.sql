begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

-- Usuários A e B. Os dados do B são criados como postgres (dono das tabelas, ignora RLS).
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@teste.dev'),
  ('00000000-0000-0000-0000-00000000000b', 'b@teste.dev');
insert into public.watchlist (user_id, tmdb_id)
  values ('00000000-0000-0000-0000-00000000000b', 550);
insert into public.user_providers (user_id, provider_ids)
  values ('00000000-0000-0000-0000-00000000000b', '{8}');

-- ---------- Como usuário A ----------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select lives_ok(
  $$ insert into public.watchlist (user_id, tmdb_id) values ('00000000-0000-0000-0000-00000000000a', 603) $$,
  'A salva um filme na própria lista'
);
select results_eq(
  $$ select tmdb_id from public.watchlist $$,
  array[603],
  'A só enxerga a própria lista'
);
select throws_ok(
  $$ insert into public.watchlist (user_id, tmdb_id) values ('00000000-0000-0000-0000-00000000000b', 680) $$,
  '42501', null,
  'A não insere na lista do B'
);
select is(
  (select count(*)::int from public.user_providers),
  0,
  'A não enxerga as plataformas do B'
);
select lives_ok(
  $$ insert into public.user_providers (user_id, provider_ids) values ('00000000-0000-0000-0000-00000000000a', '{8,119}') $$,
  'A salva as próprias plataformas'
);

-- Tentativas silenciosas (RLS filtra as linhas; nada é afetado)
delete from public.watchlist where user_id = '00000000-0000-0000-0000-00000000000b';
update public.user_providers set provider_ids = '{119}'
  where user_id = '00000000-0000-0000-0000-00000000000b';

reset role;
select is(
  (select count(*)::int from public.watchlist where user_id = '00000000-0000-0000-0000-00000000000b'),
  1,
  'delete do A não afetou a lista do B'
);
select is(
  (select provider_ids from public.user_providers where user_id = '00000000-0000-0000-0000-00000000000b'),
  '{8}'::int[],
  'update do A não afetou as plataformas do B'
);

-- ---------- Limites ----------
-- A já tem 603; mais 99 completam 100
insert into public.watchlist (user_id, tmdb_id)
  select '00000000-0000-0000-0000-00000000000a', g from generate_series(1, 99) as g;

set local role authenticated;
select throws_ok(
  $$ insert into public.watchlist (user_id, tmdb_id) values ('00000000-0000-0000-0000-00000000000a', 999) $$,
  'EC001', null,
  'o 101º filme é recusado'
);
select lives_ok(
  $$ insert into public.watchlist (user_id, tmdb_id) values ('00000000-0000-0000-0000-00000000000a', 603) on conflict do nothing $$,
  'salvar de novo um filme já salvo, com a lista cheia, não falha'
);
select throws_ok(
  $$ update public.user_providers set provider_ids = array(select generate_series(1, 21))
     where user_id = '00000000-0000-0000-0000-00000000000a' $$,
  '23514', null,
  'mais de 20 plataformas é recusado'
);

-- ---------- Visitante anônimo ----------
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok(
  $$ select * from public.watchlist $$,
  '42501', null,
  'anon não tem acesso à lista'
);

select * from finish();
rollback;

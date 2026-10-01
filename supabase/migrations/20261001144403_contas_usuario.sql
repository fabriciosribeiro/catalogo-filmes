-- Minha lista: filmes do TMDB salvos por usuário. Os detalhes vêm do TMDB (cache de 24h).
create table public.watchlist (
  user_id    uuid not null references auth.users (id) on delete cascade,
  tmdb_id    integer not null check (tmdb_id > 0),
  created_at timestamptz not null default now(),
  primary key (user_id, tmdb_id)
);

-- Minhas plataformas: sempre lidas e gravadas inteiras; o limite espelha MAX_IDS_PER_FILTER.
create table public.user_providers (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  provider_ids integer[] not null default '{}' check (cardinality(provider_ids) <= 20),
  updated_at   timestamptz not null default now()
);

alter table public.watchlist enable row level security;
alter table public.user_providers enable row level security;

-- Visitantes anônimos não têm nada a fazer nessas tabelas
revoke all on public.watchlist, public.user_providers from anon;

create policy "watchlist: dono lê" on public.watchlist
  for select to authenticated using (user_id = (select auth.uid()));
create policy "watchlist: dono insere" on public.watchlist
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "watchlist: dono apaga" on public.watchlist
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "user_providers: dono lê" on public.user_providers
  for select to authenticated using (user_id = (select auth.uid()));
create policy "user_providers: dono insere" on public.user_providers
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "user_providers: dono altera" on public.user_providers
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Limite de 100 filmes por usuário. Re-salvar um filme que já está na lista não conta
-- (o insert vira no-op pelo "on conflict do nothing").
create function public.enforce_watchlist_limit() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- serializa inserts simultâneos do mesmo usuário
  perform pg_advisory_xact_lock(hashtext(new.user_id::text));
  if (
    select count(*) from public.watchlist w
    where w.user_id = new.user_id and w.tmdb_id <> new.tmdb_id
  ) >= 100 then
    raise exception 'watchlist_limit' using errcode = 'EC001';
  end if;
  return new;
end;
$$;

create trigger watchlist_limit
  before insert on public.watchlist
  for each row execute function public.enforce_watchlist_limit();

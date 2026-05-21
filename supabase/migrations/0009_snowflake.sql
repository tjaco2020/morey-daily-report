-- =============================================================
-- 0009 — Snowflake metrics support
-- Adds:
--   * snowflake_query_logs — audit trail of every metrics fetch
--   * product_category_mappings — raw → display category mapping
-- Safe to re-run.
-- =============================================================

create table if not exists public.snowflake_query_logs (
  id              uuid primary key default gen_random_uuid(),
  query_label     text not null,                  -- e.g. 'transactions', 'tickets_by_category'
  query_date      date,                            -- the business date being queried
  source          text not null default 'mock',    -- 'mock' | 'snowflake'
  status          text not null,                   -- 'success' | 'error'
  duration_ms     int,
  rows_returned   int,
  error_message   text,
  created_at      timestamptz not null default now()
);

create index if not exists sql_logs_date_idx   on public.snowflake_query_logs(query_date);
create index if not exists sql_logs_status_idx on public.snowflake_query_logs(status);

alter table public.snowflake_query_logs enable row level security;

drop policy if exists "sql_logs_select_sup" on public.snowflake_query_logs;
create policy "sql_logs_select_sup" on public.snowflake_query_logs for select
  using (public.is_supervisor_or_above());

drop policy if exists "sql_logs_insert_sup" on public.snowflake_query_logs;
create policy "sql_logs_insert_sup" on public.snowflake_query_logs for insert
  with check (public.is_supervisor_or_above());

create table if not exists public.product_category_mappings (
  id              uuid primary key default gen_random_uuid(),
  source_category text not null unique,           -- raw Snowflake value
  display_name    text not null,                  -- shown on PDF / dashboard
  display_order   int not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists pcm_active_idx on public.product_category_mappings(active);

drop trigger if exists pcm_set_updated_at on public.product_category_mappings;
create trigger pcm_set_updated_at
  before update on public.product_category_mappings
  for each row execute function public.set_updated_at();

alter table public.product_category_mappings enable row level security;

drop policy if exists "pcm_select_auth" on public.product_category_mappings;
create policy "pcm_select_auth" on public.product_category_mappings for select
  using (auth.uid() is not null);

drop policy if exists "pcm_manage_mgr" on public.product_category_mappings;
create policy "pcm_manage_mgr" on public.product_category_mappings for all
  using (public.is_manager())
  with check (public.is_manager());

-- Seed sensible defaults so mock data and (later) real data have display names.
insert into public.product_category_mappings (source_category, display_name, display_order) values
  ('DAY_PASS',         'Day Pass',         10),
  ('HALF_DAY_PASS',    'Half Day Pass',    20),
  ('SEASON_PASS',      'Season Pass',      30),
  ('BEACH_PASS',       'Beach Pass',       40),
  ('CABANA_RENTAL',    'Cabana Rental',    50),
  ('SPECIAL_EVENT',    'Special Event',    60),
  ('OTHER',            'Other',            99)
on conflict (source_category) do nothing;

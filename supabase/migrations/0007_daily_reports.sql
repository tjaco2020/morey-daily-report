-- =============================================================
-- 0007 — Daily reports + inclusion mapping
-- Supervisor-only tables that hold the day's curated report set,
-- supervisor notes, and (later) AI summary / weather / metrics /
-- PDF / send info snapshots.
-- Safe to re-run.
-- =============================================================

create table if not exists public.daily_reports (
  id                 uuid primary key default gen_random_uuid(),
  report_date        date not null unique,                -- one daily_report per date
  status             text not null default 'draft',       -- 'draft' | 'sent'
  supervisor_notes   text,
  ai_summary         text,
  weather_snapshot   jsonb,
  metrics_snapshot   jsonb,
  email_recipients   jsonb,
  pdf_storage_path   text,
  created_by         uuid references public.profiles(id),
  sent_by            uuid references public.profiles(id),
  sent_at            timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists daily_reports_date_idx   on public.daily_reports(report_date);
create index if not exists daily_reports_status_idx on public.daily_reports(status);

drop trigger if exists daily_reports_set_updated_at on public.daily_reports;
create trigger daily_reports_set_updated_at
  before update on public.daily_reports
  for each row execute function public.set_updated_at();

create table if not exists public.daily_report_items (
  id                uuid primary key default gen_random_uuid(),
  daily_report_id   uuid not null references public.daily_reports(id) on delete cascade,
  report_id         uuid not null references public.reports(id) on delete cascade,
  override_text     text,
  display_position  int default 0,
  added_by          uuid references public.profiles(id),
  created_at        timestamptz not null default now(),
  unique (daily_report_id, report_id)
);

create index if not exists dri_dr_idx     on public.daily_report_items(daily_report_id);
create index if not exists dri_report_idx on public.daily_report_items(report_id);

-- Backfill FK constraint declared loosely in Phase 2.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'reports_daily_report_id_fkey'
  ) then
    alter table public.reports
      add constraint reports_daily_report_id_fkey
      foreign key (daily_report_id) references public.daily_reports(id)
      on delete set null;
  end if;
end $$;

-- ---------- RLS ----------

alter table public.daily_reports      enable row level security;
alter table public.daily_report_items enable row level security;

drop policy if exists "dr_select_sup" on public.daily_reports;
create policy "dr_select_sup" on public.daily_reports for select
  using (public.is_supervisor_or_above());

drop policy if exists "dr_insert_sup" on public.daily_reports;
create policy "dr_insert_sup" on public.daily_reports for insert
  with check (public.is_supervisor_or_above());

drop policy if exists "dr_update_sup" on public.daily_reports;
create policy "dr_update_sup" on public.daily_reports for update
  using (public.is_supervisor_or_above())
  with check (public.is_supervisor_or_above());

drop policy if exists "dr_delete_mgr" on public.daily_reports;
create policy "dr_delete_mgr" on public.daily_reports for delete
  using (public.is_manager());

drop policy if exists "dri_select_sup" on public.daily_report_items;
create policy "dri_select_sup" on public.daily_report_items for select
  using (public.is_supervisor_or_above());

drop policy if exists "dri_insert_sup" on public.daily_report_items;
create policy "dri_insert_sup" on public.daily_report_items for insert
  with check (public.is_supervisor_or_above());

drop policy if exists "dri_update_sup" on public.daily_report_items;
create policy "dri_update_sup" on public.daily_report_items for update
  using (public.is_supervisor_or_above())
  with check (public.is_supervisor_or_above());

drop policy if exists "dri_delete_sup" on public.daily_report_items;
create policy "dri_delete_sup" on public.daily_report_items for delete
  using (public.is_supervisor_or_above());

-- ---------- HELPER RPC ----------

create or replace function public.get_or_create_daily_report(p_date date)
returns public.daily_reports
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_row public.daily_reports;
begin
  if not public.is_supervisor_or_above() then
    raise exception 'Supervisor role required';
  end if;

  select * into v_row from public.daily_reports where report_date = p_date;
  if v_row.id is not null then
    return v_row;
  end if;

  insert into public.daily_reports (report_date, created_by, status)
  values (p_date, auth.uid(), 'draft')
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.get_or_create_daily_report(date) to authenticated;

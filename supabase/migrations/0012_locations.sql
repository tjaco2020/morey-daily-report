-- =============================================================
-- 0012 — Locations (Pier-level groupings of terminals)
--
-- Adds:
--   * locations table (Mariner's Pier, Surfside Pier, Adventure Pier,
--     Retail, Other — seeded)
--   * terminals.location_id (FK to locations)
--   * reports.terminal_location_id (denormalized for fast filtering)
--   * Two triggers that keep reports.terminal_location_id in sync when
--     a report's terminal changes OR when a terminal's location changes
--
-- Existing terminals are best-effort mapped to locations by name.
-- Safe to re-run.
-- =============================================================

create table if not exists public.locations (
  id            uuid primary key default gen_random_uuid(),
  name          text unique not null,
  display_order int not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists locations_active_idx on public.locations(active);

drop trigger if exists locations_set_updated_at on public.locations;
create trigger locations_set_updated_at
  before update on public.locations
  for each row execute function public.set_updated_at();

-- ----- RLS -----
alter table public.locations enable row level security;

drop policy if exists "loc_read_all_auth" on public.locations;
create policy "loc_read_all_auth" on public.locations for select
  using (auth.uid() is not null);

drop policy if exists "loc_insert_mgr" on public.locations;
create policy "loc_insert_mgr" on public.locations for insert
  with check (public.is_manager());

drop policy if exists "loc_update_mgr" on public.locations;
create policy "loc_update_mgr" on public.locations for update
  using (public.is_manager()) with check (public.is_manager());

drop policy if exists "loc_delete_mgr" on public.locations;
create policy "loc_delete_mgr" on public.locations for delete
  using (public.is_manager());

-- ----- Add location_id to terminals -----
alter table public.terminals
  add column if not exists location_id uuid references public.locations(id) on delete set null;

create index if not exists terminals_location_idx on public.terminals(location_id);

-- ----- Add denormalized terminal_location_id to reports -----
alter table public.reports
  add column if not exists terminal_location_id uuid references public.locations(id) on delete set null;

create index if not exists reports_terminal_location_idx
  on public.reports(terminal_location_id);

-- ----- Seed locations -----
insert into public.locations (name, display_order) values
  ('Mariner''s Pier',  10),
  ('Surfside Pier',    20),
  ('Adventure Pier',   30),
  ('Retail',           40),
  ('Other',            99)
on conflict (name) do nothing;

-- ----- Map existing terminals to seeded locations (best-effort by name) -----
update public.terminals
  set location_id = (select id from public.locations where name = 'Mariner''s Pier')
  where name in ('GS61', 'GS62', 'GS63', 'Mariner''s');

update public.terminals
  set location_id = (select id from public.locations where name = 'Surfside Pier')
  where name in ('Surfside');

update public.terminals
  set location_id = (select id from public.locations where name = 'Adventure Pier')
  where name in ('Adventure Pier');

update public.terminals
  set location_id = (select id from public.locations where name = 'Other')
  where name in ('Guest Services', 'Ticket Booth', 'Food Stand', 'Other');

-- ----- Trigger 1: on report insert/update, sync terminal_location_id -----
create or replace function public.sync_report_terminal_location()
returns trigger
language plpgsql
as $$
begin
  if new.terminal_id is null then
    new.terminal_location_id := null;
  else
    select location_id into new.terminal_location_id
    from public.terminals
    where id = new.terminal_id;
  end if;
  return new;
end;
$$;

drop trigger if exists reports_sync_terminal_location on public.reports;
create trigger reports_sync_terminal_location
  before insert or update of terminal_id on public.reports
  for each row execute function public.sync_report_terminal_location();

-- ----- Trigger 2: when a terminal's location_id changes, update its reports -----
create or replace function public.sync_reports_on_terminal_location_change()
returns trigger
language plpgsql
as $$
begin
  if new.location_id is distinct from old.location_id then
    update public.reports
    set terminal_location_id = new.location_id
    where terminal_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists terminals_sync_reports_on_loc_change on public.terminals;
create trigger terminals_sync_reports_on_loc_change
  after update of location_id on public.terminals
  for each row execute function public.sync_reports_on_terminal_location_change();

-- ----- Backfill existing reports -----
update public.reports r
  set terminal_location_id = t.location_id
  from public.terminals t
  where r.terminal_id = t.id
    and r.terminal_location_id is null;

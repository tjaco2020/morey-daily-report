-- =============================================================
-- 0016 — Departments + Outlets (multi-tenancy v1)
--
-- Adds:
--   * departments        — functional groupings (Admissions, F&B, Retail, …)
--   * outlets            — specific business units (Mariner's Pizza, Kong Store, …)
--   * profiles columns   — primary_outlet_id, primary_department_id
--   * supervisor_outlet_assignments — supervisors that cover multiple outlets
--   * reports.outlet_id   (auto-populated by trigger from terminal/user)
--   * terminals.outlet_id (each POS belongs to an outlet, optional)
--
-- RLS:
--   * anyone authed can read departments + outlets (needed for dropdowns)
--   * managers manage all of the above
--   * supervisors+ can read supervisor_outlet_assignments
--
-- Safe to re-run.
-- =============================================================

create table if not exists public.departments (
  id            uuid primary key default gen_random_uuid(),
  name          text unique not null,
  description   text,
  display_order int not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists departments_active_idx on public.departments(active);

drop trigger if exists departments_set_updated_at on public.departments;
create trigger departments_set_updated_at
  before update on public.departments
  for each row execute function public.set_updated_at();

create table if not exists public.outlets (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  department_id uuid not null references public.departments(id) on delete cascade,
  location_id   uuid references public.locations(id) on delete set null,
  display_order int not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (department_id, name)
);

create index if not exists outlets_department_idx on public.outlets(department_id);
create index if not exists outlets_location_idx   on public.outlets(location_id);
create index if not exists outlets_active_idx     on public.outlets(active);

drop trigger if exists outlets_set_updated_at on public.outlets;
create trigger outlets_set_updated_at
  before update on public.outlets
  for each row execute function public.set_updated_at();

-- Profile assignment columns
alter table public.profiles
  add column if not exists primary_outlet_id     uuid references public.outlets(id),
  add column if not exists primary_department_id uuid references public.departments(id);

create index if not exists profiles_outlet_idx     on public.profiles(primary_outlet_id);
create index if not exists profiles_department_idx on public.profiles(primary_department_id);

-- Supervisor multi-outlet assignment table
create table if not exists public.supervisor_outlet_assignments (
  id            uuid primary key default gen_random_uuid(),
  supervisor_id uuid not null references public.profiles(id) on delete cascade,
  outlet_id     uuid not null references public.outlets(id) on delete cascade,
  created_at    timestamptz default now(),
  unique (supervisor_id, outlet_id)
);

create index if not exists soa_supervisor_idx on public.supervisor_outlet_assignments(supervisor_id);
create index if not exists soa_outlet_idx     on public.supervisor_outlet_assignments(outlet_id);

-- Reports + terminals get outlet
alter table public.reports
  add column if not exists outlet_id uuid references public.outlets(id);
create index if not exists reports_outlet_idx on public.reports(outlet_id);

alter table public.terminals
  add column if not exists outlet_id uuid references public.outlets(id);
create index if not exists terminals_outlet_idx on public.terminals(outlet_id);

-- ---------- Auto-populate reports.outlet_id ----------
-- On insert, infer the outlet from:
--   1. the report's terminal (terminals.outlet_id), OR
--   2. the user's primary outlet (profiles.primary_outlet_id)
-- The widget doesn't need a separate Outlet selector — it's implicit.

create or replace function public.sync_report_outlet()
returns trigger
language plpgsql
as $$
begin
  if new.outlet_id is null then
    if new.terminal_id is not null then
      select outlet_id into new.outlet_id from public.terminals where id = new.terminal_id;
    end if;
    if new.outlet_id is null and new.user_id is not null then
      select primary_outlet_id into new.outlet_id from public.profiles where id = new.user_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists reports_sync_outlet on public.reports;
create trigger reports_sync_outlet
  before insert on public.reports
  for each row execute function public.sync_report_outlet();

-- ---------- RLS ----------
alter table public.departments                    enable row level security;
alter table public.outlets                        enable row level security;
alter table public.supervisor_outlet_assignments  enable row level security;

drop policy if exists "dept_read_auth"   on public.departments;
drop policy if exists "dept_manage_mgr"  on public.departments;
create policy "dept_read_auth"   on public.departments for select using (auth.uid() is not null);
create policy "dept_manage_mgr"  on public.departments for all
  using (public.is_manager()) with check (public.is_manager());

drop policy if exists "outlet_read_auth"   on public.outlets;
drop policy if exists "outlet_manage_mgr"  on public.outlets;
create policy "outlet_read_auth"   on public.outlets for select using (auth.uid() is not null);
create policy "outlet_manage_mgr"  on public.outlets for all
  using (public.is_manager()) with check (public.is_manager());

drop policy if exists "soa_read_sup"    on public.supervisor_outlet_assignments;
drop policy if exists "soa_manage_mgr"  on public.supervisor_outlet_assignments;
create policy "soa_read_sup"    on public.supervisor_outlet_assignments for select
  using (public.is_supervisor_or_above());
create policy "soa_manage_mgr"  on public.supervisor_outlet_assignments for all
  using (public.is_manager()) with check (public.is_manager());

-- ---------- Seed default departments ----------
insert into public.departments (name, display_order) values
  ('Admissions',     10),
  ('F&B',            20),
  ('Retail',         30),
  ('Operations',     40),
  ('Maintenance',    50),
  ('Safety',         60),
  ('Guest Services', 70),
  ('IT',             80),
  ('Other',          99)
on conflict (name) do nothing;

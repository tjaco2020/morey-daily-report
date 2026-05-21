-- =============================================================
-- Morey's Daily Report Tool — Phase 1 schema
-- Run this in: Supabase Dashboard → SQL Editor → New query → Paste → Run
-- Safe to re-run (uses IF NOT EXISTS / ON CONFLICT throughout).
-- =============================================================

-- ---------- EXTENSIONS ----------
create extension if not exists "pgcrypto";

-- ---------- ROLE ENUM ----------
do $$
begin
  create type public.user_role as enum ('user', 'supervisor', 'manager');
exception when duplicate_object then null;
end $$;

-- ---------- PROFILES ----------
-- One row per authenticated user. Linked to auth.users.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  full_name   text,
  role        public.user_role not null default 'user',
  pin_hash    text,                                  -- set in Phase 2 for quick-PIN mode
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists profiles_role_idx   on public.profiles(role);
create index if not exists profiles_active_idx on public.profiles(active);

-- ---------- CATEGORIES ----------
create table if not exists public.categories (
  id            uuid primary key default gen_random_uuid(),
  name          text unique not null,
  display_order int not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ---------- TERMINALS ----------
create table if not exists public.terminals (
  id          uuid primary key default gen_random_uuid(),
  name        text unique not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- APP SETTINGS ----------
create table if not exists public.app_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id)
);

-- ---------- TRIGGERS ----------

-- Auto-create a profile row when a new auth.user is inserted.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update profiles.updated_at on row change.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------- HELPER FUNCTIONS FOR RLS ----------

create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_supervisor_or_above()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role in ('supervisor', 'manager') from public.profiles where id = auth.uid()),
    false
  )
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'manager' from public.profiles where id = auth.uid()),
    false
  )
$$;

-- ---------- ROW LEVEL SECURITY ----------

alter table public.profiles     enable row level security;
alter table public.categories   enable row level security;
alter table public.terminals    enable row level security;
alter table public.app_settings enable row level security;

-- profiles
drop policy if exists "profiles_select_self"            on public.profiles;
drop policy if exists "profiles_select_supervisors"     on public.profiles;
drop policy if exists "profiles_update_self_basic"      on public.profiles;
drop policy if exists "profiles_update_manager"         on public.profiles;

create policy "profiles_select_self"
  on public.profiles for select using (auth.uid() = id);

create policy "profiles_select_supervisors"
  on public.profiles for select using (public.is_supervisor_or_above());

create policy "profiles_update_self_basic"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid())
  );

create policy "profiles_update_manager"
  on public.profiles for update
  using (public.is_manager())
  with check (public.is_manager());

-- categories
drop policy if exists "categories_read_all_auth" on public.categories;
drop policy if exists "categories_insert_sup"   on public.categories;
drop policy if exists "categories_update_sup"   on public.categories;
drop policy if exists "categories_delete_mgr"   on public.categories;

create policy "categories_read_all_auth"
  on public.categories for select using (auth.uid() is not null);

create policy "categories_insert_sup"
  on public.categories for insert with check (public.is_supervisor_or_above());

create policy "categories_update_sup"
  on public.categories for update
  using (public.is_supervisor_or_above())
  with check (public.is_supervisor_or_above());

create policy "categories_delete_mgr"
  on public.categories for delete using (public.is_manager());

-- terminals (mirror)
drop policy if exists "terminals_read_all_auth" on public.terminals;
drop policy if exists "terminals_insert_sup"    on public.terminals;
drop policy if exists "terminals_update_sup"    on public.terminals;
drop policy if exists "terminals_delete_mgr"    on public.terminals;

create policy "terminals_read_all_auth"
  on public.terminals for select using (auth.uid() is not null);

create policy "terminals_insert_sup"
  on public.terminals for insert with check (public.is_supervisor_or_above());

create policy "terminals_update_sup"
  on public.terminals for update
  using (public.is_supervisor_or_above())
  with check (public.is_supervisor_or_above());

create policy "terminals_delete_mgr"
  on public.terminals for delete using (public.is_manager());

-- app_settings
drop policy if exists "settings_read_all_auth" on public.app_settings;
drop policy if exists "settings_manage_mgr"    on public.app_settings;

create policy "settings_read_all_auth"
  on public.app_settings for select using (auth.uid() is not null);

create policy "settings_manage_mgr"
  on public.app_settings for all
  using (public.is_manager())
  with check (public.is_manager());

-- ---------- SEED DATA ----------

insert into public.categories (name, display_order) values
  ('IT', 10),
  ('Guest', 20),
  ('Associate', 30),
  ('Operations', 40),
  ('Safety', 50),
  ('Maintenance', 60),
  ('Food & Beverage', 70),
  ('Retail', 80),
  ('Other', 90)
on conflict (name) do nothing;

insert into public.terminals (name) values
  ('GS61'),
  ('GS62'),
  ('GS63'),
  ('Mariner''s'),
  ('Surfside'),
  ('Adventure Pier'),
  ('Guest Services'),
  ('Ticket Booth'),
  ('Food Stand'),
  ('Other')
on conflict (name) do nothing;

insert into public.app_settings (key, value) values
  ('automation_enabled',       'true'::jsonb),
  ('daily_report_recipients',  '[]'::jsonb)
on conflict (key) do nothing;

-- =============================================================
-- DONE. Verify by running:
--   select * from public.categories order by display_order;
--   select * from public.terminals order by name;
-- =============================================================

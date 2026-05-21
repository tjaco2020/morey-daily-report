-- =============================================================
-- 0014 — Share groups (ad-hoc report sharing to people / groups)
-- Adds:
--   * share_groups               — named groups (e.g. "Supervisors")
--   * share_group_members        — emails belonging to each group
--   * share_history              — audit of who shared what to whom
-- Seeds three sensible defaults (members empty — manager fills in).
-- Safe to re-run.
-- =============================================================

create table if not exists public.share_groups (
  id          uuid primary key default gen_random_uuid(),
  name        text unique not null,
  description text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists share_groups_active_idx on public.share_groups(active);

drop trigger if exists share_groups_set_updated_at on public.share_groups;
create trigger share_groups_set_updated_at
  before update on public.share_groups
  for each row execute function public.set_updated_at();

create table if not exists public.share_group_members (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.share_groups(id) on delete cascade,
  email      text not null,
  name       text,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  unique (group_id, email)
);

create index if not exists sgm_group_idx  on public.share_group_members(group_id);
create index if not exists sgm_active_idx on public.share_group_members(active);

create table if not exists public.share_history (
  id                 uuid primary key default gen_random_uuid(),
  shared_by          uuid references public.profiles(id),
  group_id           uuid references public.share_groups(id),
  recipient_emails   jsonb not null,        -- [{email, name?}]
  report_ids         uuid[] not null,
  message            text,
  resend_message_id  text,
  created_at         timestamptz not null default now()
);

create index if not exists share_history_actor_idx on public.share_history(shared_by);
create index if not exists share_history_group_idx on public.share_history(group_id);

-- ----- RLS -----

alter table public.share_groups        enable row level security;
alter table public.share_group_members enable row level security;
alter table public.share_history       enable row level security;

-- Groups + members: any authenticated user can read; only managers manage.
drop policy if exists "sg_read_auth"   on public.share_groups;
drop policy if exists "sg_manage_mgr"  on public.share_groups;
create policy "sg_read_auth"  on public.share_groups for select using (auth.uid() is not null);
create policy "sg_manage_mgr" on public.share_groups for all
  using (public.is_manager()) with check (public.is_manager());

drop policy if exists "sgm_read_auth"   on public.share_group_members;
drop policy if exists "sgm_manage_mgr"  on public.share_group_members;
create policy "sgm_read_auth"  on public.share_group_members for select using (auth.uid() is not null);
create policy "sgm_manage_mgr" on public.share_group_members for all
  using (public.is_manager()) with check (public.is_manager());

-- share_history: supervisors+ insert and read all; users see their own shares.
drop policy if exists "sh_read"   on public.share_history;
drop policy if exists "sh_insert" on public.share_history;
create policy "sh_read"   on public.share_history for select
  using (shared_by = auth.uid() or public.is_supervisor_or_above());
create policy "sh_insert" on public.share_history for insert
  with check (public.is_supervisor_or_above());

-- ----- Seed default groups -----
insert into public.share_groups (name, description) values
  ('Supervisors',          'Supervisors across all piers and retail'),
  ('Pier Managers',        'Pier-level senior management'),
  ('POS / RocketRez Team', 'Point-of-sale and RocketRez data team')
on conflict (name) do nothing;

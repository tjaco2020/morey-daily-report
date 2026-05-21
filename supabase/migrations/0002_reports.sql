-- =============================================================
-- Morey's Daily Report Tool — Phase 2 schema
-- Adds: reports, daily_sessions, case_counters, audit_log,
-- PIN columns + functions, case-number generator.
-- Run this in: Supabase Dashboard → SQL Editor → New query → Paste → Run
-- Safe to re-run.
-- =============================================================

-- ---------- ENUMS ----------
do $$
begin
  create type public.report_status as enum (
    'pending',    -- saved, not yet submitted
    'submitted',  -- submitted by user
    'included',   -- selected for the daily report
    'locked',     -- 1AM job locked unsubmitted pending reports
    'archived'    -- finalized after daily report sent (or manual)
  );
exception when duplicate_object then null;
end $$;

-- ---------- PROFILES (add PIN lookup + pepper note) ----------
alter table public.profiles
  add column if not exists pin_lookup text unique;
-- pin_hash already exists from Phase 1; we keep it (bcrypt-style verification).

-- ---------- DAILY SESSIONS ----------
create table if not exists public.daily_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  session_date    date not null,
  scheduled_start time,
  scheduled_end   time,
  terminal_id     uuid references public.terminals(id),
  login_at        timestamptz not null default now(),
  logout_at       timestamptz,
  device_info     jsonb,
  unique (user_id, session_date)
);

create index if not exists daily_sessions_user_date_idx
  on public.daily_sessions(user_id, session_date);

-- ---------- CASE COUNTERS ----------
create table if not exists public.case_counters (
  case_date    date not null,
  terminal_id  uuid not null references public.terminals(id),
  last_seq     int  not null default 0,
  primary key (case_date, terminal_id)
);

-- A sentinel terminal row for reports without a terminal (quick-pin without location).
-- We'll use the seeded "Other" terminal as the catch-all for case numbering.

-- ---------- REPORTS ----------
create table if not exists public.reports (
  id                 uuid primary key default gen_random_uuid(),
  case_number        text unique,
  user_id            uuid not null references public.profiles(id) on delete cascade,
  category_id        uuid not null references public.categories(id),
  terminal_id        uuid references public.terminals(id),
  report_date        date not null default current_date,
  text               text not null,
  status             public.report_status not null default 'pending',
  is_quick_pin       boolean not null default false,
  submitted_at       timestamptz,
  locked_at          timestamptz,
  archived_at        timestamptz,
  supervisor_notes   text,
  edited_by          uuid references public.profiles(id),
  edited_at          timestamptz,
  daily_report_id    uuid,                                 -- FK enforced in Phase 3
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists reports_user_idx      on public.reports(user_id);
create index if not exists reports_status_idx    on public.reports(status);
create index if not exists reports_date_idx      on public.reports(report_date);
create index if not exists reports_category_idx  on public.reports(category_id);
create index if not exists reports_terminal_idx  on public.reports(terminal_id);
create index if not exists reports_case_idx      on public.reports(case_number);

-- ---------- AUDIT LOG ----------
create table if not exists public.audit_log (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid references public.profiles(id),
  action        text not null,
  entity_type   text not null,
  entity_id     uuid,
  before_state  jsonb,
  after_state   jsonb,
  meta          jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists audit_log_entity_idx on public.audit_log(entity_type, entity_id);
create index if not exists audit_log_actor_idx  on public.audit_log(actor_id);
create index if not exists audit_log_action_idx on public.audit_log(action);

-- ---------- CASE NUMBER GENERATOR ----------
-- Returns formatted case number: MMDDYY + TERMINAL + 9-digit sequence.
-- Atomic: an INSERT ... ON CONFLICT increments the per-(date, terminal) counter
-- in a single statement, so concurrent inserts never collide.
create or replace function public.next_case_number(p_date date, p_terminal_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seq       int;
  v_term_id   uuid := p_terminal_id;
  v_term_name text;
  v_clean     text;
begin
  -- Fall back to the 'Other' terminal if none was given so the counter has a key.
  if v_term_id is null then
    select id into v_term_id from public.terminals where name = 'Other' limit 1;
  end if;

  insert into public.case_counters (case_date, terminal_id, last_seq)
    values (p_date, v_term_id, 1)
  on conflict (case_date, terminal_id) do update
    set last_seq = case_counters.last_seq + 1
  returning last_seq into v_seq;

  select name into v_term_name from public.terminals where id = v_term_id;
  v_clean := upper(regexp_replace(coalesce(v_term_name, 'UNK'), '[^A-Za-z0-9]', '', 'g'));

  return to_char(p_date, 'MMDDYY') || v_clean || lpad(v_seq::text, 9, '0');
end;
$$;

-- ---------- TRIGGERS ----------

-- Auto-stamp case number on insert if not provided.
create or replace function public.before_insert_report()
returns trigger language plpgsql as $$
begin
  if new.case_number is null then
    new.case_number := public.next_case_number(new.report_date, new.terminal_id);
  end if;
  return new;
end;
$$;

drop trigger if exists reports_before_insert on public.reports;
create trigger reports_before_insert
  before insert on public.reports
  for each row execute function public.before_insert_report();

-- Auto-update updated_at (reuses set_updated_at from Phase 1).
drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

-- ---------- PIN FUNCTIONS ----------
-- Pepper: a constant value mixed into PIN lookups so an attacker with read
-- access to pin_lookup can't trivially reverse-search 4-6 digit PINs.
-- For higher security we can rotate this via a settings function later.
create or replace function public._pin_pepper()
returns text language sql immutable as $$
  select 'morey-pepper-v1'::text
$$;

-- A user sets their own PIN (4–6 digits, numeric).
create or replace function public.set_my_pin(p_pin text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_lookup text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if p_pin is null or length(p_pin) < 4 or length(p_pin) > 6 then
    raise exception 'PIN must be 4–6 digits';
  end if;
  if p_pin !~ '^[0-9]+$' then
    raise exception 'PIN must contain digits only';
  end if;

  v_lookup := encode(digest(p_pin || public._pin_pepper(), 'sha256'), 'hex');

  -- Uniqueness check: another user must not have the same PIN.
  if exists (
    select 1 from public.profiles
    where pin_lookup = v_lookup and id <> auth.uid()
  ) then
    raise exception 'That PIN is already in use. Please choose a different PIN.';
  end if;

  update public.profiles
  set pin_hash   = crypt(p_pin, gen_salt('bf', 10)),
      pin_lookup = v_lookup
  where id = auth.uid();
end;
$$;

-- Managers can set/reset any user's PIN.
create or replace function public.admin_set_pin(p_user_id uuid, p_pin text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_lookup text;
begin
  if not public.is_manager() then
    raise exception 'Manager role required';
  end if;
  if p_pin is null or length(p_pin) < 4 or length(p_pin) > 6 or p_pin !~ '^[0-9]+$' then
    raise exception 'PIN must be 4–6 numeric digits';
  end if;
  v_lookup := encode(digest(p_pin || public._pin_pepper(), 'sha256'), 'hex');
  if exists (
    select 1 from public.profiles
    where pin_lookup = v_lookup and id <> p_user_id
  ) then
    raise exception 'That PIN is already in use by another user';
  end if;
  update public.profiles
  set pin_hash   = crypt(p_pin, gen_salt('bf', 10)),
      pin_lookup = v_lookup
  where id = p_user_id;
end;
$$;

-- Verify a PIN at quick-report time; returns the user_id (or null).
-- O(1) via pin_lookup, then a bcrypt verify against pin_hash.
create or replace function public.verify_pin(p_pin text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_lookup text;
  v_id     uuid;
  v_hash   text;
begin
  if p_pin is null or length(p_pin) < 4 or length(p_pin) > 6 or p_pin !~ '^[0-9]+$' then
    return null;
  end if;
  v_lookup := encode(digest(p_pin || public._pin_pepper(), 'sha256'), 'hex');

  select id, pin_hash
    into v_id, v_hash
  from public.profiles
  where pin_lookup = v_lookup
    and active = true
    and pin_hash is not null
  limit 1;

  if v_id is null then return null; end if;
  if crypt(p_pin, v_hash) = v_hash then
    return v_id;
  end if;
  return null;
end;
$$;

-- ---------- ROW LEVEL SECURITY ----------

alter table public.daily_sessions enable row level security;
alter table public.reports        enable row level security;
alter table public.audit_log      enable row level security;
alter table public.case_counters  enable row level security;
-- case_counters has no policies → no one can touch it directly; only the
-- SECURITY DEFINER next_case_number() function can.

-- daily_sessions
drop policy if exists "ds_select_self_or_sup" on public.daily_sessions;
create policy "ds_select_self_or_sup" on public.daily_sessions for select
  using (user_id = auth.uid() or public.is_supervisor_or_above());

drop policy if exists "ds_insert_self" on public.daily_sessions;
create policy "ds_insert_self" on public.daily_sessions for insert
  with check (user_id = auth.uid());

drop policy if exists "ds_update_self" on public.daily_sessions;
create policy "ds_update_self" on public.daily_sessions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "ds_update_supervisor" on public.daily_sessions;
create policy "ds_update_supervisor" on public.daily_sessions for update
  using (public.is_supervisor_or_above())
  with check (public.is_supervisor_or_above());

-- reports
drop policy if exists "reports_select_self_or_sup" on public.reports;
create policy "reports_select_self_or_sup" on public.reports for select
  using (user_id = auth.uid() or public.is_supervisor_or_above());

drop policy if exists "reports_insert_self" on public.reports;
create policy "reports_insert_self" on public.reports for insert
  with check (user_id = auth.uid());

-- User can edit own report ONLY while status = 'pending'.
-- They may transition pending → submitted (the only legal status change they can make).
drop policy if exists "reports_update_self_pending" on public.reports;
create policy "reports_update_self_pending" on public.reports for update
  using (user_id = auth.uid() and status = 'pending')
  with check (user_id = auth.uid() and status in ('pending', 'submitted'));

-- Supervisors can edit reports that are not yet archived/locked.
drop policy if exists "reports_update_supervisor" on public.reports;
create policy "reports_update_supervisor" on public.reports for update
  using (public.is_supervisor_or_above() and status in ('pending', 'submitted', 'included'))
  with check (public.is_supervisor_or_above());

-- Managers can edit/unlock anything.
drop policy if exists "reports_update_manager_any" on public.reports;
create policy "reports_update_manager_any" on public.reports for update
  using (public.is_manager())
  with check (public.is_manager());

drop policy if exists "reports_delete_manager" on public.reports;
create policy "reports_delete_manager" on public.reports for delete
  using (public.is_manager());

-- audit_log
drop policy if exists "audit_insert_any_authed" on public.audit_log;
create policy "audit_insert_any_authed" on public.audit_log for insert
  with check (auth.uid() is not null);

drop policy if exists "audit_select_supervisor" on public.audit_log;
create policy "audit_select_supervisor" on public.audit_log for select
  using (public.is_supervisor_or_above());

-- =============================================================
-- DONE. Quick verification:
--   select case_number, status, text from public.reports;     -- empty
--   select * from public.daily_sessions;                       -- empty
--   select set_my_pin('123456');                               -- sets your PIN
--   select verify_pin('123456');                               -- returns your user id
-- =============================================================

-- ============================================================================
-- 0017_shift_recaps.sql
--
-- End-of-day recap workflow.
--
-- When a user hits "End my day", we create a shift_recaps row capturing:
--   * the user
--   * the date (in NJ time)
--   * the terminal they ended on
--   * a short free-text recap
--   * counts of unresolved drafts and submitted-pending-review reports
--     at the moment of end-of-day (snapshot for posterity)
--
-- Supervisors and managers see all recaps for any date; default users
-- only see their own. The supervisor dashboard pulls this for the
-- "Today's end-of-shift recaps" panel.
-- ============================================================================

create table if not exists public.shift_recaps (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references public.profiles(id) on delete cascade,
  recap_date               date not null default (now() at time zone 'America/New_York')::date,
  terminal_id              uuid references public.terminals(id) on delete set null,
  recap_text               text not null,
  open_drafts_count        int  not null default 0,
  pending_review_count     int  not null default 0,
  created_at               timestamptz not null default now(),
  unique (user_id, recap_date)
);

create index if not exists shift_recaps_date_idx on public.shift_recaps(recap_date desc);
create index if not exists shift_recaps_user_idx on public.shift_recaps(user_id);

alter table public.shift_recaps enable row level security;

-- A user can read their own recaps for any date.
drop policy if exists shift_recaps_select_own on public.shift_recaps;
create policy shift_recaps_select_own
  on public.shift_recaps for select
  using (user_id = auth.uid());

-- Supervisors and managers can read every recap.
drop policy if exists shift_recaps_select_sup on public.shift_recaps;
create policy shift_recaps_select_sup
  on public.shift_recaps for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('supervisor', 'manager')
    )
  );

-- Users can insert their own recap.
drop policy if exists shift_recaps_insert_own on public.shift_recaps;
create policy shift_recaps_insert_own
  on public.shift_recaps for insert
  with check (user_id = auth.uid());

-- Users can update their own recap (e.g. fix a typo before signing off).
drop policy if exists shift_recaps_update_own on public.shift_recaps;
create policy shift_recaps_update_own
  on public.shift_recaps for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Supervisors/managers can delete a recap (cleanup).
drop policy if exists shift_recaps_delete_sup on public.shift_recaps;
create policy shift_recaps_delete_sup
  on public.shift_recaps for delete
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('supervisor', 'manager')
    )
  );

-- (We do user + terminal joins in the supabase-js client rather than via a
-- view, so RLS on the underlying tables applies cleanly.)

-- =============================================================
-- 0015 — Weekly recap (Monday 9 AM ET automated)
-- Adds:
--   * weekly_recaps table — one row per sent weekly recap
--   * app_settings: weekly_recap_enabled toggle (default true)
-- Safe to re-run.
-- =============================================================

create table if not exists public.weekly_recaps (
  id                 uuid primary key default gen_random_uuid(),
  week_start         date not null unique,        -- Monday of the week covered
  week_end           date not null,               -- Sunday of the week covered
  ai_summary         text,
  total_reports      int default 0,
  stats_snapshot     jsonb,                       -- {by_category, by_location, by_day}
  recipient_emails   jsonb,                       -- [{email, name?}] snapshot at send time
  sent_at            timestamptz,
  sent_message_id    text,
  error_message      text,                        -- populated if the send failed
  created_at         timestamptz not null default now()
);

create index if not exists weekly_recaps_week_idx on public.weekly_recaps(week_start);

alter table public.weekly_recaps enable row level security;

drop policy if exists "wr_read_sup" on public.weekly_recaps;
create policy "wr_read_sup" on public.weekly_recaps for select
  using (public.is_supervisor_or_above());

-- Default the weekly recap setting to ON.
insert into public.app_settings (key, value) values
  ('weekly_recap_enabled', 'true'::jsonb)
on conflict (key) do nothing;

-- =============================================================
-- 0008 — Email recipients + send-bookkeeping
-- Adds:
--   * email_recipients table (managed by managers)
--   * daily_reports.report_snapshot column (frozen at send time)
--   * mark_daily_report_sent() RPC used in Phase 4B
-- Safe to re-run.
-- =============================================================

create table if not exists public.email_recipients (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  email       text not null unique,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists email_recipients_active_idx on public.email_recipients(active);

drop trigger if exists email_recipients_set_updated_at on public.email_recipients;
create trigger email_recipients_set_updated_at
  before update on public.email_recipients
  for each row execute function public.set_updated_at();

alter table public.email_recipients enable row level security;

drop policy if exists "recipients_select_sup" on public.email_recipients;
create policy "recipients_select_sup" on public.email_recipients for select
  using (public.is_supervisor_or_above());

drop policy if exists "recipients_manage_mgr" on public.email_recipients;
create policy "recipients_manage_mgr" on public.email_recipients for all
  using (public.is_manager())
  with check (public.is_manager());

-- Snapshot column for historical accuracy after send.
alter table public.daily_reports
  add column if not exists report_snapshot jsonb;

-- Function to atomically mark a daily report as sent, snapshot recipients/data,
-- and write an audit log entry.
create or replace function public.mark_daily_report_sent(
  p_id          uuid,
  p_recipients  jsonb,
  p_snapshot    jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_supervisor_or_above() then
    raise exception 'Supervisor role required';
  end if;

  update public.daily_reports
  set status            = 'sent',
      sent_by           = auth.uid(),
      sent_at           = now(),
      email_recipients  = p_recipients,
      report_snapshot   = p_snapshot
  where id = p_id;

  -- Also flip included reports to 'archived' to prevent further edits.
  update public.reports
  set status = 'archived',
      archived_at = now()
  where status = 'included'
    and daily_report_id = p_id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, meta)
  values (
    auth.uid(),
    'daily_report.send',
    'daily_report',
    p_id,
    jsonb_build_object('recipients', p_recipients)
  );
end;
$$;

grant execute on function public.mark_daily_report_sent(uuid, jsonb, jsonb) to authenticated;

-- Link reports to their daily_report on include so archiving on send works.
-- (When a supervisor includes a report, we also set daily_report_id.)
-- Add a trigger to keep daily_report_id in sync with daily_report_items.
create or replace function public.sync_report_daily_report_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.reports
    set daily_report_id = new.daily_report_id
    where id = new.report_id;
  elsif tg_op = 'DELETE' then
    update public.reports
    set daily_report_id = null
    where id = old.report_id
      and daily_report_id = old.daily_report_id;
  end if;
  return null;
end;
$$;

drop trigger if exists dri_sync_report_dr_id on public.daily_report_items;
create trigger dri_sync_report_dr_id
  after insert or delete on public.daily_report_items
  for each row execute function public.sync_report_daily_report_id();

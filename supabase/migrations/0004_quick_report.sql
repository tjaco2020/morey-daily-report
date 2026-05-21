-- =============================================================
-- 0004 — Quick PIN report submission
-- A SECURITY DEFINER function that:
--   1. Verifies the PIN
--   2. Inserts a report attributed to that user (status = submitted)
--   3. Logs the submission in audit_log
-- This is the ONLY way to submit a quick-PIN report.
-- verify_pin() is locked down so it can't be called directly from clients
-- (prevents online brute-forcing of PINs).
-- =============================================================

create or replace function public.quick_create_report(
  p_pin         text,
  p_text        text,
  p_category_id uuid,
  p_terminal_id uuid default null,
  p_report_date date default null
)
returns table (
  id          uuid,
  case_number text
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id     uuid;
  v_report_date date := coalesce(p_report_date, current_date);
  v_report      record;
begin
  if p_text is null or length(btrim(p_text)) = 0 then
    raise exception 'Report text required';
  end if;
  if p_category_id is null then
    raise exception 'Category required';
  end if;

  v_user_id := public.verify_pin(p_pin);
  if v_user_id is null then
    raise exception 'Invalid PIN';
  end if;

  insert into public.reports (
    user_id, category_id, terminal_id, report_date,
    text, status, is_quick_pin, submitted_at
  )
  values (
    v_user_id, p_category_id, p_terminal_id, v_report_date,
    btrim(p_text), 'submitted', true, now()
  )
  returning public.reports.id, public.reports.case_number
    into v_report;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, meta)
  values (
    v_user_id, 'report.quick_create', 'report', v_report.id,
    jsonb_build_object('pin_mode', true)
  );

  return query select v_report.id, v_report.case_number;
end;
$$;

-- Lock down direct PIN verification: only quick_create_report (definer) can use it.
revoke all on function public.verify_pin(text)       from public, anon, authenticated;
revoke all on function public._pin_pepper()          from public, anon, authenticated;

-- Allow the quick-create entry point for everyone (anon + signed-in).
grant execute on function public.quick_create_report(text, text, uuid, uuid, date)
  to anon, authenticated;

-- set_my_pin must be callable by signed-in users (RPC from the app).
grant execute on function public.set_my_pin(text) to authenticated;

-- admin_set_pin: only authenticated users (function self-checks for manager role).
grant execute on function public.admin_set_pin(uuid, text) to authenticated;

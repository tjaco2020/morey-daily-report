-- =============================================================
-- 0006 — Fix "column reference id is ambiguous" in pin_create_report
--
-- The function's RETURNS TABLE (id uuid, case_number text, user_name text)
-- creates PL/pgSQL output variables with the same names as columns on the
-- reports table we're inserting into. Postgres can't tell which one is
-- meant in the RETURNING clause.
--
-- Fix: `#variable_conflict use_column` directive + scalar variables for
-- the returning values. Same external signature, same JSON shape — only
-- the body changes. Safe to re-run.
-- =============================================================

create or replace function public.pin_create_report(
  p_pin             text,
  p_text            text,
  p_category_id     uuid,
  p_terminal_id     uuid default null,
  p_report_date     date default null,
  p_submit          boolean default true,
  p_device_user_id  uuid default null
)
returns table (
  id          uuid,
  case_number text,
  user_name   text
)
language plpgsql
security definer
set search_path = public, extensions
as $$
#variable_conflict use_column
declare
  v_user_id     uuid;
  v_full_name   text;
  v_report_date date := coalesce(p_report_date, current_date);
  v_status      public.report_status;
  v_new_id      uuid;
  v_new_case    text;
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

  select full_name into v_full_name
  from public.profiles
  where profiles.id = v_user_id;

  v_status := case
                when p_submit then 'submitted'::public.report_status
                else 'pending'::public.report_status
              end;

  insert into public.reports (
    user_id, category_id, terminal_id, report_date,
    text, status, is_quick_pin, submitted_at
  )
  values (
    v_user_id, p_category_id, p_terminal_id, v_report_date,
    btrim(p_text), v_status, true,
    case when p_submit then now() else null end
  )
  returning reports.id, reports.case_number
  into v_new_id, v_new_case;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, meta)
  values (
    v_user_id,
    case when p_submit then 'report.pin_submit' else 'report.pin_save' end,
    'report',
    v_new_id,
    jsonb_build_object(
      'pin_mode', true,
      'device_user_id', p_device_user_id,
      'submitted', p_submit
    )
  );

  return query select v_new_id, v_new_case, v_full_name;
end;
$$;

grant execute on function public.pin_create_report(text, text, uuid, uuid, date, boolean, uuid)
  to anon, authenticated;

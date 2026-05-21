-- =============================================================
-- 0013 — Report deletion permissions + audit
-- Adds:
--   * RLS: users can delete their own pending/submitted reports
--   * RLS: supervisors and managers can delete any report
--   * Trigger: writes an audit_log entry on every report delete
-- Safe to re-run.
-- =============================================================

-- Drop the manager-only delete policy from Phase 2 — the supervisor
-- policy below covers it.
drop policy if exists "reports_delete_manager"     on public.reports;
drop policy if exists "reports_delete_self"        on public.reports;
drop policy if exists "reports_delete_supervisor"  on public.reports;

create policy "reports_delete_self" on public.reports for delete
  using (
    user_id = auth.uid()
    and status in ('pending', 'submitted')
  );

create policy "reports_delete_supervisor" on public.reports for delete
  using (public.is_supervisor_or_above());

-- Audit log entry on every delete. SECURITY DEFINER so it can insert
-- regardless of the caller's RLS context.
create or replace function public.audit_report_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (actor_id, action, entity_type, entity_id, meta)
  values (
    auth.uid(),
    'report.delete',
    'report',
    old.id,
    jsonb_build_object(
      'case_number',  old.case_number,
      'owner_id',     old.user_id,
      'status',       old.status,
      'category_id',  old.category_id,
      'terminal_id',  old.terminal_id,
      'report_date',  old.report_date,
      'text_preview', left(coalesce(old.text, ''), 200)
    )
  );
  return old;
end;
$$;

drop trigger if exists reports_audit_delete on public.reports;
create trigger reports_audit_delete
  before delete on public.reports
  for each row execute function public.audit_report_delete();

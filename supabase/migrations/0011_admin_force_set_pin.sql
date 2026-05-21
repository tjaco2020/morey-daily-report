-- =============================================================
-- 0011 — admin_force_set_pin
-- A SECURITY DEFINER function callable from the service-role admin client
-- (bypasses RLS, no auth.uid() required) to set/reset any user's PIN.
-- Used by the /api/admin/users/[id] PATCH route when a manager resets PINs.
-- Safe to re-run.
-- =============================================================

create or replace function public.admin_force_set_pin(
  p_user_id uuid,
  p_pin     text,
  p_pepper  text default 'morey-pepper-v1'
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_lookup text;
begin
  if p_pin is null or length(p_pin) < 4 or length(p_pin) > 6 or p_pin !~ '^[0-9]+$' then
    raise exception 'PIN must be 4–6 numeric digits';
  end if;

  v_lookup := encode(digest(p_pin || p_pepper, 'sha256'), 'hex');

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

-- Service role can call this directly. Don't grant to anon/authenticated —
-- the API route uses the admin client which always uses service role.
revoke all on function public.admin_force_set_pin(uuid, text, text) from public, anon, authenticated;

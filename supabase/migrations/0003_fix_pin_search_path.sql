-- =============================================================
-- 0003 — Fix PIN function search_path
-- The PIN functions use digest() / crypt() / gen_salt() from pgcrypto,
-- which Supabase installs in the `extensions` schema. We were locking
-- search_path to just `public`, so the functions couldn't see them.
-- This re-creates them with `public, extensions` in the search_path.
-- Safe to re-run.
-- =============================================================

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

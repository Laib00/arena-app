-- Phase 0: coach signup — set profiles.role from auth user_metadata.account_type
-- Run once in Supabase SQL Editor (or via migration). Safe to re-run.
--
-- IMPORTANT: `protect_role_column` (see schema / fix_profile_rls.sql) normally strips
-- role changes on UPDATE so users cannot self-promote. Coach promotion from JWT metadata
-- must run inside `ensure_own_profile` using `arena.allow_profile_role_sync` (below).

-- ---------------------------------------------------------------------------
-- Role lock: allow ONLY trusted paths to change profiles.role (RPC below sets the flag)
-- ---------------------------------------------------------------------------
create or replace function public.protect_role_column()
returns trigger as $$
begin
  if new.role is distinct from old.role then
    if coalesce(current_setting('arena.allow_profile_role_sync', true), '') <> '1' then
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists protect_role_column on public.profiles;
create trigger protect_role_column
  before update on public.profiles
  for each row execute function public.protect_role_column();

-- ---------------------------------------------------------------------------
-- New user → profile (trigger on auth.users)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_role text;
  pack text;
begin
  user_role := case
    when lower(trim(coalesce(new.raw_user_meta_data->>'account_type', ''))) = 'coach' then 'coach'
    else 'trainee'
  end;

  pack := case
    when user_role = 'coach' then 'property'
    when coalesce(new.raw_user_meta_data->>'practice_pack', 'property') = 'education' then 'education'
    else 'property'
  end;

  insert into public.profiles (id, email, full_name, role, industry, practice_pack, agent_profile)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    user_role,
    coalesce(new.raw_user_meta_data->>'industry', 'Property'),
    pack,
    new.raw_user_meta_data->'agent_profile'
  );
  return new;
end;
$$ language plpgsql security definer;

-- ---------------------------------------------------------------------------
-- Missing profile row — recreate from auth (RPC used by the app)
-- ---------------------------------------------------------------------------
create or replace function public.ensure_own_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  meta jsonb;
  row public.profiles;
  user_role text;
  pack text;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select coalesce(raw_user_meta_data, '{}'::jsonb) into meta from auth.users where id = uid;

  user_role := case
    when lower(trim(coalesce(meta->>'account_type', ''))) = 'coach' then 'coach'
    else 'trainee'
  end;

  pack := case
    when user_role = 'coach' then 'property'
    when coalesce(meta->>'practice_pack', 'property') = 'education' then 'education'
    when meta->'agent_profile'->>'studentGrade' is not null then 'education'
    else 'property'
  end;

  perform set_config('arena.allow_profile_role_sync', '1', true);

  insert into public.profiles (id, email, full_name, role, industry, practice_pack, agent_profile)
  values (
    uid,
    (select email from auth.users where id = uid),
    coalesce(meta->>'full_name', meta->>'name', (select email from auth.users where id = uid)),
    user_role,
    coalesce(meta->>'industry', 'Property'),
    pack,
    meta->'agent_profile'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        role = excluded.role,
        practice_pack = case
          when excluded.role = 'coach' then 'property'
          else excluded.practice_pack
        end
  returning * into row;

  return row;
end;
$$;

revoke all on function public.ensure_own_profile() from public;
grant execute on function public.ensure_own_profile() to authenticated;

-- Recreate a missing profiles row for the signed-in user (e.g. after a manual DB delete).
-- Safe to re-run. Run in Supabase SQL Editor.
-- Requires protect_role_column to allow sync when session var arena.allow_profile_role_sync = '1'
-- (see phase0_coach_signup.sql).

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

-- Also allow direct insert (optional backup path from the client)
drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

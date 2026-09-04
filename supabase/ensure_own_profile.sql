-- Recreate a missing profiles row for the signed-in user (e.g. after a manual DB delete).
-- Safe to re-run. Run in Supabase SQL Editor.

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
  pack text;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select raw_user_meta_data into meta from auth.users where id = uid;

  pack := case
    when coalesce(meta->>'practice_pack', 'property') = 'education' then 'education'
    when meta->'agent_profile'->>'studentGrade' is not null then 'education'
    else 'property'
  end;

  insert into public.profiles (id, email, full_name, industry, practice_pack, agent_profile)
  values (
    uid,
    (select email from auth.users where id = uid),
    coalesce(meta->>'full_name', meta->>'name', (select email from auth.users where id = uid)),
    coalesce(meta->>'industry', 'Property'),
    pack,
    meta->'agent_profile'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name)
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

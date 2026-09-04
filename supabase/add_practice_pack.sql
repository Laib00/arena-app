-- Practice pack locked at signup: property | education
-- Run once in Supabase SQL Editor. Safe to re-run.

alter table public.profiles
  add column if not exists practice_pack text not null default 'property';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_practice_pack_check'
  ) then
    alter table public.profiles
      add constraint profiles_practice_pack_check
      check (practice_pack in ('property', 'education'));
  end if;
end $$;

comment on column public.profiles.practice_pack is
  'Locked at signup. property = sales practice; education = interview module (and later edu modules).';

-- Existing users stay on property.
update public.profiles
set practice_pack = 'property'
where practice_pack is null or practice_pack = '';

-- Allow signup metadata to set practice_pack on new profiles.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, industry, practice_pack, agent_profile)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'industry', 'Property'),
    case
      when coalesce(new.raw_user_meta_data->>'practice_pack', 'property') = 'education'
        then 'education'
      else 'property'
    end,
    new.raw_user_meta_data->'agent_profile'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Fix profile saves silently failing (run once in Supabase → SQL Editor → Run)
--
-- The old update policy used a self-referencing subquery in WITH CHECK that
-- could block all profile updates, including agent_profile changes.

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.protect_role_column()
returns trigger as $$
begin
  if new.role is distinct from old.role then
    new.role := old.role;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists protect_role_column on public.profiles;
create trigger protect_role_column
  before update on public.profiles
  for each row execute function public.protect_role_column();

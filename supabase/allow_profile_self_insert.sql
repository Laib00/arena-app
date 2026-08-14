-- Allow a signed-in user to create their own profiles row
-- (needed when Google OAuth user exists but the signup trigger didn't run).
-- Run once in Supabase SQL Editor.

drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

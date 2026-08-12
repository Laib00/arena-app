-- ============================================================================
-- WAITLIST — signups from the public landing page at /
-- ============================================================================
-- Run once in Supabase: SQL Editor → New query → paste → Run.
-- Safe to re-run.
--
-- This table is deliberately the only one in the schema that anonymous
-- visitors can write to. They can INSERT and nothing else: no select, no
-- update, no delete. So a visitor can add themselves to the list but can
-- never read back who else is on it.
-- ============================================================================

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  role text,
  company text,
  source text default 'landing',
  created_at timestamptz not null default now()
);

-- One row per email. The insert uses on_conflict so a repeat signup is a
-- silent no-op rather than an error the visitor has to see.
create unique index if not exists waitlist_email_key
  on public.waitlist (lower(email));

alter table public.waitlist enable row level security;

drop policy if exists "anyone can join the waitlist" on public.waitlist;
create policy "anyone can join the waitlist"
  on public.waitlist for insert
  to anon, authenticated
  with check (true);

-- Only managers can read the list, from inside the app.
drop policy if exists "managers can read the waitlist" on public.waitlist;
create policy "managers can read the waitlist"
  on public.waitlist for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'manager'
    )
  );

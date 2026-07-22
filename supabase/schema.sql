-- ============================================================================
-- THE ARENA — Database schema for Supabase (Postgres)
-- ============================================================================
-- Run this once in your Supabase project: SQL Editor → New query → paste all
-- of this → Run. Safe to re-run (uses IF NOT EXISTS / OR REPLACE throughout).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. PROFILES — extends Supabase's built-in auth.users with app-specific data
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'trainee' check (role in ('trainee', 'manager')),
  industry text not null default 'Property' check (industry in ('Property', 'Financial Planning')),
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists industry text not null default 'Property';
alter table public.profiles add column if not exists agent_profile jsonb;

alter table public.profiles enable row level security;

-- Everyone can read all profiles (needed so managers can see trainee names,
-- and so trainees can see who left them a note). No sensitive data lives here.
drop policy if exists "profiles are viewable by all authenticated users" on public.profiles;
create policy "profiles are viewable by all authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- Users can only update their own profile (e.g. full_name), never their role.
drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Role changes must go through a service role (e.g. a manager promoting
-- someone via the SQL editor), never through a normal user-facing update.
-- Enforced here with a trigger instead of an RLS WITH CHECK subquery,
-- since self-referencing subqueries in RLS policies are unreliable and can
-- silently block legitimate updates that don't even touch this column.
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

-- Auto-create a profile row whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, industry, agent_profile)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'industry', 'Property'),
    new.raw_user_meta_data->'agent_profile'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper used by policies below: is the current user a manager?
create or replace function public.is_manager()
returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'manager'
  );
$$ language sql security definer stable;

-- ---------------------------------------------------------------------------
-- 2. CONVERSATIONS — one row per roleplay session
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  industry text not null,
  client_persona_id text,
  client_name text,
  client_grade text,
  aim text,
  setting text,
  himself_snapshot jsonb,
  client_snapshot jsonb,
  aim_snapshot jsonb,
  setting_snapshot jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

-- Safe to re-run: adds the snapshot columns if this table already existed
-- from before this feature was added.
alter table public.conversations add column if not exists himself_snapshot jsonb;
alter table public.conversations add column if not exists client_snapshot jsonb;
alter table public.conversations add column if not exists aim_snapshot jsonb;
alter table public.conversations add column if not exists setting_snapshot jsonb;

alter table public.conversations enable row level security;

drop policy if exists "trainees see own conversations" on public.conversations;
create policy "trainees see own conversations"
  on public.conversations for select
  to authenticated
  using (user_id = auth.uid() or public.is_manager());

drop policy if exists "trainees insert own conversations" on public.conversations;
create policy "trainees insert own conversations"
  on public.conversations for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "trainees update own conversations" on public.conversations;
create policy "trainees update own conversations"
  on public.conversations for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "trainees delete own conversations" on public.conversations;
create policy "trainees delete own conversations"
  on public.conversations for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. MESSAGES — every turn of every conversation
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('agent', 'client')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

drop policy if exists "see messages of visible conversations" on public.messages;
create policy "see messages of visible conversations"
  on public.messages for select
  to authenticated
  using (
    public.is_manager()
    or exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid())
  );

drop policy if exists "insert messages into own conversations" on public.messages;
create policy "insert messages into own conversations"
  on public.messages for insert
  to authenticated
  with check (
    exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 4. COACHING REPORTS — the AI-generated evaluation for a conversation
-- ---------------------------------------------------------------------------
create table if not exists public.coaching_reports (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  overall text,
  strengths text,
  areas_to_improve text,
  client_fit text,
  key_recommendation text,
  raw_text text,
  created_at timestamptz not null default now()
);

alter table public.coaching_reports add column if not exists client_fit text;
alter table public.coaching_reports add column if not exists client_feedback text;
alter table public.coaching_reports add column if not exists reflection text;
alter table public.coaching_reports add column if not exists facts text;

alter table public.coaching_reports enable row level security;

drop policy if exists "see reports of visible conversations" on public.coaching_reports;
create policy "see reports of visible conversations"
  on public.coaching_reports for select
  to authenticated
  using (
    public.is_manager()
    or exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid())
  );

drop policy if exists "insert reports into own conversations" on public.coaching_reports;
create policy "insert reports into own conversations"
  on public.coaching_reports for insert
  to authenticated
  with check (
    exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 5. PROGRESS NOTES — written by either the trainee themselves or a manager
-- ---------------------------------------------------------------------------
create table if not exists public.progress_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,      -- who the note is ABOUT
  author_id uuid not null references public.profiles(id) on delete cascade,    -- who WROTE the note
  conversation_id uuid references public.conversations(id) on delete set null, -- optional: tied to a session
  note text not null,
  created_at timestamptz not null default now()
);

alter table public.progress_notes enable row level security;

-- A trainee sees notes about themselves; a manager sees all notes.
drop policy if exists "see relevant progress notes" on public.progress_notes;
create policy "see relevant progress notes"
  on public.progress_notes for select
  to authenticated
  using (user_id = auth.uid() or author_id = auth.uid() or public.is_manager());

-- Trainees can only write notes about themselves; managers can write about anyone.
drop policy if exists "insert progress notes" on public.progress_notes;
create policy "insert progress notes"
  on public.progress_notes for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and (user_id = auth.uid() or public.is_manager())
  );

-- ---------------------------------------------------------------------------
-- 6. Helpful indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_conversations_user on public.conversations(user_id);
create index if not exists idx_conversations_open on public.conversations(user_id, ended_at);
create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_reports_conversation on public.coaching_reports(conversation_id);
create index if not exists idx_notes_user on public.progress_notes(user_id);
create index if not exists idx_notes_conversation on public.progress_notes(conversation_id);

-- ============================================================================
-- Done. Next: in Supabase Dashboard → Authentication → Providers, enable
-- Email and Google. For Google, you'll need OAuth credentials from Google
-- Cloud Console — see README for the exact steps.
--
-- To make someone a manager, run (after they've signed up at least once):
--   update public.profiles set role = 'manager' where email = 'their@email.com';
-- ============================================================================

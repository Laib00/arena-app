-- XP / leveling for practice progress.
-- Run once in Supabase SQL Editor. Safe to re-run.

alter table public.profiles
  add column if not exists xp integer not null default 0;

alter table public.conversations
  add column if not exists xp_awarded integer;

comment on column public.profiles.xp is 'Cumulative practice XP toward levels';
comment on column public.conversations.xp_awarded is 'XP granted when this session ended; null = not awarded yet';

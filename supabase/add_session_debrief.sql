-- Add post-session debrief fields (run once in Supabase SQL Editor)
-- Client feedback → Reflection → Facts (coaching notes stay optional)

alter table public.coaching_reports add column if not exists client_feedback text;
alter table public.coaching_reports add column if not exists reflection text;
alter table public.coaching_reports add column if not exists facts text;

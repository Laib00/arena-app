-- Debrief flow update: Reflection → Client feedback → Reflection update → Facts
-- Run once in Supabase SQL Editor

alter table public.coaching_reports add column if not exists reflection_update text;

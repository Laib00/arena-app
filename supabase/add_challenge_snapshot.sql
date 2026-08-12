-- Optional: store targeted-practice challenge on each conversation (run once in Supabase SQL Editor)

alter table public.conversations add column if not exists challenge_snapshot jsonb;

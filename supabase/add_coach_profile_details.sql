-- Coach profile details (headline, experience, credentials, industry vs skills, avatar)
-- Run in Supabase SQL Editor after add_rag_and_coach.sql. Safe to re-run.

alter table public.coach_profiles
  add column if not exists headline text;

alter table public.coach_profiles
  add column if not exists experience_role text;

alter table public.coach_profiles
  add column if not exists experience_org text;

alter table public.coach_profiles
  add column if not exists experience_summary text;

alter table public.coach_profiles
  add column if not exists qualifications jsonb not null default '[]'::jsonb;

alter table public.coach_profiles
  add column if not exists who_i_coach text;

alter table public.coach_profiles
  add column if not exists industries jsonb not null default '[]'::jsonb;

alter table public.coach_profiles
  add column if not exists practice_skills jsonb not null default '[]'::jsonb;

alter table public.coach_profiles
  add column if not exists avatar_path text;

-- Allow any authenticated user to read coach avatar objects (preview / trainee discovery later).
-- Paths: {coach_user_id}/avatar/{filename}
drop policy if exists "coach_documents_select_avatars" on storage.objects;
create policy "coach_documents_select_avatars"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'coach-documents'
    and (storage.foldername(name))[2] = 'avatar'
  );

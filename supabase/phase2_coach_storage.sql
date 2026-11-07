-- Phase 2: Supabase Storage for coach document uploads
-- Run once in SQL Editor (safe to re-run with IF NOT EXISTS / DROP IF EXISTS patterns below).

-- Bucket: private coach uploads (path convention: {profile_id}/{library_id}/filename)
insert into storage.buckets (id, name, public)
values ('coach-documents', 'coach-documents', false)
on conflict (id) do nothing;

-- Authenticated users can read/write only under folder = their auth.uid()
drop policy if exists "coach_documents_select_own" on storage.objects;
create policy "coach_documents_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'coach-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "coach_documents_insert_own" on storage.objects;
create policy "coach_documents_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'coach-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "coach_documents_update_own" on storage.objects;
create policy "coach_documents_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'coach-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "coach_documents_delete_own" on storage.objects;
create policy "coach_documents_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'coach-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

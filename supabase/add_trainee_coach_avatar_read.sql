-- Allow enrolled trainees to view their coach's avatar (signed URLs).
-- Avatars live at: {coach_profile_id}/avatar/...
-- Run after phase2_coach_storage.sql + add_rag_and_coach.sql.

drop policy if exists "enrolled_read_coach_avatars" on storage.objects;
create policy "enrolled_read_coach_avatars"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'coach-documents'
    and (storage.foldername(name))[2] = 'avatar'
    and exists (
      select 1
      from public.library_enrollments e
      join public.knowledge_libraries kl on kl.id = e.library_id
      where e.profile_id = auth.uid()
        and kl.owner_id::text = (storage.foldername(name))[1]
        and (e.expires_at is null or e.expires_at > now())
    )
  );

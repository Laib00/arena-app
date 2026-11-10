-- Coach review of enrolled trainees' practice sessions.
-- Run on Supabase after add_rag_and_coach.sql.
-- Lets coaches read conversations / messages / coaching_reports for trainees
-- enrolled in libraries they own, and write progress_notes (remarks) for them.

create or replace function public.coach_can_view_trainee(p_trainee_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_coach()
    and p_trainee_id is not null
    and exists (
      select 1
      from public.library_enrollments e
      join public.knowledge_libraries kl on kl.id = e.library_id
      where e.profile_id = p_trainee_id
        and kl.owner_id = auth.uid()
        and (e.expires_at is null or e.expires_at > now())
    );
$$;

-- Conversations ----------------------------------------------------------------
drop policy if exists "coaches see enrolled trainee conversations" on public.conversations;
create policy "coaches see enrolled trainee conversations"
  on public.conversations for select
  to authenticated
  using (public.coach_can_view_trainee(user_id));

-- Messages ---------------------------------------------------------------------
drop policy if exists "coaches see messages of enrolled trainees" on public.messages;
create policy "coaches see messages of enrolled trainees"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and public.coach_can_view_trainee(c.user_id)
    )
  );

-- Coaching reports -------------------------------------------------------------
drop policy if exists "coaches see reports of enrolled trainees" on public.coaching_reports;
create policy "coaches see reports of enrolled trainees"
  on public.coaching_reports for select
  to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and public.coach_can_view_trainee(c.user_id)
    )
  );

-- Progress notes (coach remarks) -----------------------------------------------
drop policy if exists "coaches see notes for enrolled trainees" on public.progress_notes;
create policy "coaches see notes for enrolled trainees"
  on public.progress_notes for select
  to authenticated
  using (public.coach_can_view_trainee(user_id));

drop policy if exists "coaches insert notes for enrolled trainees" on public.progress_notes;
create policy "coaches insert notes for enrolled trainees"
  on public.progress_notes for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and public.coach_can_view_trainee(user_id)
  );

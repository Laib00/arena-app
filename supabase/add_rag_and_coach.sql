-- ============================================================================
-- THE ARENA — Coach / trainer layer + RAG (knowledge libraries)
-- ============================================================================
-- Run once in Supabase SQL Editor on an EXISTING project that already has
-- schema.sql applied. Safe to re-run (IF NOT EXISTS / OR REPLACE / DROP IF EXISTS).
--
-- Design reference: docs/DATABASE_RAG_AND_COACH.md
--
-- After running:
--   1. Promote coaches: update public.profiles set role = 'coach' where email = '...';
--   2. Create Storage bucket "coach-documents" in Dashboard (optional, for uploads).
--   3. App code for libraries/RAG is not wired yet — DB only.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
create extension if not exists vector with schema extensions;

-- ---------------------------------------------------------------------------
-- 1. profiles.role — add 'coach'
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'profiles'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%role%'
  loop
    execute format('alter table public.profiles drop constraint if exists %I', r.conname);
  end loop;
end $$;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('trainee', 'manager', 'coach'));

-- ---------------------------------------------------------------------------
-- 2. Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_coach()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'coach'
  );
$$;

-- is_library_owner / is_enrolled_in_library are created after their tables (§6).

-- ---------------------------------------------------------------------------
-- 3. Organizations (B2B — optional use in v1)
-- ---------------------------------------------------------------------------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'coach', 'admin', 'trainee')),
  created_at timestamptz not null default now(),
  primary key (organization_id, profile_id)
);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

drop policy if exists "org members see own orgs" on public.organizations;
create policy "org members see own orgs"
  on public.organizations for select
  to authenticated
  using (
    public.is_manager()
    or exists (
      select 1 from public.organization_members om
      where om.organization_id = id and om.profile_id = auth.uid()
    )
  );

drop policy if exists "org owners manage orgs" on public.organizations;
create policy "org owners manage orgs"
  on public.organizations for all
  to authenticated
  using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = id and om.profile_id = auth.uid() and om.role = 'owner'
    )
  )
  with check (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = id and om.profile_id = auth.uid() and om.role = 'owner'
    )
  );

drop policy if exists "see org membership" on public.organization_members;
create policy "see org membership"
  on public.organization_members for select
  to authenticated
  using (
    public.is_manager()
    or profile_id = auth.uid()
    or exists (
      select 1 from public.organization_members om
      where om.organization_id = organization_members.organization_id
        and om.profile_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Coach profiles
-- ---------------------------------------------------------------------------
create table if not exists public.coach_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  display_name text,
  bio text,
  specialties jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.coach_profiles enable row level security;

drop policy if exists "coach profiles are viewable" on public.coach_profiles;
create policy "coach profiles are viewable"
  on public.coach_profiles for select
  to authenticated
  using (true);

drop policy if exists "coaches update own coach profile" on public.coach_profiles;
create policy "coaches update own coach profile"
  on public.coach_profiles for all
  to authenticated
  using (profile_id = auth.uid() and public.is_coach())
  with check (profile_id = auth.uid() and public.is_coach());

-- ---------------------------------------------------------------------------
-- 5. Knowledge libraries & RAG
-- ---------------------------------------------------------------------------
create table if not exists public.knowledge_libraries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  practice_pack text check (practice_pack is null or practice_pack in ('property', 'education', 'fp')),
  title text not null,
  description text,
  visibility text not null default 'private'
    check (visibility in ('private', 'org', 'published')),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'archived')),
  embedding_model text not null default 'text-embedding-004',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_knowledge_libraries_owner on public.knowledge_libraries(owner_id);
create index if not exists idx_knowledge_libraries_org on public.knowledge_libraries(organization_id);

create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  library_id uuid not null references public.knowledge_libraries(id) on delete cascade,
  title text not null,
  source_type text not null check (source_type in ('upload', 'url', 'paste')),
  storage_path text,
  source_url text,
  mime_type text,
  checksum text,
  processing_status text not null default 'pending'
    check (processing_status in ('pending', 'processing', 'ready', 'failed')),
  error_message text,
  version integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_knowledge_documents_library on public.knowledge_documents(library_id);

-- 768 dims = common for Google text-embedding-004; change model ⇒ new migration + re-embed
create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.knowledge_documents(id) on delete cascade,
  library_id uuid not null references public.knowledge_libraries(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  token_count integer,
  embedding extensions.vector(768),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index if not exists idx_knowledge_chunks_library on public.knowledge_chunks(library_id);
create index if not exists idx_knowledge_chunks_embedding
  on public.knowledge_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- 6. Library enrollments (before library helper functions)
-- ---------------------------------------------------------------------------
create table if not exists public.library_enrollments (
  library_id uuid not null references public.knowledge_libraries(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid not null references public.profiles(id) on delete cascade,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (library_id, profile_id)
);

create index if not exists idx_library_enrollments_profile on public.library_enrollments(profile_id);

create or replace function public.is_library_owner(p_library_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.knowledge_libraries kl
    where kl.id = p_library_id and kl.owner_id = auth.uid()
  );
$$;

create or replace function public.is_enrolled_in_library(p_library_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.library_enrollments e
    where e.library_id = p_library_id
      and e.profile_id = auth.uid()
      and (e.expires_at is null or e.expires_at > now())
  );
$$;

-- ---------------------------------------------------------------------------
-- 7. Training assignments
-- ---------------------------------------------------------------------------
create table if not exists public.training_assignments (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  trainee_id uuid not null references public.profiles(id) on delete cascade,
  library_id uuid references public.knowledge_libraries(id) on delete set null,
  title text not null,
  instructions text,
  practice_pack text check (practice_pack is null or practice_pack in ('property', 'education', 'fp')),
  persona_id text,
  aim_key text,
  setting_key text,
  due_at timestamptz,
  status text not null default 'assigned'
    check (status in ('assigned', 'in_progress', 'completed', 'cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_training_assignments_coach on public.training_assignments(coach_id);
create index if not exists idx_training_assignments_trainee on public.training_assignments(trainee_id);

create table if not exists public.assignment_conversations (
  assignment_id uuid not null references public.training_assignments(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (assignment_id, conversation_id)
);

-- ---------------------------------------------------------------------------
-- 8. Link sessions to RAG / assignments
-- ---------------------------------------------------------------------------
alter table public.conversations add column if not exists rag_library_id uuid
  references public.knowledge_libraries(id) on delete set null;
alter table public.conversations add column if not exists assignment_id uuid
  references public.training_assignments(id) on delete set null;

create index if not exists idx_conversations_rag_library on public.conversations(rag_library_id);
create index if not exists idx_conversations_assignment on public.conversations(assignment_id);

create table if not exists public.conversation_retrievals (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  chunk_id uuid not null references public.knowledge_chunks(id) on delete cascade,
  rank integer not null,
  score double precision,
  query_text text,
  created_at timestamptz not null default now()
);

create index if not exists idx_conversation_retrievals_conv on public.conversation_retrievals(conversation_id);

-- ---------------------------------------------------------------------------
-- 9. Row Level Security — knowledge & coaching
-- ---------------------------------------------------------------------------
alter table public.knowledge_libraries enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.library_enrollments enable row level security;
alter table public.training_assignments enable row level security;
alter table public.assignment_conversations enable row level security;
alter table public.conversation_retrievals enable row level security;

-- Libraries: owner full access; enrolled trainees read active libraries; managers read all
drop policy if exists "libraries select" on public.knowledge_libraries;
create policy "libraries select"
  on public.knowledge_libraries for select
  to authenticated
  using (
    public.is_manager()
    or owner_id = auth.uid()
    or (status = 'active' and public.is_enrolled_in_library(id))
  );

drop policy if exists "libraries owner write" on public.knowledge_libraries;
create policy "libraries owner write"
  on public.knowledge_libraries for insert
  to authenticated
  with check (owner_id = auth.uid() and (public.is_coach() or public.is_manager()));

drop policy if exists "libraries owner update delete" on public.knowledge_libraries;
create policy "libraries owner update delete"
  on public.knowledge_libraries for update
  to authenticated
  using (owner_id = auth.uid() and (public.is_coach() or public.is_manager()))
  with check (owner_id = auth.uid());

drop policy if exists "libraries owner delete" on public.knowledge_libraries;
create policy "libraries owner delete"
  on public.knowledge_libraries for delete
  to authenticated
  using (owner_id = auth.uid() and (public.is_coach() or public.is_manager()));

-- Documents & chunks: owner of library; enrolled trainees read ready chunks only
drop policy if exists "documents select" on public.knowledge_documents;
create policy "documents select"
  on public.knowledge_documents for select
  to authenticated
  using (
    public.is_manager()
    or public.is_library_owner(library_id)
    or (
      processing_status = 'ready'
      and public.is_enrolled_in_library(library_id)
    )
  );

drop policy if exists "documents owner write" on public.knowledge_documents;
create policy "documents owner write"
  on public.knowledge_documents for all
  to authenticated
  using (public.is_library_owner(library_id))
  with check (public.is_library_owner(library_id));

drop policy if exists "chunks select" on public.knowledge_chunks;
create policy "chunks select"
  on public.knowledge_chunks for select
  to authenticated
  using (
    public.is_manager()
    or public.is_library_owner(library_id)
    or public.is_enrolled_in_library(library_id)
  );

drop policy if exists "chunks owner write" on public.knowledge_chunks;
create policy "chunks owner write"
  on public.knowledge_chunks for all
  to authenticated
  using (public.is_library_owner(library_id))
  with check (public.is_library_owner(library_id));

-- Enrollments: coach assigns for own library; trainee sees own
drop policy if exists "enrollments select" on public.library_enrollments;
create policy "enrollments select"
  on public.library_enrollments for select
  to authenticated
  using (
    public.is_manager()
    or profile_id = auth.uid()
    or public.is_library_owner(library_id)
  );

drop policy if exists "enrollments coach insert" on public.library_enrollments;
create policy "enrollments coach insert"
  on public.library_enrollments for insert
  to authenticated
  with check (
    assigned_by = auth.uid()
    and public.is_library_owner(library_id)
  );

drop policy if exists "enrollments coach delete" on public.library_enrollments;
create policy "enrollments coach delete"
  on public.library_enrollments for delete
  to authenticated
  using (public.is_library_owner(library_id) or public.is_manager());

-- Assignments
drop policy if exists "assignments select" on public.training_assignments;
create policy "assignments select"
  on public.training_assignments for select
  to authenticated
  using (
    public.is_manager()
    or coach_id = auth.uid()
    or trainee_id = auth.uid()
  );

drop policy if exists "assignments coach write" on public.training_assignments;
create policy "assignments coach write"
  on public.training_assignments for insert
  to authenticated
  with check (coach_id = auth.uid() and (public.is_coach() or public.is_manager()));

drop policy if exists "assignments coach update" on public.training_assignments;
create policy "assignments coach update"
  on public.training_assignments for update
  to authenticated
  using (coach_id = auth.uid() or public.is_manager())
  with check (coach_id = auth.uid() or public.is_manager());

drop policy if exists "trainee update assignment status" on public.training_assignments;
create policy "trainee update assignment status"
  on public.training_assignments for update
  to authenticated
  using (trainee_id = auth.uid())
  with check (trainee_id = auth.uid());

drop policy if exists "assignments coach delete" on public.training_assignments;
create policy "assignments coach delete"
  on public.training_assignments for delete
  to authenticated
  using (coach_id = auth.uid() or public.is_manager());

-- Assignment ↔ conversation links
drop policy if exists "assignment conversations select" on public.assignment_conversations;
create policy "assignment conversations select"
  on public.assignment_conversations for select
  to authenticated
  using (
    public.is_manager()
    or exists (
      select 1 from public.training_assignments ta
      where ta.id = assignment_id
        and (ta.coach_id = auth.uid() or ta.trainee_id = auth.uid())
    )
  );

drop policy if exists "assignment conversations insert" on public.assignment_conversations;
create policy "assignment conversations insert"
  on public.assignment_conversations for insert
  to authenticated
  with check (
    exists (
      select 1 from public.training_assignments ta
      join public.conversations c on c.id = conversation_id
      where ta.id = assignment_id
        and ta.trainee_id = auth.uid()
        and c.user_id = auth.uid()
    )
  );

-- RAG audit rows (same visibility as conversation)
drop policy if exists "retrievals select" on public.conversation_retrievals;
create policy "retrievals select"
  on public.conversation_retrievals for select
  to authenticated
  using (
    public.is_manager()
    or exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "retrievals insert" on public.conversation_retrievals;
create policy "retrievals insert"
  on public.conversation_retrievals for insert
  to authenticated
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Done
-- ============================================================================

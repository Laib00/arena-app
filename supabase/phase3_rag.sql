-- Phase 3: vector search RPC for RAG (pgvector)
-- Run in Supabase SQL Editor after add_rag_and_coach.sql. Safe to re-run.

create or replace function public.match_knowledge_chunks(
  p_library_id uuid,
  p_query_embedding extensions.vector(768),
  p_match_count int default 8
)
returns table (
  id uuid,
  content text,
  similarity double precision
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_match_count is null or p_match_count < 1 then
    p_match_count := 8;
  end if;
  if p_match_count > 32 then
    p_match_count := 32;
  end if;

  if not (
    public.is_manager()
    or public.is_library_owner(p_library_id)
    or public.is_enrolled_in_library(p_library_id)
  ) then
    raise exception 'not allowed to query this library';
  end if;

  return query
  select
    kc.id,
    kc.content,
    (1 - (kc.embedding <=> p_query_embedding))::double precision as similarity
  from public.knowledge_chunks kc
  where kc.library_id = p_library_id
    and kc.embedding is not null
  order by kc.embedding <=> p_query_embedding
  limit p_match_count;
end;
$$;

revoke all on function public.match_knowledge_chunks(uuid, extensions.vector(768), int) from public;
grant execute on function public.match_knowledge_chunks(uuid, extensions.vector(768), int) to authenticated;

-- Update a chunk embedding (coach/owner or manager only)
create or replace function public.set_knowledge_chunk_embedding(
  p_chunk_id uuid,
  p_embedding extensions.vector(768)
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.knowledge_chunks kc
    join public.knowledge_libraries kl on kl.id = kc.library_id
    where kc.id = p_chunk_id
      and (
        public.is_manager()
        or (kl.owner_id = auth.uid() and (public.is_coach() or public.is_manager()))
      )
  ) then
    raise exception 'not allowed to set embedding for this chunk';
  end if;

  update public.knowledge_chunks
  set embedding = p_embedding
  where id = p_chunk_id;
end;
$$;

revoke all on function public.set_knowledge_chunk_embedding(uuid, extensions.vector(768)) from public;
grant execute on function public.set_knowledge_chunk_embedding(uuid, extensions.vector(768)) to authenticated;

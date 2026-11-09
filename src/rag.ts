import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatMessage } from "./types/domain";

const MAX_RAG_CTX_CHARS = 6000;

/** Call local / Vercel API — returns 768 floats for Gemini text-embedding-004. */
export async function fetchEmbedding(text: string): Promise<number[]> {
  const res = await fetch("/api/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const raw = await res.text();
  let data: { embedding?: number[]; error?: string } = {};
  try {
    data = raw ? (JSON.parse(raw) as typeof data) : {};
  } catch {
    throw new Error(raw.slice(0, 200) || `Embeddings API invalid JSON (${res.status})`);
  }
  if (!res.ok) throw new Error(data.error || `Embeddings failed (${res.status})`);
  if (!data.embedding?.length) throw new Error("Embeddings API returned no vector.");
  return data.embedding;
}

export function formatRagContextBlock(matches: { content: string; similarity?: number }[]): string {
  if (!matches.length) return "";
  const parts = matches.map((m, i) => {
    const tag = m.similarity != null ? `[${i + 1}] (score ${m.similarity.toFixed(3)})\n` : `[${i + 1}]\n`;
    return tag + m.content.trim();
  });
  let block = parts.join("\n\n---\n\n");
  if (block.length > MAX_RAG_CTX_CHARS) {
    block = block.slice(0, MAX_RAG_CTX_CHARS) + "\n… (truncated)";
  }
  return `REFERENCE KNOWLEDGE (for scene authenticity only — you are still the client/interviewer in character; do not recite long passages; use only what fits naturally in dialogue):

${block}

`;
}

/** Coach playbook snippets for post-session analysis (not for in-character client speech). */
export function formatRagCoachAnalysisBlock(
  matches: { content: string; similarity?: number; documentTitle?: string | null }[]
): string {
  if (!matches.length) return "";
  const parts = matches.map((m, i) => {
    const src = m.documentTitle ? ` — from "${m.documentTitle}"` : "";
    const tag = m.similarity != null
      ? `[${i + 1}]${src} (score ${m.similarity.toFixed(3)})\n`
      : `[${i + 1}]${src}\n`;
    return tag + m.content.trim();
  });
  let block = parts.join("\n\n---\n\n");
  if (block.length > MAX_RAG_CTX_CHARS) {
    block = block.slice(0, MAX_RAG_CTX_CHARS) + "\n… (truncated)";
  }
  return `COACH PLAYBOOK (from the trainee's enrolled coach library). Ground your coaching in this material when it applies. Prefer the coach's methods over generic tips when they conflict. Do not invent policies or frameworks that are not supported by the playbook or the transcript.

${block}

`;
}

export type RetrievedRow = { id: string; content: string; similarity?: number; documentTitle?: string | null };

/** Attach source document titles to retrieved chunks (for related-topic UI). */
export async function attachDocumentTitles(
  supabase: SupabaseClient,
  matches: RetrievedRow[]
): Promise<RetrievedRow[]> {
  if (!matches.length) return matches;
  const ids = matches.map((m) => m.id);
  const { data, error } = await supabase
    .from("knowledge_chunks")
    .select("id, document_id, knowledge_documents(title)")
    .in("id", ids);
  if (error || !data?.length) {
    if (error) console.warn("attachDocumentTitles:", error.message);
    return matches;
  }
  const titleByChunk = new Map<string, string>();
  for (const row of data as {
    id: string;
    knowledge_documents?: { title?: string } | { title?: string }[] | null;
  }[]) {
    const doc = Array.isArray(row.knowledge_documents)
      ? row.knowledge_documents[0]
      : row.knowledge_documents;
    if (doc?.title) titleByChunk.set(row.id, doc.title);
  }
  return matches.map((m) => ({
    ...m,
    documentTitle: titleByChunk.get(m.id) || m.documentTitle || null,
  }));
}

export function userMessageForRagQuery(displayUserMessage: string): string {
  return `${displayUserMessage}\n\n[Retrieval query for knowledge base — consider whether reference snippets above are relevant.]`;
}

export async function retrieveRagChunks(
  supabase: SupabaseClient,
  libraryId: string,
  query: string,
  matchCount = 8
): Promise<RetrievedRow[]> {
  const embedding = await fetchEmbedding(query);
  const vecStr = `[${embedding.join(",")}]`;
  const { data, error } = await supabase.rpc("match_knowledge_chunks", {
    p_library_id: libraryId,
    p_query_embedding: vecStr,
    p_match_count: matchCount,
  } as never);
  if (error) {
    console.warn("match_knowledge_chunks:", error.message);
    return [];
  }
  const rows = (data || []) as { id: string; content: string; similarity?: number }[];
  return rows.map((r) => ({
    id: r.id,
    content: r.content,
    similarity: r.similarity,
  }));
}

/**
 * Library to use for post-session coach analysis.
 * Enrollment is enough — the practice-session picker is optional (live chat only).
 * Prefers `preferredId` when it is still enrolled; otherwise the first enrolled library.
 */
export function resolveCoachAnalysisLibraryId(
  enrolled: { id: string }[],
  preferredId?: string | null
): string | null {
  if (!enrolled.length) return null;
  if (preferredId && enrolled.some((l) => l.id === preferredId)) return preferredId;
  return enrolled[0]?.id ?? null;
}

/**
 * True when the signed-in user has a non-expired enrollment in this library.
 * Coach analysis / playbook RAG must not run without this.
 */
export async function isEnrolledInLibrary(
  supabase: SupabaseClient,
  libraryId: string,
  profileId: string
): Promise<boolean> {
  if (!libraryId || !profileId) return false;
  const { data, error } = await supabase
    .from("library_enrollments")
    .select("library_id, expires_at")
    .eq("library_id", libraryId)
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error || !data) {
    if (error) console.warn("isEnrolledInLibrary:", error.message);
    return false;
  }
  const expires = data.expires_at ? new Date(String(data.expires_at)).getTime() : null;
  if (expires != null && !Number.isNaN(expires) && expires <= Date.now()) return false;
  return true;
}

/** Retrieve + attach document titles for post-session coach analysis (enrollment required). */
export async function retrieveCoachPlaybookForDebrief(
  supabase: SupabaseClient,
  libraryId: string,
  query: string,
  matchCount = 10,
  opts?: { profileId?: string | null }
): Promise<RetrievedRow[]> {
  if (opts?.profileId) {
    const ok = await isEnrolledInLibrary(supabase, libraryId, opts.profileId);
    if (!ok) {
      console.warn("retrieveCoachPlaybookForDebrief: not enrolled in library", libraryId);
      return [];
    }
  }
  const matches = await retrieveRagChunks(supabase, libraryId, query, matchCount);
  return attachDocumentTitles(supabase, matches);
}

export async function logConversationRetrievals(
  supabase: SupabaseClient,
  conversationId: string,
  queryText: string,
  matches: RetrievedRow[]
): Promise<void> {
  if (!matches.length) return;
  const payload = matches.map((m, rank) => ({
    conversation_id: conversationId,
    chunk_id: m.id,
    rank: rank + 1,
    score: m.similarity ?? null,
    query_text: queryText.slice(0, 2000),
  }));
  const { error } = await supabase.from("conversation_retrievals").insert(payload);
  if (error) console.warn("conversation_retrievals insert:", error.message);
}

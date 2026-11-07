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

export function userMessageForRagQuery(displayUserMessage: string): string {
  return `${displayUserMessage}\n\n[Retrieval query for knowledge base — consider whether reference snippets above are relevant.]`;
}

export type RetrievedRow = { id: string; content: string; similarity?: number };

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

/**
 * Phase 1 — naive chunking for pasted text (no embeddings yet).
 * Split on paragraph breaks when possible, else fixed windows with overlap.
 */
export function chunkPastedText(text: string, maxLen = 1200, overlap = 150): string[] {
  const t = text.trim();
  if (!t) return [];
  const chunks: string[] = [];
  let i = 0;
  while (i < t.length) {
    let end = Math.min(i + maxLen, t.length);
    if (end < t.length) {
      const para = t.lastIndexOf("\n\n", end);
      if (para > i + 80) end = para;
      else {
        const line = t.lastIndexOf("\n", end);
        if (line > i + 80) end = line;
      }
    }
    const piece = t.slice(i, end).trim();
    if (piece) chunks.push(piece);
    if (end >= t.length) break;
    i = Math.max(end - overlap, i + 1);
  }
  return chunks;
}

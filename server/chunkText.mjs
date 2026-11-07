/** Same algorithm as src/coach/chunkPaste.ts (duplicated for Node ingest). */
export function chunkPastedText(text, maxLen = 1200, overlap = 150) {
  const t = String(text).trim();
  if (!t) return [];
  const chunks = [];
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

/**
 * POST /api/embed — single text → embedding vector (Gemini text-embedding-004, 768 dims).
 * Requires GEMINI_API_KEY (same as chat). Never expose key to browser.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY." });
  }

  const body = req.body || {};
  const text = typeof body.text === "string" ? body.text : "";
  if (!text.trim()) {
    return res.status(400).json({ error: "Request must include non-empty 'text'." });
  }

  const model = process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent`;

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        content: { parts: [{ text: text.slice(0, 20000) }] },
        outputDimensionality: 768,
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      const msg = data?.error?.message || `Embedding API error (${r.status})`;
      return res.status(r.status >= 400 && r.status < 600 ? r.status : 500).json({ error: msg });
    }

    const values = data?.embedding?.values;
    if (!Array.isArray(values) || values.length === 0) {
      return res.status(500).json({ error: "No embedding values in response." });
    }

    return res.status(200).json({ embedding: values, dimensions: values.length });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Embedding request failed" });
  }
}

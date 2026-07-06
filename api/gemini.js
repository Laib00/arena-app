// Vercel serverless function — keeps GEMINI_API_KEY on the server.
// The browser never sees the key; it only talks to this endpoint.
//
// Required environment variable (set in Vercel dashboard, not in code):
//   GEMINI_API_KEY   your Gemini API key from https://aistudio.google.com/apikey
// Optional:
//   GEMINI_MODEL      defaults to "gemini-2.5-flash"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY. Set it in your hosting provider's environment variables." });
  }

  const { systemPrompt, contents } = req.body || {};
  if (!Array.isArray(contents) || contents.length === 0) {
    return res.status(400).json({ error: "Request must include a non-empty 'contents' array." });
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const body = {
    contents,
    ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
  };

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await r.json();

    if (!r.ok) {
      const message = data?.error?.message || `Gemini API error (${r.status})`;
      return res.status(r.status).json({ error: message });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";

    if (!text) {
      // Common cause: response was blocked by safety filters.
      const finishReason = data?.candidates?.[0]?.finishReason;
      return res.status(200).json({
        text: "",
        warning: finishReason ? `No text returned (finishReason: ${finishReason})` : "No text returned",
      });
    }

    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Unknown server error" });
  }
}

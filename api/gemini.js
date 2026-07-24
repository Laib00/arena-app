// Vercel serverless function — keeps GEMINI_API_KEY on the server.
// The browser never sees the key; it only talks to this endpoint.
//
// Required environment variable (set in Vercel dashboard, not in code):
//   GEMINI_API_KEY   your Gemini API key from https://aistudio.google.com/apikey
// Optional:
//   GEMINI_MODEL      defaults to "gemini-3.6-flash"

// export default async function handler(req, res) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Method not allowed" });
//   }

//   const apiKey = process.env.GEMINI_API_KEY;
//   if (!apiKey) {
//     return res.status(500).json({ error: "Server is missing GEMINI_API_KEY. Set it in your hosting provider's environment variables." });
//   }

//   const { systemPrompt, contents } = req.body || {};
//   if (!Array.isArray(contents) || contents.length === 0) {
//     return res.status(400).json({ error: "Request must include a non-empty 'contents' array." });
//   }

//   const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
//   const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

//   const body = {
//     contents,
//     ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
//   };

//   try {
//     const r = await fetch(url, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "x-goog-api-key": apiKey,
//       },
//       body: JSON.stringify(body),
//     });

//     const data = await r.json();

//     if (!r.ok) {
//       const message = data?.error?.message || `Gemini API error (${r.status})`;
//       return res.status(r.status).json({ error: message });
//     }

//     const text =
//       data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";

//     if (!text) {
//       // Common cause: response was blocked by safety filters.
//       const finishReason = data?.candidates?.[0]?.finishReason;
//       return res.status(200).json({
//         text: "",
//         warning: finishReason ? `No text returned (finishReason: ${finishReason})` : "No text returned",
//       });
//     }

//     return res.status(200).json({ text });
//   } catch (e) {
//     return res.status(500).json({ error: e.message || "Unknown server error" });
//   }
// }

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
 
  const { systemPrompt, contents } = req.body || {};
  if (!Array.isArray(contents) || contents.length === 0) {
    return res.status(400).json({ error: "Request must include a non-empty 'contents' array." });
  }
 
  const provider = (process.env.LLM_PROVIDER || "gemini").toLowerCase();
 
  try {
    const text = provider === "groq"
      ? await callGroq(systemPrompt, contents)
      : await callGemini(systemPrompt, contents);
 
    if (!text) {
      return res.status(200).json({ text: "", warning: "No text returned by the model." });
    }
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || "Unknown server error" });
  }
}
 
async function callGemini(systemPrompt, contents) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error("Server is missing GEMINI_API_KEY.");
    err.status = 500;
    throw err;
  }
  const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
 
  const body = {
    contents,
    ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
  };
 
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(body),
  });
  const data = await r.json();
 
  if (!r.ok) {
    const err = new Error(data?.error?.message || `Gemini API error (${r.status})`);
    err.status = r.status;
    throw err;
  }
  return data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
}
 
async function callGroq(systemPrompt, contents) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const err = new Error("Server is missing GROQ_API_KEY.");
    err.status = 500;
    throw err;
  }
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
  const url = "https://api.groq.com/openai/v1/chat/completions";
 
  // Translate our Gemini-shaped contents into OpenAI-style messages.
  const messages = [
    ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
    ...contents.map((c) => ({
      role: c.role === "model" ? "assistant" : "user",
      content: (c.parts || []).map((p) => p.text || "").join(""),
    })),
  ];
 
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, max_completion_tokens: 1000 }),
  });
  const data = await r.json();
 
  if (!r.ok) {
    const err = new Error(data?.error?.message || `Groq API error (${r.status})`);
    err.status = r.status;
    throw err;
  }
  return data?.choices?.[0]?.message?.content || "";
}
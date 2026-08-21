// Vercel serverless function — keeps GEMINI_API_KEY on the server.
// The browser never sees the key; it only talks to this endpoint.
//
// Provider switch (local .env or Vercel):
//   LLM_PROVIDER      gemini | groq | deepseek | kimi  (default: gemini)
//
// Gemini:
//   GEMINI_API_KEY      https://aistudio.google.com/apikey
//   GEMINI_MODEL        default gemini-3.6-flash
//
// Groq:
//   GROQ_API_KEY
//   GROQ_MODEL          default openai/gpt-oss-20b
//
// DeepSeek:
//   DEEPSEEK_API_KEY    https://platform.deepseek.com
//   DEEPSEEK_MODEL      default deepseek-chat
//
// Kimi (Moonshot):
//   KIMI_API_KEY        https://platform.kimi.ai/console/api-keys
//   KIMI_MODEL          default kimi-k3
//   KIMI_API_BASE       default https://api.moonshot.ai/v1

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
    let text;
    if (provider === "groq") {
      text = await callGroq(systemPrompt, contents);
    } else if (provider === "deepseek") {
      text = await callDeepSeek(systemPrompt, contents);
    } else if (provider === "kimi") {
      text = await callKimi(systemPrompt, contents);
    } else {
      text = await callGemini(systemPrompt, contents);
    }
 
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
 
function toChatMessages(systemPrompt, contents) {
  return [
    ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
    ...contents.map((c) => ({
      role: c.role === "model" ? "assistant" : "user",
      content: (c.parts || []).map((p) => p.text || "").join(""),
    })),
  ];
}

async function callOpenAICompatible({ apiKey, model, url, label, systemPrompt, contents }) {
  const messages = toChatMessages(systemPrompt, contents);
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, max_tokens: 1000 }),
  });
  const data = await r.json();

  if (!r.ok) {
    const err = new Error(data?.error?.message || `${label} API error (${r.status})`);
    err.status = r.status;
    throw err;
  }
  return data?.choices?.[0]?.message?.content || "";
}

async function callGroq(systemPrompt, contents) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const err = new Error("Server is missing GROQ_API_KEY.");
    err.status = 500;
    throw err;
  }
  return callOpenAICompatible({
    apiKey,
    model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
    url: "https://api.groq.com/openai/v1/chat/completions",
    label: "Groq",
    systemPrompt,
    contents,
  });
}

async function callDeepSeek(systemPrompt, contents) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    const err = new Error("Server is missing DEEPSEEK_API_KEY.");
    err.status = 500;
    throw err;
  }
  return callOpenAICompatible({
    apiKey,
    model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    url: "https://api.deepseek.com/chat/completions",
    label: "DeepSeek",
    systemPrompt,
    contents,
  });
}

async function callKimi(systemPrompt, contents) {
  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) {
    const err = new Error("Server is missing KIMI_API_KEY.");
    err.status = 500;
    throw err;
  }
  const base = (process.env.KIMI_API_BASE || "https://api.moonshot.ai/v1").replace(/\/$/, "");
  return callOpenAICompatible({
    apiKey,
    model: process.env.KIMI_MODEL || "kimi-k3",
    url: `${base}/chat/completions`,
    label: "Kimi",
    systemPrompt,
    contents,
  });
}
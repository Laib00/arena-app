// Calls our own serverless proxy at /api/gemini — the Gemini API key
// lives only on the server (see api/gemini.js), never in this browser code.

async function callGemini(systemPrompt, messages) {
  // Internal messages use { role: 'user' | 'assistant', content }.
  // Gemini's API expects { role: 'user' | 'model', parts: [{ text }] }.
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemPrompt, contents }),
  });

  const raw = await response.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(
      "AI API returned an empty or invalid response. " +
        "If you're on localhost, use `vercel dev` (not only `npm run dev`) so /api/gemini runs, " +
        "or test on the live Vercel site. Also check GEMINI_API_KEY / LLM_PROVIDER."
    );
  }
  if (!response.ok) throw new Error(data?.error || `Request failed (${response.status})`);
  return data?.text || (data?.warning ? `(${data.warning})` : "(no response)");
}

export { callGemini };
